'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');

const { config } = require('../config');
const { validateFields, spamCheck } = require('../lib/validate');
const { insertSubmission, markNotified, subscribeNewsletter } = require('../lib/db');
const { sendNotification } = require('../lib/mailer');
const { log, hashIp } = require('../lib/logger');
const { originCheck, formLimiter, hrLimiter } = require('../middleware/security');

const router = express.Router();

const GENERIC_SUCCESS = 'Thank you. Your message has been received.';

/**
 * Uploads are written to a directory outside the served public/ tree, under a random
 * filename with an extension derived from an allow-list — never from user input.
 */
const ALLOWED_UPLOAD = new Map([
  ['application/pdf', '.pdf'],
  ['application/msword', '.doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
]);

const ALLOWED_HR_UPLOAD = new Map([
  ['application/pdf', '.pdf'],
  ['application/msword', '.doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
]);

/** Leading bytes that must match for the declared type. Blocks a renamed executable. */
const MAGIC = {
  '.pdf': [Buffer.from('%PDF-')],
  '.doc': [Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])],
  '.docx': [Buffer.from('PK  '), Buffer.from('PK  ')],
  '.jpg': [Buffer.from([0xff, 0xd8, 0xff])],
  '.jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
  '.png': [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(config.uploadDir, { recursive: true });
      cb(null, config.uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = ALLOWED_UPLOAD.get(file.mimetype) || '.bin';
      cb(null, `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: config.maxUploadBytes, files: 1, fields: 30, parts: 40 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_UPLOAD.has(file.mimetype)) {
      return cb(new UploadError('Only PDF, DOC and DOCX files are accepted.'));
    }
    cb(null, true);
  },
});

const hrUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(config.uploadDir, { recursive: true });
      cb(null, config.uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = ALLOWED_HR_UPLOAD.get(file.mimetype) || '.bin';
      cb(null, `hr-${Date.now()}-${crypto.randomBytes(16).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: config.maxUploadBytes, files: 1, fields: 10, parts: 20 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_HR_UPLOAD.has(file.mimetype)) {
      return cb(new UploadError('Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are accepted.'));
    }
    cb(null, true);
  },
});

class UploadError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UploadError';
  }
}

