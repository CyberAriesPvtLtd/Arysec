'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('node:http');

// Setup test environment variables before importing app
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arysec-hr-test-'));
process.env.DB_FILE = path.join(tmpDir, 'test.db');
process.env.UPLOAD_DIR = path.join(tmpDir, 'uploads');
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.RATE_FORM_MAX = '1000';
process.env.RATE_GLOBAL_MAX = '5000';
process.env.MIN_FORM_SECONDS = '0';

// Config variables for HR Onboarding
process.env.HR_API_SECRET = 'test-secret-token-12345';
process.env.HR_GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/ABC/exec';
process.env.HR_GOOGLE_SHEET_ID = 'test-sheet-id';
process.env.HR_SUBMISSIONS_FOLDER_ID = 'test-submissions-folder-id';

const { createApp } = require('../server/app');
const { closeDb } = require('../server/lib/db');

let server;
let base;
const originalFetch = globalThis.fetch;

test.before(async () => {
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  closeDb();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

function postJson(pathname, body) {
  return fetch(base + pathname, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
}

const validRegistration = () => ({
  type: 'employee',
  name: 'John Doe',
  preferredName: 'Johnny',
  personalEmail: 'john.doe@example.com',
  phone: '+91 98765 43210',
  dateOfBirth: '1995-05-15',
  gender: 'Male',
  currentResidentialAddress: '123 Test St, Andheri East',
  permanentAddress: '123 Test St, Andheri East',
  city: 'Mumbai',
  state: 'Maharashtra',
  pinCode: '400069',
  emergencyContactName: 'Jane Doe',
  emergencyContactRelationship: 'Spouse',
  emergencyContactPhone: '+91 98765 43211',
  joiningDate: '2026-09-01',
  department: 'Consulting',
  position: 'Security Consultant',
  highestQualification: 'B.Tech',
  degreeCourse: 'Bachelor of Technology',
  branchSpecialization: 'Computer Science',
  collegeUniversity: 'Mumbai University',
  graduationYear: '2017',
  cgpaPercentage: '8.5 CGPA',
  currentYearSemester: '',
  professionalCertifications: '',
  previousExperience: 'No',
  bankName: 'HDFC Bank',
  bankAccountHolderName: 'John Doe',
  accountNumber: '1234567890',
  ifsc: 'HDFC0000240',
  pan: 'ABCDE1234F',
  uanPfDetails: '',
  esicDetails: '',
  declarationAccuracy: 'yes',
  policyAcknowledgement: 'yes',
  documentAuthenticity: 'yes',
  hrProcessingConsent: 'yes',
  formLoadedAt: String(Date.now() - 5000),
  website: '',
});

test('onboarding registration validation rejects missing fields', async () => {
  const res = await postJson('/api/hr/register', {});
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.ok, false);
  assert.ok(data.errors.type);
  assert.ok(data.errors.name);
  assert.ok(data.errors.personalEmail);
});

test('onboarding registration successfully calls Google Script', async () => {
  let scriptCalled = false;
  let receivedPayload = null;

  globalThis.fetch = async (url, options) => {
    if (url === 'https://script.google.com/macros/s/ABC/exec') {
      scriptCalled = true;
      receivedPayload = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          success: true,
          duplicate: false,
          recordId: 'EMP-2026-001',
          folderId: 'folder-123',
          folderUrl: 'https://drive.google.com/folder-123',
        }),
      };
    }
    return originalFetch(url, options);
  };

  const res = await postJson('/api/hr/register', validRegistration());
  assert.equal(res.status, 200);
  assert.ok(scriptCalled);
  assert.equal(receivedPayload.secret, 'test-secret-token-12345');
  assert.equal(receivedPayload.action, 'register');
  assert.equal(receivedPayload.name, 'John Doe');
  assert.equal(receivedPayload.type, 'employee');
  assert.equal(receivedPayload.recordType, 'Employee');

  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.recordId, 'EMP-2026-001');
  assert.equal(data.folderId, 'folder-123');
});

test('onboarding registration handles duplicate profiles', async () => {
  globalThis.fetch = async (url, options) => {
    if (url === 'https://script.google.com/macros/s/ABC/exec') {
      return {
        ok: true,
        json: async () => ({
          success: true,
          duplicate: true,
          recordId: 'EMP-2026-001',
          folderUrl: 'https://drive.google.com/folder-123',
        }),
      };
    }
    return originalFetch(url, options);
  };

  const res = await postJson('/api/hr/register', validRegistration());
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.duplicate, true);
  assert.equal(data.recordId, 'EMP-2026-001');
});

test('onboarding file upload rejects missing parameters', async () => {
  const res = await fetch(base + '/api/hr/upload', {
    method: 'POST',
    body: new FormData(),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.ok, false);
});

test('onboarding file upload rejects invalid magic bytes', async () => {
  const form = new FormData();
  form.append('folderId', 'folder-123');
  form.append('subfolderName', 'Resume');
  
  // Create a fake txt file and name it resume.pdf
  const blob = new Blob(['Not a PDF file content'], { type: 'application/pdf' });
  form.append('file', blob, 'resume.pdf');

  const res = await fetch(base + '/api/hr/upload', {
    method: 'POST',
    body: form,
  });
  
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.ok, false);
  assert.match(data.error, /does not appear to be/);
});

