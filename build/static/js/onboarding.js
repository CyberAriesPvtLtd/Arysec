'use strict';

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('onboardingForm');
  const container = document.getElementById('onboardingContainer');
  if (!form || !container) return;

  // Stamp form loaded timestamp for spam checks
  const stamp = form.querySelector('input[name="formLoadedAt"]');
  if (stamp) stamp.value = String(Date.now());

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_EXTS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];

  // Selected files cache
  const fileCache = {};

  // Tab switcher action
  const tabEmployee = document.getElementById('tabEmployee');
  const tabIntern = document.getElementById('tabIntern');
  const onboardingType = document.getElementById('onboardingType');
  const onboardingRecordType = document.getElementById('onboardingRecordType');

  if (tabEmployee && tabIntern) {
    tabEmployee.addEventListener('click', function() {
      tabEmployee.classList.add('active');
      tabIntern.classList.remove('active');
      if (onboardingType) onboardingType.value = 'employee';
      if (onboardingRecordType) onboardingRecordType.value = 'Employee';
    });

    tabIntern.addEventListener('click', function() {
      tabIntern.classList.add('active');
      tabEmployee.classList.remove('active');
      if (onboardingType) onboardingType.value = 'intern';
      if (onboardingRecordType) onboardingRecordType.value = 'Intern';
    });
  }

  // Handle previousExperience radio toggles
  const expRadios = form.querySelectorAll('input[name="previousExperience"]');
  const expDetailsSec = document.getElementById('experienceDetailsSection');
  if (expRadios && expDetailsSec) {
    expRadios.forEach(radio => {
      radio.addEventListener('change', function() {
        if (this.value === 'Yes') {
          expDetailsSec.style.display = 'block';
          // Add required attribute dynamically for validation
          ['previousOrganization', 'previousDesignation', 'previousStartDate', 'previousEndDate', 'previousDuration', 'keyResponsibilities'].forEach(fId => {
            const el = document.getElementById(fId);
            if (el) el.required = true;
          });
        } else {
          expDetailsSec.style.display = 'none';
          ['previousOrganization', 'previousDesignation', 'previousStartDate', 'previousEndDate', 'previousDuration', 'keyResponsibilities'].forEach(fId => {
            const el = document.getElementById(fId);
            if (el) {
              el.required = false;
              el.value = '';
              const err = form.querySelector('[data-error-for="' + fId + '"]');
              if (err) err.textContent = '';
              const wrp = el.closest('.form-field');
              if (wrp) wrp.classList.remove('has-error');
            }
          });
        }
      });
    });
  }

  const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
  const NAME_RE = /^[A-Za-z\s.'-]+$/;
  const PIN_RE = /^\d{6}$/;
  const PAN_RE = /^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/;
  const IFSC_RE = /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/;
  const ACCOUNT_RE = /^\d{9,18}$/;
  const GRAD_YEAR_RE = /^(19[5-9]\d|20[0-5]\d)$/;

  function validate10DigitPhone(val) {
    if (!val) return false;
    const digits = String(val).replace(/\D/g, '');
    if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) return true;
    if (digits.length === 12 && digits.startsWith('91') && /^[6-9]\d{9}$/.test(digits.slice(2))) return true;
    if (digits.length === 11 && digits.startsWith('0') && /^[6-9]\d{9}$/.test(digits.slice(1))) return true;
    return false;
  }

  // Real-time input formatters and limiters
  const panInput = document.getElementById('pan');
  if (panInput) {
    panInput.addEventListener('input', function() {
      panInput.value = panInput.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10);
    });
  }
  const ifscInput = document.getElementById('ifsc');
  if (ifscInput) {
    ifscInput.addEventListener('input', function() {
      ifscInput.value = ifscInput.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 11);
    });
  }
  const phoneInput = document.getElementById('phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function() {
      phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 10);
    });
  }
  const emPhoneInput = document.getElementById('emergencyContactPhone');
  if (emPhoneInput) {
    emPhoneInput.addEventListener('input', function() {
      emPhoneInput.value = emPhoneInput.value.replace(/\D/g, '').slice(0, 10);
    });
  }
  const pinInput = document.getElementById('pinCode');
  if (pinInput) {
    pinInput.addEventListener('input', function() {
      pinInput.value = pinInput.value.replace(/\D/g, '').slice(0, 6);
    });
  }
  const accInput = document.getElementById('accountNumber');
  if (accInput) {
    accInput.addEventListener('input', function() {
      accInput.value = accInput.value.replace(/\D/g, '').slice(0, 18);
    });
  }
  const gradInput = document.getElementById('graduationYear');
  if (gradInput) {
    gradInput.addEventListener('input', function() {
      gradInput.value = gradInput.value.replace(/\D/g, '').slice(0, 4);
    });
  }
  const uanInput = document.getElementById('uanPfDetails');
  if (uanInput) {
    uanInput.addEventListener('input', function() {
      uanInput.value = uanInput.value.replace(/\D/g, '').slice(0, 12);
    });
  }

  // Global Validation Function
  let clientErrors = [];
  function validateAllFields() {
    let isValid = true;
    let firstErrorEl = null;
    clientErrors = [];

    function markError(input, msg) {
      const fieldName = input.name;
      const errorSlot = form.querySelector('[data-error-for="' + fieldName + '"]');
      if (errorSlot) errorSlot.textContent = msg;
      const wrapper = input.closest('.form-field') || input.closest('.hr-declaration-card');
      if (wrapper) wrapper.classList.add('has-error');
      isValid = false;
      clientErrors.push(msg);
      if (!firstErrorEl) firstErrorEl = input;
    }

    form.querySelectorAll('[name]').forEach(input => {
      const fieldName = input.name;
      if (fieldName === 'website' || fieldName === 'formLoadedAt' || fieldName === 'type' || fieldName === 'recordType') return;

      const errorSlot = form.querySelector('[data-error-for="' + fieldName + '"]');
      if (errorSlot) errorSlot.textContent = '';

      const wrapper = input.closest('.form-field') || input.closest('.hr-declaration-card');
      if (wrapper) wrapper.classList.remove('has-error');

      if (input.type === 'file') {
        if (input.required && !fileCache[fieldName]) {
          markError(input, 'This file is required.');
        }
        return;
      }

      if (input.type === 'checkbox') {
        if (input.required && !input.checked) {
          markError(input, 'This declaration is required.');
        }
        return;
      }

      const val = (input.value || '').trim();

      if (input.required && !val) {
        markError(input, 'This field is required.');
        return;
      }

      if (!val) return; // Optional empty field

      // Field-specific restrictions
      if (['name', 'preferredName', 'emergencyContactName', 'bankAccountHolderName'].includes(fieldName)) {
        if (!NAME_RE.test(val)) {
          markError(input, 'Name cannot contain numbers or special characters.');
          return;
        }
      }

      if (['city', 'state'].includes(fieldName)) {
        if (!NAME_RE.test(val)) {
          markError(input, 'City/State cannot contain numbers.');
          return;
        }
      }

      if (fieldName === 'emergencyContactRelationship') {
        if (!NAME_RE.test(val)) {
          markError(input, 'Relationship cannot contain numbers.');
          return;
        }
      }

      if (['phone', 'emergencyContactPhone'].includes(fieldName)) {
        if (!validate10DigitPhone(val)) {
          markError(input, 'Enter a valid 10-digit mobile number.');
          return;
        }
      }

      if (fieldName === 'personalEmail' || input.type === 'email') {
        if (!EMAIL_RE.test(val)) {
          markError(input, 'Enter a valid email address.');
          return;
        }
      }

      if (fieldName === 'pinCode') {
        if (!PIN_RE.test(val)) {
          markError(input, 'PIN code must be exactly 6 digits.');
          return;
        }
      }

      if (fieldName === 'pan') {
        if (!PAN_RE.test(val)) {
          markError(input, 'Enter a valid 10-character PAN (e.g. ABCDE1234F).');
          return;
        }
      }

      if (fieldName === 'ifsc') {
        if (!IFSC_RE.test(val)) {
          markError(input, 'Enter a valid 11-character IFSC (e.g. HDFC0000240).');
          return;
        }
      }

      if (fieldName === 'accountNumber') {
        if (!ACCOUNT_RE.test(val)) {
          markError(input, 'Account number must be 9 to 18 digits.');
          return;
        }
      }

      if (fieldName === 'graduationYear') {
        if (!GRAD_YEAR_RE.test(val)) {
          markError(input, 'Enter a valid 4-digit graduation year.');
          return;
        }
      }

      if (fieldName === 'uanPfDetails' && val) {
        if (!/^\d{12}$/.test(val)) {
          markError(input, 'UAN must be a 12-digit number.');
          return;
        }
      }

      if (input.minLength > 0 && val.length < input.minLength) {
        markError(input, 'Please enter at least ' + input.minLength + ' characters.');
        return;
      }
    });

    if (firstErrorEl) {
      firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstErrorEl.focus();
    }

    return isValid;
  }

  // Helper to format file preview
  function updateFilePreview(inputEl) {
    const fieldName = inputEl.name;
    const previewContainer = form.querySelector('[data-preview-for="' + fieldName + '"]');
    if (!previewContainer) return;
    previewContainer.innerHTML = '';

    const file = fileCache[fieldName];
    if (!file) {
      inputEl.value = ''; // Reset actual file input
      inputEl.style.display = 'block';
      return;
    }

    inputEl.style.display = 'none';

    const wrap = document.createElement('div');
    wrap.className = 'hr-file-preview-card';
    
    const info = document.createElement('span');
    info.className = 'hr-file-name-label';
    info.textContent = file.name + ' (' + (file.size / 1024 / 1024).toFixed(2) + ' MB)';
    wrap.appendChild(info);

    const actions = document.createElement('div');
    actions.className = 'hr-file-actions';

    // View option
    const viewBtn = document.createElement('button');
    viewBtn.type = 'button';
    viewBtn.className = 'hr-preview-btn btn btn-secondary hr-file-preview-btn-adj';
    viewBtn.textContent = 'View';
    viewBtn.addEventListener('click', function () {
      const url = URL.createObjectURL(file);
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        window.open(url, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
    actions.appendChild(viewBtn);

    // Remove option
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'hr-remove-btn';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', function () {
      delete fileCache[fieldName];
      updateFilePreview(inputEl);
    });
    actions.appendChild(removeBtn);

    wrap.appendChild(actions);
    previewContainer.appendChild(wrap);
  }

  // Attach listeners to file inputs
  form.querySelectorAll('input[type="file"]').forEach(function (input) {
    input.addEventListener('change', function (e) {
      const file = e.target.files[0];
      const fieldName = input.name;
      const errorSlot = form.querySelector('[data-error-for="' + fieldName + '"]');
      if (errorSlot) errorSlot.textContent = '';

      if (!file) return;

      // Validate extension
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTS.includes(ext)) {
        if (errorSlot) errorSlot.textContent = 'Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, and PNG are allowed.';
        input.value = '';
        return;
      }

      // Validate size
      if (file.size > MAX_SIZE) {
        if (errorSlot) errorSlot.textContent = 'File is larger than the 5MB limit.';
        input.value = '';
        return;
      }

      fileCache[fieldName] = file;
      updateFilePreview(input);
    });
  });

  // Form Submit Handler
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    
    if (!validateAllFields()) {
      const statusEl = form.querySelector('[data-form-status]');
      if (statusEl) {
        const detail = clientErrors.length > 0 ? ': ' + clientErrors.slice(0, 3).join(', ') + (clientErrors.length > 3 ? '...' : '') : '';
        statusEl.textContent = 'Please correct the highlighted fields' + detail;
        statusEl.className = 'form-status is-error';
      }
      return;
    }

    const submitBtn = document.getElementById('hrSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    const statusEl = form.querySelector('[data-form-status]');
    if (statusEl) {
      statusEl.textContent = 'Registering profile on secure server...';
      statusEl.className = 'form-status';
    }

    // Build registration payload
    const formData = new FormData(form);
    const metaPayload = {};
    formData.forEach((value, key) => {
      const element = form.querySelector('[name="' + key + '"]');
      if (!element) return;
      if (element.type === 'file') return; // Skip files in register call
      
      if (element.type === 'checkbox') {
        metaPayload[key] = element.checked;
      } else {
        metaPayload[key] = value;
      }
    });

    // Ensure all checkboxes in form are explicitly assigned
    form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      if (cb.name) {
        metaPayload[cb.name] = cb.checked;
      }
    });

    // Explicitly set the type and recordType parameters from hidden tab input value
    const selectedType = onboardingType ? onboardingType.value : 'employee';
    metaPayload.type = selectedType;
    metaPayload.recordType = selectedType === 'intern' ? 'Intern' : 'Employee';

    // Set radio select
    const expRadio = form.querySelector('input[name="previousExperience"]:checked');
    metaPayload.previousExperience = expRadio ? expRadio.value : 'No';

    fetch('/api/hr/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(metaPayload)
    })
    .then(res => res.json().then(data => ({ status: res.status, data })))
    .then(res => {
      try {
        if (res.status !== 200 || !res.data.ok) {
          // Highlight returned field errors
          let firstErrEl = null;
          const errorDetails = [];
          if (res.data && res.data.errors && typeof res.data.errors === 'object') {
            for (const [errField, errMsg] of Object.entries(res.data.errors)) {
              errorDetails.push(errMsg);
              const errSlot = form.querySelector('[data-error-for="' + errField + '"]');
              if (errSlot) errSlot.textContent = errMsg;
              const inputEl = form.querySelector('[name="' + errField + '"]');
              if (inputEl) {
                const wrp = inputEl.closest('.form-field') || inputEl.closest('.hr-declaration-card');
                if (wrp) wrp.classList.add('has-error');
                if (!firstErrEl) firstErrEl = inputEl;
              }
            }
            if (firstErrEl) {
              firstErrEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              firstErrEl.focus();
            }
          }
          const fullErrMsg = errorDetails.length > 0
            ? 'Please correct: ' + errorDetails.join(' | ')
            : (res.data.error || 'Please correct the highlighted fields and try again.');
          throw new Error(fullErrMsg);
        }

        const regData = res.data;
        if (regData.duplicate) {
          showDuplicateScreen(regData.recordId);
          return;
        }

        const fileFields = Object.keys(fileCache);
        uploadFilesSequential(regData.recordId, regData.folderId, fileFields, 0);
      } catch (innerErr) {
        console.error("Registration error:", innerErr);
        if (statusEl) {
          statusEl.textContent = innerErr.message;
          statusEl.className = 'form-status is-error';
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Information';
      }
    })
    .catch(err => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Information';
      if (statusEl) {
        statusEl.textContent = err.message || 'Server error. Please verify input details and try again.';
        statusEl.className = 'form-status is-error';
      }
    });
  });

  // Folder structure map matching Apps Script subfolders
  const FOLDER_MAPPING = {
    profilePhoto: 'Profile Photo',
    resume: 'Resume',
    panCard: 'Identity Documents',
    identityProof: 'Identity Documents',
    addressProof: 'Address Documents',
    educationalCertificates: 'Education Documents',
    previousEmploymentDocuments: 'Employment Documents',
    bankProof: 'Bank Documents',
    otherDocuments: 'Other Documents'
  };

  // Upload files sequentially to avoid concurrent Drive locks, using a clean status UI
  function uploadFilesSequential(recordId, folderId, fields, index) {
    const statusEl = form.querySelector('[data-form-status]');
    const submitBtn = document.getElementById('hrSubmitBtn');
    
    submitBtn.textContent = 'Submitting...';
    if (statusEl) {
      statusEl.textContent = 'Uploading documents to secure folders. Please do not close this window...';
      statusEl.className = 'form-status';
    }

    if (index >= fields.length) {
      showSuccessScreen(recordId);
      return;
    }

    const fieldName = fields[index];
    const file = fileCache[fieldName];
    const subfolder = FOLDER_MAPPING[fieldName];

    const uData = new FormData();
    uData.append('folderId', folderId);
    uData.append('subfolderName', subfolder);
    uData.append('file', file);

    fetch('/api/hr/upload', {
      method: 'POST',
      body: uData
    })
    .then(res => res.json().then(data => ({ status: res.status, data })))
    .then(res => {
      if (res.status !== 200 || !res.data.ok) {
        throw new Error(res.data.error || 'Failed uploading ' + file.name);
      }
      // Proceed to next upload
      uploadFilesSequential(recordId, folderId, fields, index + 1);
    })
    .catch(err => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Information';
      alert("Document upload failed: " + err.message);
      if (statusEl) {
        statusEl.textContent = 'Upload failed: ' + err.message + '. Please check your connection and click Submit again to retry.';
        statusEl.className = 'form-status is-error';
      }
    });
  }

  // Display success card
  function showSuccessScreen(recordId) {
    try {
      alert("Your onboarding information has been successfully submitted! Record ID: " + recordId);
      const classification = onboardingType ? (onboardingType.value === 'employee' ? 'Employee' : 'Intern') : 'Employee';
      if (!container) {
        throw new Error('onboardingContainer element not found in DOM.');
      }
      container.innerHTML = 
        '<div class="contact-form hr-success-screen">' +
          '<div class="hr-success-icon-wrap">' +
            '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
          '</div>' +
          '<h2 class="hr-feedback-title">Information Submitted</h2>' +
          '<p class="hr-feedback-text">' +
            'Your onboarding profile and documents have been successfully registered as ' + classification + ' under Record ID:' +
          '</p>' +
          '<div class="hr-success-record-id">' +
            recordId +
          '</div>' +
          '<p class="hr-feedback-muted">' +
            'Our HR team has been notified. You can safely close this tab.' +
          '</p>' +
        '</div>';
    } catch (err) {
      console.error("Success screen error:", err);
    }
  }

  // Display duplicate alert screen
  function showDuplicateScreen(recordId) {
    try {
      alert("A profile with this email address is already registered under Record ID: " + recordId);
      if (!container) {
        throw new Error('onboardingContainer element not found in DOM.');
      }
      container.innerHTML = 
        '<div class="contact-form hr-success-screen">' +
          '<div class="hr-duplicate-icon-wrap">' +
            '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>' +
          '</div>' +
          '<h2 class="hr-feedback-title">Duplicate Profile Found</h2>' +
          '<div class="hr-duplicate-box">' +
            'A profile with this email address is already registered.' +
          '</div>' +
          '<p class="hr-feedback-text">' +
            'An onboarding record already exists with Record ID:' +
          '</p>' +
          '<div class="hr-duplicate-record-id">' +
            recordId +
          '</div>' +
          '<p class="hr-feedback-muted">' +
            'Please contact the HR team if you need to update your submitted documents.' +
          '</p>' +
        '</div>';
    } catch (err) {
      console.error("Duplicate screen error:", err);
    }
  }
});
