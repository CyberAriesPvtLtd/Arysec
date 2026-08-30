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

  tabEmployee.addEventListener('click', function() {
    tabEmployee.classList.add('active');
    tabIntern.classList.remove('active');
    onboardingType.value = 'employee';
  });

  tabIntern.addEventListener('click', function() {
    tabIntern.classList.add('active');
    tabEmployee.classList.remove('active');
    onboardingType.value = 'intern';
  });

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

  // Global Validation Function
  function validateAllFields() {
    let isValid = true;
    let firstErrorEl = null;

    form.querySelectorAll('[name]').forEach(input => {
      const fieldName = input.name;
      const errorSlot = form.querySelector('[data-error-for="' + fieldName + '"]');
      if (errorSlot) errorSlot.textContent = '';

      const wrapper = input.closest('.form-field') || input.closest('.hr-declaration-card');
      if (wrapper) wrapper.classList.remove('has-error');

      if (input.required) {
        if (input.type === 'file') {
          if (!fileCache[fieldName]) {
            if (errorSlot) errorSlot.textContent = 'This file is required.';
            if (wrapper) wrapper.classList.add('has-error');
            isValid = false;
            if (!firstErrorEl) firstErrorEl = input;
          }
        } else if (input.type === 'checkbox') {
          if (!input.checked) {
            if (errorSlot) errorSlot.textContent = 'This declaration is required.';
            if (wrapper) wrapper.classList.add('has-error');
            isValid = false;
            if (!firstErrorEl) firstErrorEl = input;
          }
        } else if (!input.value.trim()) {
          if (errorSlot) errorSlot.textContent = 'This field is required.';
          if (wrapper) wrapper.classList.add('has-error');
          isValid = false;
          if (!firstErrorEl) firstErrorEl = input;
        }
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
        statusEl.textContent = 'Please check the form: fill in all required fields and upload all required documents before submitting.';
        statusEl.className = 'form-status is-error';
      }
      return;
    }

    const submitBtn = document.getElementById('hrSubmitBtn');
    submitBtn.disabled = true;
    
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

    // Explicitly set the type parameter from hidden tab input value
    metaPayload.type = onboardingType.value;

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
          throw new Error(res.data.error || 'Server registration failed.');
        }

        const regData = res.data;
        if (regData.duplicate) {
          showDuplicateScreen(regData.recordId);
          return;
        }

        const fileFields = Object.keys(fileCache);
        uploadFilesSequential(regData.recordId, regData.folderId, fileFields, 0);
      } catch (innerErr) {
        console.error("Registration success block error:", innerErr);
        alert("Registration failed: " + innerErr.message);
        if (statusEl) {
          statusEl.textContent = 'Error handling response: ' + innerErr.message;
          statusEl.className = 'form-status is-error';
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Information';
      }
    })
    .catch(err => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Information';
      alert("Registration Error: " + err.message);
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
        '<div class="contact-form reveal hr-success-screen">' +
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
        '<div class="contact-form reveal hr-success-screen">' +
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