test('onboarding file upload accepts valid files and uploads to script', async () => {
  let uploadCalled = false;
  let receivedPayload = null;

  globalThis.fetch = async (url, options) => {
    if (url === 'https://script.google.com/macros/s/ABC/exec') {
      uploadCalled = true;
      receivedPayload = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          success: true,
          fileUrl: 'https://drive.google.com/file-456',
        }),
      };
    }
    return originalFetch(url, options);
  };

  const form = new FormData();
  form.append('folderId', 'folder-123');
  form.append('subfolderName', 'Resume');
  
  // Real PDF signature is '%PDF-'
  const blob = new Blob(['%PDF-1.4 file content'], { type: 'application/pdf' });
  form.append('file', blob, 'resume.pdf');

  const res = await fetch(base + '/api/hr/upload', {
    method: 'POST',
    body: form,
  });
  
  assert.equal(res.status, 200);
  assert.ok(uploadCalled);
  assert.equal(receivedPayload.secret, 'test-secret-token-12345');
  assert.equal(receivedPayload.action, 'uploadFile');
  assert.equal(receivedPayload.folderId, 'folder-123');
  assert.equal(receivedPayload.subfolderName, 'Resume');
  
  // verify base64 data encoding
  const decoded = Buffer.from(receivedPayload.base64Data, 'base64').toString();
  assert.ok(decoded.startsWith('%PDF-'));

  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.fileUrl, 'https://drive.google.com/file-456');
});

test('onboarding registration handles intern classification and casing normalization', async () => {
  let scriptCalled = false;
  let receivedPayload = null;

  globalThis.fetch = async (url, options) => {
    if (url === 'https://script.google.com/macros/s/ABC/exec') {
      scriptCalled = true;
      receivedPayload = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          success: true,
          duplicate: false,
          recordId: 'INT-2026-001',
          folderId: 'folder-intern-123',
          folderUrl: 'https://drive.google.com/folder-intern-123',
        }),
      };
    }
    return originalFetch(url, options);
  };

  const internReg = validRegistration();
  internReg.type = 'Intern'; // Test TitleCase input
  internReg.previousExperience = 'no'; // Test lowercase input
  internReg.policyAcknowledgement = 'yes';
  internReg.declarationAccuracy = 'yes';
  internReg.documentAuthenticity = 'yes';
  internReg.hrProcessingConsent = 'yes';

  const res = await postJson('/api/hr/register', internReg);
  assert.equal(res.status, 200);
  assert.ok(scriptCalled);
  assert.equal(receivedPayload.type, 'intern');
  assert.equal(receivedPayload.recordType, 'Intern');
  assert.equal(receivedPayload.previousExperience, 'No');

  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(data.recordId, 'INT-2026-001');
  assert.equal(data.folderId, 'folder-intern-123');
});

test('onboarding registration rejects missing declarations/consent', async () => {
  const missingConsent = validRegistration();
  missingConsent.policyAcknowledgement = false;

  const res = await postJson('/api/hr/register', missingConsent);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.ok, false);
  assert.ok(data.errors.policyAcknowledgement);
});

test('onboarding registration enforces strict field format restrictions', async () => {
  // Test Name with numbers
  const badName = validRegistration();
  badName.name = 'John Doe 123';
  const resName = await postJson('/api/hr/register', badName);
  assert.equal(resName.status, 400);
  const dataName = await resName.json();
  assert.ok(dataName.errors.name);

  // Test Phone with invalid length (not 10 digits)
  const badPhone = validRegistration();
  badPhone.phone = '123456';
  const resPhone = await postJson('/api/hr/register', badPhone);
  assert.equal(resPhone.status, 400);
  const dataPhone = await resPhone.json();
  assert.ok(dataPhone.errors.phone);

  // Test PIN code not 6 digits
  const badPin = validRegistration();
  badPin.pinCode = '1234';
  const resPin = await postJson('/api/hr/register', badPin);
  assert.equal(resPin.status, 400);
  const dataPin = await resPin.json();
  assert.ok(dataPin.errors.pinCode);

  // Test invalid PAN
  const badPan = validRegistration();
  badPan.pan = '12345ABCDE';
  const resPan = await postJson('/api/hr/register', badPan);
  assert.equal(resPan.status, 400);
  const dataPan = await resPan.json();
  assert.ok(dataPan.errors.pan);

  // Test invalid IFSC
  const badIfsc = validRegistration();
  badIfsc.ifsc = 'HDFC123';
  const resIfsc = await postJson('/api/hr/register', badIfsc);
  assert.equal(resIfsc.status, 400);
  const dataIfsc = await resIfsc.json();
  assert.ok(dataIfsc.errors.ifsc);

  // Test invalid Account Number (too short)
  const badAcc = validRegistration();
  badAcc.accountNumber = '123';
  const resAcc = await postJson('/api/hr/register', badAcc);
  assert.equal(resAcc.status, 400);
  const dataAcc = await resAcc.json();
  assert.ok(dataAcc.errors.accountNumber);

  // Test Phone starting with invalid digit (e.g. 1-5)
  const badPhoneStart = validRegistration();
  badPhoneStart.phone = '1234567890';
  const resPhoneStart = await postJson('/api/hr/register', badPhoneStart);
  assert.equal(resPhoneStart.status, 400);
  const dataPhoneStart = await resPhoneStart.json();
  assert.ok(dataPhoneStart.errors.phone);

  // Test City with numbers
  const badCity = validRegistration();
  badCity.city = 'Mumbai 400';
  const resCity = await postJson('/api/hr/register', badCity);
  assert.equal(resCity.status, 400);
  const dataCity = await resCity.json();
  assert.ok(dataCity.errors.city);

  // Test Graduation Year not 4 digits
  const badGrad = validRegistration();
  badGrad.graduationYear = '20';
  const resGrad = await postJson('/api/hr/register', badGrad);
  assert.equal(resGrad.status, 400);
  const dataGrad = await resGrad.json();
  assert.ok(dataGrad.errors.graduationYear);
});