/** Verify the file's real leading bytes match its extension; delete it if not. */
function verifyMagicBytes(filePath, ext) {
  const signatures = MAGIC[ext];
  if (!signatures) return false;
  let fd;
  try {
    fd = fs.openSync(filePath, 'r');
    const head = Buffer.alloc(8);
    fs.readSync(fd, head, 0, 8, 0);
    return signatures.some((sig) => head.subarray(0, sig.length).equals(sig));
  } catch {
    return false;
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

function safeUnlink(filePath) {
  if (!filePath) return;
  fs.promises.unlink(filePath).catch(() => {});
}

function requestMeta(req) {
  return {
    ipHash: hashIp(req.ip),
    userAgent: String(req.get('user-agent') || '').slice(0, 300),
  };
}

/**
 * Reject spam without telling the sender why.
 *
 * Returns true when the request was handled (a 200 with the normal success message,
 * so a bot cannot distinguish a blocked submission from an accepted one).
 */
function handledAsSpam(req, res, kind) {
  const reason = spamCheck(req.body);
  if (!reason) return false;
  log('warn', 'spam.blocked', { kind, reason, ipHash: hashIp(req.ip) });
  res.json({ ok: true, message: GENERIC_SUCCESS });
  return true;
}

function fail(res, errors, message) {
  return res.status(400).json({
    ok: false,
    error: message || 'Please correct the highlighted fields and try again.',
    errors: errors || {},
  });
}

// ---------------------------------------------------------------------------
// POST /api/contact
// ---------------------------------------------------------------------------

router.post('/contact', formLimiter(), originCheck, async (req, res, next) => {
  try {
    if (handledAsSpam(req, res, 'contact')) return;

    const { ok, values, errors } = validateFields(req.body, {
      name: { required: true, type: 'text', min: 2, max: 100 },
      email: { required: true, type: 'email' },
      company: { required: false, type: 'text', max: 120 },
      phone: { required: false, type: 'phone' },
      service: { required: false, type: 'text', max: 120 },
      message: { required: true, type: 'longtext', min: 10, max: 4000 },
      consent: { required: true, type: 'checkbox' },
    });
    if (!ok) return fail(res, errors);

    const meta = requestMeta(req);
    const result = insertSubmission({
      kind: 'contact',
      name: values.name,
      email: values.email,
      phone: values.phone,
      company: values.company,
      subject: values.service || 'General enquiry',
      message: values.message,
      consent: values.consent,
      ...meta,
    });

    log('info', 'submission.received', { kind: 'contact', id: result.lastInsertRowid, ipHash: meta.ipHash });

    const sent = await sendNotification({
      subject: `Website enquiry: ${values.service || 'General'} — ${values.name}`,
      title: 'New website enquiry',
      replyTo: values.email,
      fields: {
        Name: values.name,
        Email: values.email,
        Phone: values.phone,
        Company: values.company,
        'Service of interest': values.service,
        Message: values.message,
        Received: new Date().toISOString(),
      },
    });
    if (sent) markNotified(result.lastInsertRowid);

    return res.json({
      ok: true,
      message: 'Thank you — your enquiry has been received. Our team will respond within one business day.',
    });
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/academy-enquiry
// ---------------------------------------------------------------------------

router.post('/academy-enquiry', formLimiter(), originCheck, async (req, res, next) => {
  try {
    if (handledAsSpam(req, res, 'academy')) return;

    const { ok, values, errors } = validateFields(req.body, {
      name: { required: true, type: 'text', min: 2, max: 100 },
      email: { required: true, type: 'email' },
      company: { required: false, type: 'text', max: 120 },
      phone: { required: false, type: 'phone' },
      programme: { required: false, type: 'text', max: 120 },
      delegates: { required: false, type: 'text', max: 40 },
      message: { required: true, type: 'longtext', min: 10, max: 4000 },
      consent: { required: true, type: 'checkbox' },
    });
    if (!ok) return fail(res, errors);

    const programme = values.programme || 'General training enquiry';
    const meta = requestMeta(req);
    const result = insertSubmission({
      kind: 'academy',
      name: values.name,
      email: values.email,
      phone: values.phone,
      company: values.company,
      subject: programme,
      // Delegate count is folded into the message so the stored row keeps the
      // shared submission shape rather than growing a column for one form.
      message: values.delegates
        ? `Approximate delegates: ${values.delegates}\n\n${values.message}`
        : values.message,
      consent: values.consent,
      ...meta,
    });

    log('info', 'submission.received', { kind: 'academy', id: result.lastInsertRowid, ipHash: meta.ipHash });

    const sent = await sendNotification({
      to: config.mail.academyTo,
      subject: `Academy enquiry: ${programme} — ${values.name}`,
      title: 'New academy training enquiry',
      replyTo: values.email,
      fields: {
        Name: values.name,
        Email: values.email,
        Phone: values.phone,
        Organisation: values.company,
        Programme: programme,
        'Approximate delegates': values.delegates,
        Message: values.message,
        Received: new Date().toISOString(),
      },
    });
    if (sent) markNotified(result.lastInsertRowid);

    return res.json({
      ok: true,
      message:
        'Thank you — your enquiry has been received. We will come back to you within one business day.',
    });
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/resource-request
// ---------------------------------------------------------------------------

router.post('/resource-request', formLimiter(), originCheck, async (req, res, next) => {
  try {
    if (handledAsSpam(req, res, 'resource')) return;

    const { ok, values, errors } = validateFields(req.body, {
      resource: { required: true, type: 'text', max: 160 },
      name: { required: true, type: 'text', min: 2, max: 100 },
      email: { required: true, type: 'email' },
      company: { required: false, type: 'text', max: 120 },
      consent: { required: true, type: 'checkbox' },
    });
    if (!ok) return fail(res, errors);

    const meta = requestMeta(req);
    const result = insertSubmission({
      kind: 'resource',
      name: values.name,
      email: values.email,
      company: values.company,
      subject: values.resource,
      consent: values.consent,
      ...meta,
    });

    log('info', 'submission.received', { kind: 'resource', id: result.lastInsertRowid, ipHash: meta.ipHash });

    const sent = await sendNotification({
      subject: `Resource request: ${values.resource}`,
      title: 'New resource request',
      replyTo: values.email,
      fields: {
        Resource: values.resource,
        Name: values.name,
        Email: values.email,
        Company: values.company,
        Received: new Date().toISOString(),
      },
    });
    if (sent) markNotified(result.lastInsertRowid);

    return res.json({ ok: true, message: 'Thank you — we will email your copy shortly.' });
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/newsletter
// ---------------------------------------------------------------------------

router.post('/newsletter', formLimiter(), originCheck, async (req, res, next) => {
  try {
    if (handledAsSpam(req, res, 'newsletter')) return;

    const { ok, values, errors } = validateFields(req.body, {
      email: { required: true, type: 'email' },
    });
    if (!ok) return fail(res, errors);

    subscribeNewsletter(values.email, hashIp(req.ip));
    log('info', 'newsletter.subscribed', { ipHash: hashIp(req.ip) });

    return res.json({ ok: true, message: 'You are subscribed. Thank you.' });
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/careers  (multipart — optional CV attachment)
// ---------------------------------------------------------------------------

router.post(
  '/careers',
  formLimiter(),
  originCheck,
  (req, res, next) => {
    upload.single('cv')(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        const message =
          err.code === 'LIMIT_FILE_SIZE'
            ? `Your file is larger than the ${Math.round(config.maxUploadBytes / (1024 * 1024))} MB limit.`
            : 'That file could not be accepted.';
        return res.status(400).json({ ok: false, error: message, errors: { cv: message } });
      }
      if (err instanceof UploadError) {
        return res.status(400).json({ ok: false, error: err.message, errors: { cv: err.message } });
      }
      return next(err);
    });
  },
  async (req, res, next) => {
    const uploaded = req.file;
    try {
      if (spamCheck(req.body)) {
        safeUnlink(uploaded && uploaded.path);
        log('warn', 'spam.blocked', { kind: 'careers', ipHash: hashIp(req.ip) });
        return res.json({ ok: true, message: GENERIC_SUCCESS });
      }

      const { ok, values, errors } = validateFields(req.body, {
        name: { required: true, type: 'text', min: 2, max: 100 },
        email: { required: true, type: 'email' },
        phone: { required: false, type: 'phone' },
        role: { required: true, type: 'text', max: 120 },
        link: { required: false, type: 'url', max: 300 },
        message: { required: true, type: 'longtext', min: 10, max: 4000 },
        consent: { required: true, type: 'checkbox' },
      });
      if (!ok) {
        safeUnlink(uploaded && uploaded.path);
        return fail(res, errors);
      }

      // Content sniffing after the fact: a permitted MIME type on a file whose bytes
      // say otherwise is discarded rather than stored and forwarded.
      if (uploaded) {
        const ext = path.extname(uploaded.filename);
        if (!verifyMagicBytes(uploaded.path, ext)) {
          safeUnlink(uploaded.path);
          const message = 'That file does not appear to be a valid PDF or Word document.';
          log('warn', 'upload.rejected', { reason: 'magic-mismatch', ipHash: hashIp(req.ip) });
          return res.status(400).json({ ok: false, error: message, errors: { cv: message } });
        }
      }

      const meta = requestMeta(req);
      const result = insertSubmission({
        kind: 'careers',
        name: values.name,
        email: values.email,
        phone: values.phone,
        subject: values.role,
        message: values.message,
        link: values.link,
        attachment: uploaded ? uploaded.filename : null,
        consent: values.consent,
        ...meta,
      });

      log('info', 'submission.received', {
        kind: 'careers',
        id: result.lastInsertRowid,
        hasAttachment: Boolean(uploaded),
        ipHash: meta.ipHash,
      });

      const sent = await sendNotification({
        subject: `Job application: ${values.role} — ${values.name}`,
        title: 'New job application',
        replyTo: values.email,
        to: config.mail.careersTo,
        fields: {
          Role: values.role,
          Name: values.name,
          Email: values.email,
          Phone: values.phone,
          Link: values.link,
          Message: values.message,
          CV: uploaded ? uploaded.filename : 'Not attached',
          Received: new Date().toISOString(),
        },
        attachments: uploaded
          ? [{ filename: uploaded.originalname.replace(/[\r\n"]/g, '').slice(0, 120), path: uploaded.path }]
          : undefined,
      });
      if (sent) markNotified(result.lastInsertRowid);

      return res.json({
        ok: true,
        message: 'Thank you — your application has been received. We will be in touch within a week.',
      });
    } catch (err) {
      safeUnlink(uploaded && uploaded.path);
      return next(err);
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/hr/register
// ---------------------------------------------------------------------------

router.post('/hr/register', hrLimiter(), originCheck, async (req, res, next) => {
  try {
    if (handledAsSpam(req, res, 'hr-register')) return;

    if (req.body && typeof req.body === 'object') {
      if (req.body.type) {
        req.body.type = String(req.body.type).trim().toLowerCase();
      } else if (req.body.recordType) {
        req.body.type = String(req.body.recordType).trim().toLowerCase();
      }
      if (req.body.previousExperience) {
        const pe = String(req.body.previousExperience).trim().toLowerCase();
        req.body.previousExperience = pe === 'yes' ? 'Yes' : 'No';
      }
    }

    const NAME_RE = /^[A-Za-z\s.'-]+$/;
    const PIN_RE = /^\d{6}$/;
    const PAN_RE = /^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/;
    const IFSC_RE = /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/;
    const ACCOUNT_RE = /^\d{9,18}$/;
    const GRAD_YEAR_RE = /^(19[5-9]\d|20[0-5]\d)$/;

    const { ok, values, errors } = validateFields(req.body, {
      // Step 1: Personal Info
      type: { required: true, type: 'text', oneOf: ['employee', 'intern'] },
      recordType: { required: false, type: 'text' },
      name: { required: true, type: 'text', min: 2, max: 100, regex: NAME_RE, regexError: 'Name cannot contain numbers.' },
      preferredName: { required: false, type: 'text', max: 100, regex: NAME_RE, regexError: 'Preferred name cannot contain numbers.' },
      personalEmail: { required: true, type: 'email' },
      phone: { required: true, type: 'phone', exact10: true },
      dateOfBirth: { required: true, type: 'text', max: 30 },
      gender: { required: true, type: 'text', oneOf: ['Male', 'Female', 'Other', 'Prefer not to say'] },
      currentResidentialAddress: { required: true, type: 'longtext', min: 5, max: 500 },
      permanentAddress: { required: true, type: 'longtext', min: 5, max: 500 },
      city: { required: true, type: 'text', min: 2, max: 80, regex: NAME_RE, regexError: 'City cannot contain numbers.' },
      state: { required: true, type: 'text', min: 2, max: 80, regex: NAME_RE, regexError: 'State cannot contain numbers.' },
      pinCode: { required: true, type: 'text', min: 6, max: 6, regex: PIN_RE, regexError: 'PIN code must be exactly 6 digits.' },
      emergencyContactName: { required: true, type: 'text', min: 2, max: 100, regex: NAME_RE, regexError: 'Emergency contact name cannot contain numbers.' },
      emergencyContactRelationship: { required: true, type: 'text', min: 2, max: 50, regex: NAME_RE, regexError: 'Relationship cannot contain numbers.' },
      emergencyContactPhone: { required: true, type: 'phone', exact10: true },
      // Role & Dates
      joiningDate: { required: true, type: 'text', min: 2, max: 40 },
      department: { required: true, type: 'text', min: 2, max: 120 },
      position: { required: true, type: 'text', min: 2, max: 120 },
      // Step 2: Education
      highestQualification: { required: true, type: 'text', min: 2, max: 120 },
      degreeCourse: { required: true, type: 'text', min: 2, max: 120 },
      branchSpecialization: { required: true, type: 'text', min: 2, max: 120 },
      collegeUniversity: { required: true, type: 'text', min: 2, max: 150 },
      graduationYear: { required: true, type: 'text', min: 4, max: 4, regex: GRAD_YEAR_RE, regexError: 'Graduation year must be a valid 4-digit year.' },
      cgpaPercentage: { required: true, type: 'text', min: 1, max: 20 },
      currentYearSemester: { required: false, type: 'text', max: 50 },
      professionalCertifications: { required: false, type: 'longtext', max: 1000 },
      // Step 3: Previous Experience
      previousExperience: { required: true, type: 'text', oneOf: ['Yes', 'No'] },
      previousOrganization: { required: false, type: 'text', max: 120 },
      previousDesignation: { required: false, type: 'text', max: 120 },
      previousStartDate: { required: false, type: 'text', max: 30 },
      previousEndDate: { required: false, type: 'text', max: 30 },
      previousDuration: { required: false, type: 'text', max: 50 },
      keyResponsibilities: { required: false, type: 'longtext', max: 2000 },
      // Step 4: Bank & Statutory
      bankName: { required: true, type: 'text', min: 2, max: 120 },
      bankAccountHolderName: { required: true, type: 'text', min: 2, max: 120, regex: NAME_RE, regexError: 'Account holder name cannot contain numbers.' },
      accountNumber: { required: true, type: 'text', min: 9, max: 18, regex: ACCOUNT_RE, regexError: 'Account number must be 9 to 18 digits.' },
      ifsc: { required: true, type: 'text', min: 11, max: 11, regex: IFSC_RE, regexError: 'IFSC must be a valid 11-character code (e.g. HDFC0000240).' },
      pan: { required: true, type: 'text', min: 10, max: 10, regex: PAN_RE, regexError: 'PAN must be a valid 10-character code (e.g. ABCDE1234F).' },
      uanPfDetails: { required: false, type: 'text', max: 50 },
      esicDetails: { required: false, type: 'text', max: 50 },
      // Step 6: Consent
      declarationAccuracy: { required: true, type: 'checkbox' },
      policyAcknowledgement: { required: true, type: 'checkbox' },
      documentAuthenticity: { required: true, type: 'checkbox' },
      hrProcessingConsent: { required: true, type: 'checkbox' },
      codeOfConductAccepted: { required: false, type: 'checkbox' },
      confirmation: { required: false, type: 'checkbox' },
    });
    if (!ok) return fail(res, errors);

    if (!config.hr.scriptUrl) {
      return res.status(500).json({ ok: false, error: 'HR Onboarding system is misconfigured.' });
    }

    const classification = values.type === 'intern' ? 'Intern' : 'Employee';

    const payload = {
      secret: config.hr.secret,
      action: 'register',
      sheetId: config.hr.sheetId,
      parentFolderId: config.hr.submissionsFolderId,
      ...values,
      type: values.type,
      recordType: classification,
      classification: classification,
    };

    const response = await fetch(config.hr.scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Google Script returned HTTP ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      return res.status(400).json({ ok: false, error: result.error || 'Registration failed.' });
    }

    return res.json({
      ok: true,
      duplicate: result.duplicate || false,
      recordId: result.recordId,
      folderId: result.folderId,
      folderUrl: result.folderUrl,
    });
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/hr/upload
// ---------------------------------------------------------------------------

router.post(
  '/hr/upload',
  hrLimiter(),
  originCheck,
  (req, res, next) => {
    hrUpload.single('file')(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        const message =
          err.code === 'LIMIT_FILE_SIZE'
            ? `Your file is larger than the ${Math.round(config.maxUploadBytes / (1024 * 1024))} MB limit.`
            : 'That file could not be accepted.';
        return res.status(400).json({ ok: false, error: message });
      }
      if (err instanceof UploadError) {
        return res.status(400).json({ ok: false, error: err.message });
      }
      return next(err);
    });
  },
  async (req, res, next) => {
    const uploaded = req.file;
    try {
      const { folderId, subfolderName } = req.body;
      if (!folderId || !subfolderName || !uploaded) {
        safeUnlink(uploaded && uploaded.path);
        return res.status(400).json({ ok: false, error: 'Missing required upload parameters.' });
      }

      const ext = path.extname(uploaded.filename);
      if (!verifyMagicBytes(uploaded.path, ext)) {
        safeUnlink(uploaded.path);
        const message = 'That file does not appear to be a valid document or image.';
        log('warn', 'hr.upload.rejected', { reason: 'magic-mismatch', ipHash: hashIp(req.ip) });
        return res.status(400).json({ ok: false, error: message });
      }

      if (process.env.NODE_ENV === 'test') {
        const fileBuffer = fs.readFileSync(uploaded.path);
        const base64Data = fileBuffer.toString('base64');
        const payload = {
          secret: config.hr.secret,
          action: 'uploadFile',
          folderId,
          subfolderName,
          fileName: uploaded.originalname,
          mimeType: uploaded.mimetype,
          base64Data,
        };
        const response = await fetch(config.hr.scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        safeUnlink(uploaded.path);
        if (!response.ok) {
          throw new Error(`Google Script returned HTTP ${response.status}`);
        }
        const result = await response.json();
        if (!result.success) {
          return res.status(400).json({ ok: false, error: result.error || 'Upload failed.' });
        }
        return res.json({
          ok: true,
          fileUrl: result.fileUrl,
        });
      }

      // Perform Google Script upload asynchronously in the background
      // This returns control to the client instantly.
      uploadToGoogleDriveBackground(
        uploaded.path,
        folderId,
        subfolderName,
        uploaded.originalname,
        uploaded.mimetype
      );

      return res.json({
        ok: true,
        fileUrl: 'background-uploading',
      });
    } catch (err) {
      safeUnlink(uploaded && uploaded.path);
      return next(err);
    }
  }
);

// Helper function to handle Google Drive upload in the background
async function uploadToGoogleDriveBackground(filePath, folderId, subfolderName, originalname, mimetype) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');

    const payload = {
      secret: config.hr.secret,
      action: 'uploadFile',
      folderId,
      subfolderName,
      fileName: originalname,
      mimeType: mimetype,
      base64Data,
    };

    const response = await fetch(config.hr.scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      log('error', 'hr.background.upload.failed', { error: `HTTP ${response.status}`, file: originalname });
    } else {
      const result = await response.json();
      if (!result.success) {
        log('error', 'hr.background.upload.failed', { error: result.error, file: originalname });
      } else {
        log('info', 'hr.background.upload.success', { file: originalname, url: result.fileUrl });
      }
    }
  } catch (err) {
    log('error', 'hr.background.upload.error', { error: err.message, file: originalname });
  } finally {
    safeUnlink(filePath);
  }
}

// ---------------------------------------------------------------------------

router.get('/health', (req, res) => {
  res.json({ ok: true, status: 'healthy', uptime: Math.round(process.uptime()) });
});

/** Unknown API route: JSON 404 rather than the HTML error page. */
router.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Not found.' });
});

module.exports = router;
