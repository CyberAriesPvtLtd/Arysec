'use strict';

const { esc } = require('../../lib/html');
const C = require('../components');

module.exports = function onboardingPage(ctx) {
  const company = ctx.config.company;
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'HR Onboarding', href: '/internal-hr-onboarding-7x9k2/' },
  ];

  const content = `
    ${C.pageHero({
      trail,
      eyebrow: 'ARYSEC • HR',
      title: '',
      titleAccent: 'Employee & Intern Onboarding',
      sub: 'Please provide the following information accurately. This form is intended for official onboarding and HR records.',
    })}

    <section class="section hr-p-hero-adj">
      <div class="container container-narrow">
        
        <!-- Onboarding Switcher Tab -->
        <div class="hr-type-tabs-container">
          <div class="hr-type-tabs">
            <button type="button" class="hr-tab-btn active" id="tabEmployee">Employee</button>
            <button type="button" class="hr-tab-btn" id="tabIntern">Intern</button>
          </div>
        </div>

        <div id="onboardingContainer">
          <form class="contact-form reveal" id="onboardingForm" novalidate>
            <!-- Hidden inputs for tab selection and spam prevention -->
            <input type="hidden" name="type" id="onboardingType" value="employee">
            <input type="hidden" name="recordType" id="onboardingRecordType" value="Employee">
            <input type="hidden" name="formLoadedAt" value="">
            <div class="hr-hide-placeholder"><input type="text" name="website" tabindex="-1" autocomplete="off"></div>

            <!-- CARD 01: PERSONAL INFORMATION -->
            <div class="hr-step-card">
              <div class="hr-step-header">
                <div class="hr-step-badge-wrap">
                  <div class="hr-step-badge">01</div>
                  <h2 class="hr-feedback-title hr-step-title">Personal Information</h2>
                </div>
                <div class="hr-step-description-wrap">
                  <p class="hr-feedback-muted hr-step-desc">Basic personal and contact information.</p>
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label for="name">Full Name <span class="req" aria-hidden="true">*</span></label>
                  <input type="text" id="name" name="name" placeholder="First and last name" required minlength="2" maxlength="100" pattern="^[A-Za-z\s.'-]+$" title="Full name cannot contain numbers" autocomplete="name">
                  <span class="field-error" data-error-for="name"></span>
                </div>
                <div class="form-field">
                  <label for="preferredName">Preferred Name</label>
                  <input type="text" id="preferredName" name="preferredName" placeholder="Name to call you" maxlength="100" pattern="^[A-Za-z\s.'-]+$" title="Preferred name cannot contain numbers">
                  <span class="field-error" data-error-for="preferredName"></span>
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label for="personalEmail">Personal Email Address <span class="req" aria-hidden="true">*</span></label>
                  <input type="email" id="personalEmail" name="personalEmail" placeholder="e.g. name@gmail.com" required maxlength="254">
                  <span class="field-error" data-error-for="personalEmail"></span>
                </div>
                <div class="form-field">
                  <label for="phone">Phone Number <span class="req" aria-hidden="true">*</span></label>
                  <input type="tel" id="phone" name="phone" placeholder="10-digit mobile number" required minlength="10" maxlength="10" pattern="^[6-9]\d{9}$" inputmode="numeric" title="10-digit mobile number starting with 6, 7, 8, or 9">
                  <span class="field-error" data-error-for="phone"></span>
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label for="dateOfBirth">Date of Birth <span class="req" aria-hidden="true">*</span></label>
                  <input type="date" id="dateOfBirth" name="dateOfBirth" required>
                  <span class="field-error" data-error-for="dateOfBirth"></span>
                </div>
                <div class="form-field">
                  <label for="gender">Gender <span class="req" aria-hidden="true">*</span></label>
                  <select id="gender" name="gender" required>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                  <span class="field-error" data-error-for="gender"></span>
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label for="city">City <span class="req" aria-hidden="true">*</span></label>
                  <input type="text" id="city" name="city" placeholder="e.g. Mumbai" required minlength="2" maxlength="80" pattern="^[A-Za-z\s.'-]+$" title="City cannot contain numbers">
                  <span class="field-error" data-error-for="city"></span>
                </div>
                <div class="form-field">
                  <label for="state">State <span class="req" aria-hidden="true">*</span></label>
                  <input type="text" id="state" name="state" placeholder="e.g. Maharashtra" required minlength="2" maxlength="80" pattern="^[A-Za-z\s.'-]+$" title="State cannot contain numbers">
                  <span class="field-error" data-error-for="state"></span>
                </div>
              </div>

              <div class="form-row hr-form-row-2col">
                <div class="form-field">
                  <label for="pinCode">PIN Code <span class="req" aria-hidden="true">*</span></label>
                  <input type="text" id="pinCode" name="pinCode" placeholder="6-digit PIN code" required minlength="6" maxlength="6" pattern="^\d{6}$" inputmode="numeric" title="6-digit PIN code">
                  <span class="field-error" data-error-for="pinCode"></span>
                </div>
                <div class="form-field hr-hide-placeholder"></div>
              </div>

              <div class="form-field">
                <label for="currentResidentialAddress">Current Residential Address <span class="req" aria-hidden="true">*</span></label>
                <textarea id="currentResidentialAddress" name="currentResidentialAddress" rows="3" required placeholder="Full current residential address" minlength="5" maxlength="500"></textarea>
                <span class="field-error" data-error-for="currentResidentialAddress"></span>
              </div>

              <div class="form-field">
                <label for="permanentAddress">Permanent Address <span class="req" aria-hidden="true">*</span></label>
                <textarea id="permanentAddress" name="permanentAddress" rows="3" required placeholder="Full permanent address" minlength="5" maxlength="500"></textarea>
                <span class="field-error" data-error-for="permanentAddress"></span>
              </div>

              <h3 class="hr-section-title-wrap">Emergency Contact</h3>
              <div class="form-row">
                <div class="form-field">
                  <label for="emergencyContactName">Emergency Contact Name <span class="req" aria-hidden="true">*</span></label>
                  <input type="text" id="emergencyContactName" name="emergencyContactName" placeholder="Contact person name" required minlength="2" maxlength="100" pattern="^[A-Za-z\s.'-]+$" title="Emergency contact name cannot contain numbers">
                  <span class="field-error" data-error-for="emergencyContactName"></span>
                </div>
                <div class="form-field">
                  <label for="emergencyContactRelationship">Relationship <span class="req" aria-hidden="true">*</span></label>
                  <input type="text" id="emergencyContactRelationship" name="emergencyContactRelationship" placeholder="e.g. Father, Mother, Spouse" required minlength="2" maxlength="50" pattern="^[A-Za-z\s.'-]+$" title="Relationship cannot contain numbers">
                  <span class="field-error" data-error-for="emergencyContactRelationship"></span>
                </div>
              </div>

              <div class="form-row hr-form-row-2col">
                <div class="form-field">
                  <label for="emergencyContactPhone">Emergency Contact Phone <span class="req" aria-hidden="true">*</span></label>
                  <input type="tel" id="emergencyContactPhone" name="emergencyContactPhone" placeholder="10-digit mobile number" required minlength="10" maxlength="10" pattern="^[6-9]\d{9}$" inputmode="numeric" title="10-digit mobile number starting with 6, 7, 8, or 9">
                  <span class="field-error" data-error-for="emergencyContactPhone"></span>
                </div>
                <div class="form-field hr-hide-placeholder"></div>
              </div>

              <h3 class="hr-section-title-wrap">Role & joining Details</h3>
              <div class="form-row">
                <div class="form-field">
                  <label for="joiningDate">Proposed Joining Date <span class="req" aria-hidden="true">*</span></label>
                  <input type="date" id="joiningDate" name="joiningDate" required>
                  <span class="field-error" data-error-for="joiningDate"></span>
                </div>
                <div class="form-field">
                  <label for="department">Department <span class="req" aria-hidden="true">*</span></label>
                  <select id="department" name="department" required>
                    <option value="">Select Department</option>
                    <option value="Consulting">Consulting / Audit</option>
                    <option value="Security Operations">Security Operations</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Administration">Administration & HR</option>
                    <option value="Sales">Business Development</option>
                  </select>
                  <span class="field-error" data-error-for="department"></span>
                </div>
              </div>

              <div class="form-field">
                <label for="position">Position / Title <span class="req" aria-hidden="true">*</span></label>
                <input type="text" id="position" name="position" placeholder="e.g. Associate Security Consultant" required maxlength="120">
                <span class="field-error" data-error-for="position"></span>
              </div>
            </div>

            <!-- CARD 02: EDUCATION -->
            <div class="hr-step-card">
              <div class="hr-step-header">
                <div class="hr-step-badge-wrap">
                  <div class="hr-step-badge">02</div>
                  <h2 class="hr-feedback-title hr-step-title">Education</h2>
                </div>
                <div class="hr-step-description-wrap">
                  <p class="hr-feedback-muted hr-step-desc">Academic background and qualifications.</p>
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label for="highestQualification">Highest Qualification <span class="req" aria-hidden="true">*</span></label>
                  <select id="highestQualification" name="highestQualification" required>
                    <option value="">Select</option>
                    <option value="B.Tech">B.Tech / B.E.</option>
                    <option value="M.Tech">M.Tech / M.E.</option>
                    <option value="MCA">MCA</option>
                    <option value="BCA">BCA</option>
                    <option value="B.Sc">B.Sc</option>
                    <option value="M.Sc">M.Sc</option>
                    <option value="MBA">MBA</option>
                    <option value="B.Com">B.Com</option>
                    <option value="PostGraduate">Post Graduate / Other</option>
                  </select>
                  <span class="field-error" data-error-for="highestQualification"></span>
                </div>
                <div class="form-field">
                  <label for="collegeUniversity">College / University / Institution <span class="req" aria-hidden="true">*</span></label>
                  <input type="text" id="collegeUniversity" name="collegeUniversity" placeholder="Institution name" required maxlength="150">
                  <span class="field-error" data-error-for="collegeUniversity"></span>
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label for="degreeCourse">Degree / Course <span class="req" aria-hidden="true">*</span></label>
                  <input type="text" id="degreeCourse" name="degreeCourse" placeholder="e.g. Bachelor of Technology" required maxlength="120">
                  <span class="field-error" data-error-for="degreeCourse"></span>
                </div>
                <div class="form-field">
                  <label for="branchSpecialization">Branch / Specialization <span class="req" aria-hidden="true">*</span></label>
                  <input type="text" id="branchSpecialization" name="branchSpecialization" placeholder="e.g. Computer Science" required maxlength="120">
                  <span class="field-error" data-error-for="branchSpecialization"></span>
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label for="currentYearSemester">Current Year / Semester</label>
                  <input type="text" id="currentYearSemester" name="currentYearSemester" placeholder="e.g. 4th Year, 8th Sem (If pursuing)" maxlength="50">
                  <span class="field-error" data-error-for="currentYearSemester"></span>
                </div>
                <div class="form-field">
                  <label for="graduationYear">Graduation Year <span class="req" aria-hidden="true">*</span></label>
                  <input type="text" id="graduationYear" name="graduationYear" placeholder="YYYY" required minlength="4" maxlength="4" pattern="^(19[5-9]\d|20[0-5]\d)$" inputmode="numeric" title="4-digit graduation year">
                  <span class="field-error" data-error-for="graduationYear"></span>
                </div>
              </div>

              <div class="form-field">
                <label for="cgpaPercentage">CGPA / Percentage <span class="req" aria-hidden="true">*</span></label>
                <input type="text" id="cgpaPercentage" name="cgpaPercentage" placeholder="e.g. 8.5 CGPA or 85%" required maxlength="20">
                <span class="field-error" data-error-for="cgpaPercentage"></span>
              </div>

              <div class="form-field">
                <label for="professionalCertifications">Professional Certifications (if applicable)</label>
                <textarea id="professionalCertifications" name="professionalCertifications" rows="3" placeholder="e.g. CEH, OSCP, CISSP, AWS Certified Solutions Architect (Optional)" maxlength="1000"></textarea>
                <span class="field-error" data-error-for="professionalCertifications"></span>
              </div>
            </div>

            <!-- CARD 03: PREVIOUS EXPERIENCE -->
            <div class="hr-step-card">
              <div class="hr-step-header">
                <div class="hr-step-badge-wrap">
                  <div class="hr-step-badge">03</div>
                  <h2 class="hr-feedback-title hr-step-title">Previous Experience</h2>
                </div>
                <div class="hr-step-description-wrap">
                  <p class="hr-feedback-muted hr-step-desc">Tell us about previous employment or internship experience.</p>
                </div>
              </div>

              <div class="hr-declaration-card hr-exp-card-wrap">
                <div class="hr-exp-flex-row">
                  <span class="hr-label-bold hr-decl-text">Previous work / internship experience?</span>
                  <div class="hr-exp-options">
                    <label class="checkbox-label hr-exp-label">
                      <input type="radio" name="previousExperience" value="No" checked class="hr-radio-input">
                      <span>No</span>
                    </label>
                    <label class="checkbox-label hr-exp-label">
                      <input type="radio" name="previousExperience" value="Yes" class="hr-radio-input">
                      <span>Yes</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Collapsible Details Section -->
              <div id="experienceDetailsSection" class="hr-experience-details">
                <div class="form-row">
                  <div class="form-field">
                    <label for="previousOrganization">Organization Name <span class="req" aria-hidden="true">*</span></label>
                    <input type="text" id="previousOrganization" name="previousOrganization" placeholder="Last employer/intern organization" maxlength="120">
                    <span class="field-error" data-error-for="previousOrganization"></span>
                  </div>
                  <div class="form-field">
                    <label for="previousDesignation">Designation / Role <span class="req" aria-hidden="true">*</span></label>
                    <input type="text" id="previousDesignation" name="previousDesignation" placeholder="e.g. Intern, Systems Associate" maxlength="120">
                    <span class="field-error" data-error-for="previousDesignation"></span>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-field">
                    <label for="previousStartDate">Start Date <span class="req" aria-hidden="true">*</span></label>
                    <input type="date" id="previousStartDate" name="previousStartDate">
                    <span class="field-error" data-error-for="previousStartDate"></span>
                  </div>
                  <div class="form-field">
                    <label for="previousEndDate">End Date <span class="req" aria-hidden="true">*</span></label>
                    <input type="date" id="previousEndDate" name="previousEndDate">
                    <span class="field-error" data-error-for="previousEndDate"></span>
                  </div>
                  <div class="form-field">
                    <label for="previousDuration">Total Duration <span class="req" aria-hidden="true">*</span></label>
                    <input type="text" id="previousDuration" name="previousDuration" placeholder="e.g. 6 Months, 1 Year" maxlength="50">
                    <span class="field-error" data-error-for="previousDuration"></span>
                  </div>
                </div>

                <div class="form-field">
                  <label for="keyResponsibilities">Key Responsibilities & Achievements <span class="req" aria-hidden="true">*</span></label>
                  <textarea id="keyResponsibilities" name="keyResponsibilities" rows="4" placeholder="Briefly describe your roles, responsibilities, or audits you were part of..." maxlength="2000"></textarea>
                  <span class="field-error" data-error-for="keyResponsibilities"></span>
                </div>
              </div>
            </div>

            <!-- CARD 04: BANK & STATUTORY INFORMATION -->
            <div class="hr-step-card">
              <div class="hr-step-header">
                <div class="hr-step-badge-wrap">
                  <div class="hr-step-badge">04</div>
                  <h2 class="hr-feedback-title hr-step-title">Bank & Statutory Information</h2>
                </div>
                <div class="hr-step-description-wrap">
                  <p class="hr-feedback-muted hr-step-desc">Information required for applicable HR and statutory processing.</p>
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label for="bankAccountHolderName">Bank Account Holder Name <span class="req" aria-hidden="true">*</span></label>
                  <input type="text" id="bankAccountHolderName" name="bankAccountHolderName" placeholder="Name on passbook/cheque" required minlength="2" maxlength="120" pattern="^[A-Za-z\s.'-]+$" title="Account holder name cannot contain numbers">
                  <span class="field-error" data-error-for="bankAccountHolderName"></span>
                </div>
                <div class="form-field">
                  <label for="bankName">Bank Name <span class="req" aria-hidden="true">*</span></label>
                  <input type="text" id="bankName" name="bankName" placeholder="e.g. HDFC Bank" required maxlength="120">
                  <span class="field-error" data-error-for="bankName"></span>
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label for="accountNumber">Account Number <span class="req" aria-hidden="true">*</span></label>
                  <input type="text" id="accountNumber" name="accountNumber" placeholder="9 to 18 digit account number" required minlength="9" maxlength="18" pattern="^\d{9,18}$" inputmode="numeric" title="Bank account number (9 to 18 digits)">
                  <span class="field-error" data-error-for="accountNumber"></span>
                </div>
                <div class="form-field">
                  <label for="ifsc">IFSC <span class="req" aria-hidden="true">*</span></label>
                  <input type="text" id="ifsc" name="ifsc" placeholder="e.g. HDFC0000240" required minlength="11" maxlength="11" pattern="^[A-Za-z]{4}0[A-Za-z0-9]{6}$" title="11-character IFSC code (e.g. HDFC0000240)" style="text-transform:uppercase">
                  <span class="field-error" data-error-for="ifsc"></span>
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label for="pan">PAN <span class="req" aria-hidden="true">*</span></label>
                  <input type="text" id="pan" name="pan" placeholder="10-digit PAN (e.g. ABCDE1234F)" required minlength="10" maxlength="10" pattern="^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$" title="10-character PAN number" class="hr-uppercase" style="text-transform:uppercase">
                  <span class="field-error" data-error-for="pan"></span>
                </div>
                <div class="form-field">
                  <label for="uanPfDetails">UAN / PF Details (if applicable)</label>
                  <input type="text" id="uanPfDetails" name="uanPfDetails" placeholder="12-digit UAN" maxlength="50" pattern="^\d{12}$" inputmode="numeric">
                  <span class="field-error" data-error-for="uanPfDetails"></span>
                </div>
              </div>

              <div class="form-row hr-form-row-2col">
                <div class="form-field">
                  <label for="esicDetails">ESIC Details (if applicable)</label>
                  <input type="text" id="esicDetails" name="esicDetails" placeholder="ESIC IP number" maxlength="50">
                  <span class="field-error" data-error-for="esicDetails"></span>
                </div>
                <div class="form-field hr-hide-placeholder"></div>
              </div>
            </div>

            <!-- CARD 05: DOCUMENTS -->
            <div class="hr-step-card">
              <div class="hr-step-header">
                <div class="hr-step-badge-wrap">
                  <div class="hr-step-badge">05</div>
                  <h2 class="hr-feedback-title hr-step-title">Documents</h2>
                </div>
                <div class="hr-step-description-wrap">
                  <p class="hr-feedback-muted hr-step-desc">Upload the required onboarding documents.</p>
                </div>
              </div>

              <div class="form-row hr-form-row-spacing">
                <div class="form-field hr-doc-upload-card">
                  <label for="resume" class="hr-label-bold">Resume / CV <span class="req" aria-hidden="true">*</span></label>
                  <input type="file" id="resume" name="resume" accept="application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document" required class="hr-file-input-spacing">
                  <div class="file-info-preview" data-preview-for="resume"></div>
                  <span class="field-error" data-error-for="resume"></span>
                </div>
                <div class="form-field hr-doc-upload-card">
                  <label for="profilePhoto" class="hr-label-bold">Profile Photograph <span class="req" aria-hidden="true">*</span></label>
                  <input type="file" id="profilePhoto" name="profilePhoto" accept="image/png, image/jpeg" required class="hr-file-input-spacing">
                  <div class="file-info-preview" data-preview-for="profilePhoto"></div>
                  <span class="field-error" data-error-for="profilePhoto"></span>
                </div>
              </div>

              <div class="form-row hr-form-row-spacing">
                <div class="form-field hr-doc-upload-card">
                  <label for="panCard" class="hr-label-bold">PAN Card <span class="req" aria-hidden="true">*</span></label>
                  <input type="file" id="panCard" name="panCard" accept="application/pdf, image/png, image/jpeg" required class="hr-file-input-spacing">
                  <div class="file-info-preview" data-preview-for="panCard"></div>
                  <span class="field-error" data-error-for="panCard"></span>
                </div>
                <div class="form-field hr-doc-upload-card">
                  <label for="identityProof" class="hr-label-bold">Identity Proof <span class="req" aria-hidden="true">*</span></label>
                  <input type="file" id="identityProof" name="identityProof" accept="application/pdf, image/png, image/jpeg" required class="hr-file-input-spacing">
                  <div class="file-info-preview" data-preview-for="identityProof"></div>
                  <span class="field-error" data-error-for="identityProof"></span>
                </div>
              </div>

              <div class="form-row hr-form-row-spacing">
                <div class="form-field hr-doc-upload-card">
                  <label for="addressProof" class="hr-label-bold">Address Proof <span class="req" aria-hidden="true">*</span></label>
                  <input type="file" id="addressProof" name="addressProof" accept="application/pdf, image/png, image/jpeg" required class="hr-file-input-spacing">
                  <div class="file-info-preview" data-preview-for="addressProof"></div>
                  <span class="field-error" data-error-for="addressProof"></span>
                </div>
                <div class="form-field hr-doc-upload-card">
                  <label for="educationalCertificates" class="hr-label-bold">Educational Certificates / Marksheets <span class="req" aria-hidden="true">*</span></label>
                  <input type="file" id="educationalCertificates" name="educationalCertificates" accept="application/pdf, image/png, image/jpeg" required class="hr-file-input-spacing">
                  <div class="file-info-preview" data-preview-for="educationalCertificates"></div>
                  <span class="field-error" data-error-for="educationalCertificates"></span>
                </div>
              </div>

              <div class="form-row hr-form-row-spacing">
                <div class="form-field hr-doc-upload-card">
                  <label for="previousEmploymentDocuments" class="hr-label-bold">Previous Employment / Experience Documents</label>
                  <input type="file" id="previousEmploymentDocuments" name="previousEmploymentDocuments" accept="application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, image/png, image/jpeg" class="hr-file-input-spacing">
                  <div class="file-info-preview" data-preview-for="previousEmploymentDocuments"></div>
                  <span class="field-error" data-error-for="previousEmploymentDocuments"></span>
                </div>
                <div class="form-field hr-doc-upload-card">
                  <label for="bankProof" class="hr-label-bold">Bank Proof / Cancelled Cheque <span class="req" aria-hidden="true">*</span></label>
                  <input type="file" id="bankProof" name="bankProof" accept="application/pdf, image/png, image/jpeg" required class="hr-file-input-spacing">
                  <div class="file-info-preview" data-preview-for="bankProof"></div>
                  <span class="field-error" data-error-for="bankProof"></span>
                </div>
              </div>

              <div class="form-field hr-doc-upload-card">
                <label for="otherDocuments" class="hr-label-bold">Other Onboarding Documents</label>
                <input type="file" id="otherDocuments" name="otherDocuments" accept="application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, image/png, image/jpeg" class="hr-file-input-spacing">
                <div class="file-info-preview" data-preview-for="otherDocuments"></div>
                <span class="field-error" data-error-for="otherDocuments"></span>
              </div>
            </div>

            <!-- CARD 06: DECLARATIONS & CONSENT -->
            <div class="hr-step-card">
              <div class="hr-step-header">
                <div class="hr-step-badge-wrap">
                  <div class="hr-step-badge">06</div>
                  <h2 class="hr-feedback-title hr-step-title">Declarations & Consent</h2>
                </div>
                <div class="hr-step-description-wrap">
                  <p class="hr-feedback-muted hr-step-desc">Please read and acknowledge each declaration before submitting.</p>
                </div>
              </div>

              <label class="hr-declaration-card">
                <input type="checkbox" id="declarationAccuracy" name="declarationAccuracy" value="yes" required class="hr-checkbox-input">
                <span class="hr-decl-text">I declare that the information provided in this form is accurate and complete. <span class="req" aria-hidden="true">*</span></span>
              </label>
              <span class="field-error hr-decl-error" data-error-for="declarationAccuracy"></span>

              <label class="hr-declaration-card">
                <input type="checkbox" id="hrProcessingConsent" name="hrProcessingConsent" value="yes" required class="hr-checkbox-input">
                <span class="hr-decl-text">I acknowledge and consent to the processing of my personal information for HR and onboarding purposes. <span class="req" aria-hidden="true">*</span></span>
              </label>
              <span class="field-error hr-decl-error" data-error-for="hrProcessingConsent"></span>

              <label class="hr-declaration-card">
                <input type="checkbox" id="documentAuthenticity" name="documentAuthenticity" value="yes" required class="hr-checkbox-input">
                <span class="hr-decl-text">I declare that the documents submitted by me are authentic and belong to me. <span class="req" aria-hidden="true">*</span></span>
              </label>
              <span class="field-error hr-decl-error" data-error-for="documentAuthenticity"></span>

              <label class="hr-declaration-card">
                <input type="checkbox" id="policyAcknowledgement" name="policyAcknowledgement" value="yes" required class="hr-checkbox-input">
                <span class="hr-decl-text">I acknowledge the applicable Arysec company policies and Code of Conduct. <span class="req" aria-hidden="true">*</span></span>
              </label>
              <span class="field-error hr-decl-error" data-error-for="policyAcknowledgement"></span>

              <!-- Final confirmation checkbox matching the bottom element of Screenshot 4 -->
              <label class="hr-declaration-card">
                <input type="checkbox" id="confirmation" name="confirmation" value="yes" required class="hr-checkbox-input">
                <span class="hr-decl-text">I confirm that I have reviewed the information provided and wish to submit this form. <span class="req" aria-hidden="true">*</span></span>
              </label>
              <span class="field-error hr-decl-error" data-error-for="confirmation"></span>
            </div>

            <!-- Submit Action -->
            <div class="hr-submit-container">
              <button type="submit" id="hrSubmitBtn" class="btn btn-primary hr-submit-btn-layout">Submit Information</button>
              <p class="hr-submit-hint hr-status-msg-layout">Your information will be handled through the company's HR onboarding system.</p>
              <p class="form-status hr-status-msg-layout" data-form-status role="status" aria-live="polite"></p>
            </div>
          </form>
        </div>
      </div>
    </section>

    <!-- Load static CSP-compliant script -->
    <script src="/js/onboarding.js?v=11" defer></script>
  `;

  return {
    path: '/internal-hr-onboarding-7x9k2/',
    title: 'HR Onboarding',
    description: 'Internal Employee & Intern HR Onboarding form for Arysec Consultancy LLP.',
    content,
    noindex: true,
  };
};
