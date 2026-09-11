/**
 * NBSC PRIME-HRM Intelligence Hub — Application Wizard Logic
 * File: apply.js
 * Path: frontend/pages/applicants/apply/apply.js
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Mobile Nav Toggle
  setupMobileNav();

  // Back to Top Button
  setupBackToTop();

  // Get Vacancy ID
  const vacancyId = getQueryParam('vacancy_id') || getQueryParam('id') || 'vac-004';
  if (!vacancyId) {
    showToast('No vacancy selected. Redirecting to job board...', 'warning');
    setTimeout(() => {
      window.location.href = '../../vacancies/job-board/job-board.html';
    }, 1500);
    return;
  }

  // Load Vacancy Data with Resilient Local Fallbacks
  let vacancyData = null;
  try {
    const res = await apiGet(`/vacancies/${vacancyId}/`);
    if (res && res.success && res.data && res.data.vacancy) {
      vacancyData = res.data.vacancy;
    }
  } catch (err) {
    console.warn('apiGet for vacancy returned error, inspecting local DB...', err);
  }

  // Fallback 1: window.db
  if (!vacancyData && window.db && typeof window.db.getTable === 'function') {
    let vacs = window.db.getTable('vacancies') || [];
    if (!vacs || vacs.length === 0) {
      window.db.init();
      vacs = window.db.getTable('vacancies') || [];
    }
    vacancyData = vacs.find(v => v.id === vacancyId);
  }

  // Fallback 2: DB_SEED
  if (!vacancyData && typeof DB_SEED !== 'undefined' && DB_SEED.vacancies) {
    vacancyData = DB_SEED.vacancies.find(v => v.id === vacancyId);
  }

  // Fallback 3: Default sample if vac-004
  if (!vacancyData && vacancyId === 'vac-004') {
    vacancyData = {
      id: 'vac-004',
      title: 'Administrative Assistant III',
      department: 'Finance and Budget Office',
      category: 'NON_TEACHING',
      salary_grade: 9,
      monthly_salary: 21211,
      employment_status: 'Permanent (Plantilla)',
      education: 'Completion of 2 years studies in college or High School Graduate with relevant vocational course',
      experience: '1 year of relevant experience',
      training: '4 hours of relevant training',
      eligibility: 'Career Service (Subprofessional) / First Level Eligibility'
    };
  }

  if (vacancyData) {
    renderVacancyHeader(vacancyData);
  } else {
    showToast('Notice: Generic application mode enabled.', 'info');
    const titleEl = document.getElementById('target-title');
    if (titleEl) titleEl.textContent = 'General Civil Service Plantilla Application';
  }

  // Stepper & Panes
  let currentStep = 1;
  const panes = {
    1: document.getElementById('pane-step-1'),
    2: document.getElementById('pane-step-2'),
    3: document.getElementById('pane-step-3'),
    4: document.getElementById('pane-step-4')
  };
  const stepIndicators = document.querySelectorAll('.wizard-step');

  // Input Fields
  const inputFullName = document.getElementById('input-full-name');
  const inputEmail = document.getElementById('input-email');
  const inputPhone = document.getElementById('input-phone');
  const inputBirthdate = document.getElementById('input-birthdate');
  const inputAddress = document.getElementById('input-address');

  const inputHighestEducation = document.getElementById('input-highest-education');
  const inputSchool = document.getElementById('input-school');
  const inputYearsExperience = document.getElementById('input-years-experience');
  const inputEligibilityType = document.getElementById('input-eligibility-type');
  const textareaCoverLetter = document.getElementById('textarea-cover-letter');

  const filePds = document.getElementById('file-pds');
  const fileTor = document.getElementById('file-tor');
  const fileEligibility = document.getElementById('file-eligibility');
  const fileTrainings = document.getElementById('file-trainings');

  const checkOath = document.getElementById('check-oath');
  const reviewContent = document.getElementById('review-summary-content');
  const btnSubmit = document.getElementById('btn-submit-application');

  // Setup file upload previews
  setupFileUploadPreviews();

  // If user is currently logged in, prefill personal information
  if (typeof getUser === 'function') {
    const currentUser = getUser();
    if (currentUser) {
      if (inputFullName && currentUser.name) inputFullName.value = currentUser.name;
      if (inputEmail && currentUser.email) inputEmail.value = currentUser.email;
    }
  }

  /**
   * Renders target position header details.
   */
  function renderVacancyHeader(v) {
    const titleEl = document.getElementById('target-title');
    const deptEl = document.getElementById('target-dept');
    const catEl = document.getElementById('target-category');
    const metaEl = document.getElementById('target-meta');

    const isTeaching = v.category === 'TEACHING';
    const dept = v.department || v.department_code || 'General Administration';
    const sg = v.salary_grade || v.salaryGrade || 9;
    const salary = v.monthly_salary || v.monthlySalary;

    if (titleEl) titleEl.textContent = v.title || 'Civil Service Position';
    if (deptEl) deptEl.textContent = `${dept} • ${v.employment_status || 'Permanent (Plantilla)'}`;
    
    if (catEl) {
      catEl.textContent = isTeaching ? 'Faculty Plantilla' : 'Administrative Plantilla';
      catEl.className = isTeaching ? 'badge badge--teaching mb-1' : 'badge badge--nonteaching mb-1';
    }

    if (metaEl) {
      let metaHtml = `<span class="badge badge--neutral">SG ${sg}</span>`;
      if (salary) {
        metaHtml += `<span class="badge badge--gold">₱${Number(salary).toLocaleString('en-US', {minimumFractionDigits: 2})} / mo</span>`;
      }
      metaHtml += `<span class="badge badge--open">Open for Submissions</span>`;
      metaEl.innerHTML = metaHtml;
    }
  }

  /**
   * Setup document file input badges
   */
  function setupFileUploadPreviews() {
    const fileConfigs = [
      { input: filePds, badgeId: 'badge-file-pds' },
      { input: fileTor, badgeId: 'badge-file-tor' },
      { input: fileEligibility, badgeId: 'badge-file-eligibility' },
      { input: fileTrainings, badgeId: 'badge-file-trainings' }
    ];

    fileConfigs.forEach(({ input, badgeId }) => {
      if (!input) return;
      const badgeEl = document.getElementById(badgeId);
      input.addEventListener('change', () => {
        if (!badgeEl) return;
        if (input.files && input.files[0]) {
          const file = input.files[0];
          badgeEl.innerHTML = `
            <span class="upload-file-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              ${escapeHtml(file.name)} (${formatFileSize(file.size)})
            </span>
          `;
        } else {
          badgeEl.innerHTML = '';
        }
      });
    });
  }

  function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Switches active wizard step with validation.
   */
  function goToStep(newStep) {
    if (newStep < 1 || newStep > 4) return;

    // Hide all panes
    Object.values(panes).forEach(pane => {
      if (pane) pane.classList.remove('wizard-pane--active');
    });

    // Show target pane
    if (panes[newStep]) {
      panes[newStep].classList.add('wizard-pane--active');
    }

    // Update indicator states
    stepIndicators.forEach(stepEl => {
      const stepNumber = parseInt(stepEl.dataset.step, 10);
      stepEl.classList.remove('wizard-step--active', 'wizard-step--completed');

      if (stepNumber === newStep) {
        stepEl.classList.add('wizard-step--active');
      } else if (stepNumber < newStep) {
        stepEl.classList.add('wizard-step--completed');
      }
    });

    currentStep = newStep;
    window.scrollTo({ top: 120, behavior: 'smooth' });

    if (newStep === 4) {
      populateReviewSummary();
    }
  }

  /**
   * Validates inputs for Step 1.
   */
  function validateStep1() {
    let valid = true;
    if (!inputFullName.value.trim()) {
      document.getElementById('error-full-name').textContent = 'Full legal name is required.';
      valid = false;
    } else {
      document.getElementById('error-full-name').textContent = '';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!inputEmail.value.trim() || !emailRegex.test(inputEmail.value.trim())) {
      document.getElementById('error-email').textContent = 'A valid email address is required.';
      valid = false;
    } else {
      document.getElementById('error-email').textContent = '';
    }

    if (!inputPhone.value.trim()) {
      document.getElementById('error-phone').textContent = 'Contact number is required.';
      valid = false;
    } else {
      document.getElementById('error-phone').textContent = '';
    }

    if (!inputBirthdate.value) {
      document.getElementById('error-birthdate').textContent = 'Date of birth is required.';
      valid = false;
    } else {
      document.getElementById('error-birthdate').textContent = '';
    }

    if (!inputAddress.value.trim()) {
      document.getElementById('error-address').textContent = 'Permanent address is required.';
      valid = false;
    } else {
      document.getElementById('error-address').textContent = '';
    }

    return valid;
  }

  /**
   * Validates inputs for Step 2.
   */
  function validateStep2() {
    let valid = true;
    if (!inputHighestEducation.value.trim()) {
      document.getElementById('error-highest-education').textContent = 'Educational degree attainment is required.';
      valid = false;
    } else {
      document.getElementById('error-highest-education').textContent = '';
    }

    if (!inputSchool.value.trim()) {
      document.getElementById('error-school').textContent = 'College or University name is required.';
      valid = false;
    } else {
      document.getElementById('error-school').textContent = '';
    }

    if (!inputYearsExperience.value.trim()) {
      document.getElementById('error-years-experience').textContent = 'Years of relevant experience is required.';
      valid = false;
    } else {
      document.getElementById('error-years-experience').textContent = '';
    }

    if (!inputEligibilityType.value.trim()) {
      document.getElementById('error-eligibility').textContent = 'Civil service eligibility or license is required.';
      valid = false;
    } else {
      document.getElementById('error-eligibility').textContent = '';
    }

    return valid;
  }

  /**
   * Validates mandatory document attachments.
   */
  function validateStep3() {
    if (!filePds.files || filePds.files.length === 0) {
      if (typeof showToast === 'function') {
        showToast('CSC Form 212 (Personal Data Sheet) is required.', 'warning');
      } else {
        alert('CSC Form 212 (Personal Data Sheet) is required.');
      }
      return false;
    }
    if (!fileTor.files || fileTor.files.length === 0) {
      if (typeof showToast === 'function') {
        showToast('Official Transcript of Records (TOR) is required.', 'warning');
      } else {
        alert('Official Transcript of Records (TOR) is required.');
      }
      return false;
    }
    return true;
  }

  /**
   * Renders summary for Step 4 review pane.
   */
  function populateReviewSummary() {
    const positionTitle = vacancyData ? vacancyData.title : 'Selected Position';
    const positionDept = vacancyData ? (vacancyData.department || vacancyData.department_code || 'NBSC') : 'NBSC';
    const pdsName = filePds.files[0] ? filePds.files[0].name : 'CSC Form 212 Attached';
    const torName = fileTor.files[0] ? fileTor.files[0].name : 'Transcript of Records Attached';
    const eligName = fileEligibility.files[0] ? fileEligibility.files[0].name : 'None attached';
    const trainName = fileTrainings.files[0] ? fileTrainings.files[0].name : 'None attached';

    reviewContent.innerHTML = `
      <div class="review-row">
        <span class="review-label">Applied Vacancy:</span>
        <span class="review-value"><strong>${escapeHtml(positionTitle)}</strong> (${escapeHtml(positionDept)})</span>
      </div>
      <div class="review-row">
        <span class="review-label">Full Legal Name:</span>
        <span class="review-value">${escapeHtml(inputFullName.value)}</span>
      </div>
      <div class="review-row">
        <span class="review-label">Contact Details:</span>
        <span class="review-value">${escapeHtml(inputEmail.value)} • ${escapeHtml(inputPhone.value)}</span>
      </div>
      <div class="review-row">
        <span class="review-label">Permanent Address:</span>
        <span class="review-value">${escapeHtml(inputAddress.value)}</span>
      </div>
      <div class="review-row">
        <span class="review-label">Date of Birth:</span>
        <span class="review-value">${escapeHtml(inputBirthdate.value)}</span>
      </div>
      <div class="review-row">
        <span class="review-label">Education & School:</span>
        <span class="review-value">${escapeHtml(inputHighestEducation.value)} — ${escapeHtml(inputSchool.value)}</span>
      </div>
      <div class="review-row">
        <span class="review-label">Relevant Experience:</span>
        <span class="review-value">${escapeHtml(inputYearsExperience.value)}</span>
      </div>
      <div class="review-row">
        <span class="review-label">Eligibility / License:</span>
        <span class="review-value">${escapeHtml(inputEligibilityType.value)}</span>
      </div>
      <div class="review-row">
        <span class="review-label">Primary Documents:</span>
        <span class="review-value">
          ✓ ${escapeHtml(pdsName)}<br>
          ✓ ${escapeHtml(torName)}
          ${fileEligibility.files[0] ? `<br>✓ ${escapeHtml(eligName)}` : ''}
          ${fileTrainings.files[0] ? `<br>✓ ${escapeHtml(trainName)}` : ''}
        </span>
      </div>
    `;
  }

  // Navigation Button Handlers
  document.getElementById('btn-next-1').addEventListener('click', () => {
    if (validateStep1()) goToStep(2);
  });

  document.getElementById('btn-prev-2').addEventListener('click', () => goToStep(1));
  document.getElementById('btn-next-2').addEventListener('click', () => {
    if (validateStep2()) goToStep(3);
  });

  document.getElementById('btn-prev-3').addEventListener('click', () => goToStep(2));
  document.getElementById('btn-next-3').addEventListener('click', () => {
    if (validateStep3()) goToStep(4);
  });

  document.getElementById('btn-prev-4').addEventListener('click', () => goToStep(3));

  // Form Submission
  const form = document.getElementById('form-application-wizard');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!checkOath.checked) {
      document.getElementById('error-oath').textContent = 'You must affirm the Oath of Truthfulness before submitting.';
      return;
    }
    document.getElementById('error-oath').textContent = '';

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `
      <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="0.75"/>
      </svg>
      Transmitting Official Packet...
    `;

    // Build FormData
    const formData = new FormData();
    formData.append('vacancy_id', vacancyId);
    formData.append('full_name', inputFullName.value.trim());
    formData.append('email', inputEmail.value.trim());
    formData.append('phone', inputPhone.value.trim());
    formData.append('birthdate', inputBirthdate.value);
    formData.append('address', inputAddress.value.trim());
    formData.append('highest_education', inputHighestEducation.value.trim());
    formData.append('school', inputSchool.value.trim());
    formData.append('years_experience', inputYearsExperience.value.trim());
    formData.append('eligibility', inputEligibilityType.value.trim());
    formData.append('cover_letter', textareaCoverLetter ? textareaCoverLetter.value.trim() : '');

    if (filePds.files[0]) formData.append('PDS_CS_FORM_212', filePds.files[0]);
    if (fileTor.files[0]) formData.append('TRANSCRIPT_OF_RECORDS', fileTor.files[0]);
    if (fileEligibility.files[0]) formData.append('ELIGIBILITY_PROOF', fileEligibility.files[0]);
    if (fileTrainings.files[0]) formData.append('TRAINING_CERTIFICATES', fileTrainings.files[0]);

    try {
      const res = await apiUpload('/applications/submit/', formData);
      if (res && res.success && res.data) {
        const trackingNumber = res.data.tracking_number;
        showSubmissionSuccessModal(trackingNumber);
      } else {
        const msg = (res && res.message) ? res.message : 'Application submission failed. Please check required fields.';
        if (typeof showToast === 'function') showToast(msg, 'error');
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Submit Official Application';
      }
    } catch (err) {
      console.error('Submission error:', err);
      if (typeof showToast === 'function') showToast('Network transmission error. Please retry.', 'error');
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Submit Official Application';
    }
  });

  /**
   * Displays modal upon successful submission with tracking code.
   */
  function showSubmissionSuccessModal(trackingNumber) {
    const modalHtml = `
      <div class="modal-backdrop" id="submission-modal">
        <div class="modal-card">
          <div style="font-size: 3rem; color: #10b981; margin-bottom: 0.5rem;">✓</div>
          <span class="badge badge--open mb-2">OFFICIALLY REGISTERED</span>
          <h2 style="color: #002b5c; font-size: 1.4rem; font-weight: 800; margin: 0.5rem 0;">Application Submitted Successfully!</h2>
          <p style="color: #475569; font-size: 0.9rem; line-height: 1.5; margin-bottom: 1.25rem;">
            Your credentials have been securely transmitted to the Northern Bukidnon State College HR Merit Selection Board under PRIME-HRM Level 2 standards.
          </p>

          <div style="background: #f8fafc; border: 1.5px solid #d4a843; border-radius: 10px; padding: 1rem; margin-bottom: 1.25rem;">
            <span style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; display: block;">Official CSC Tracking Docket</span>
            <div style="font-size: 1.5rem; font-weight: 800; color: #002b5c; letter-spacing: 0.05em; margin-top: 0.25rem;" id="modal-tracking-code">${escapeHtml(trackingNumber)}</div>
          </div>

          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 0.75rem; margin-bottom: 1.25rem; font-size: 0.82rem; color: #065f46; text-align: left;">
            <strong>&#9993; Email Confirmation Sent:</strong> A copy of this tracking docket has been dispatched to <strong>${escapeHtml(inputEmail.value.trim())}</strong>. Use your email and this tracking number to sign in to your Candidate Portal anytime.
          </div>

          <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 1.5rem;">
            Please keep a record of this tracking code to monitor your qualification screening, DSS scoring, and HRMPSB deliberation status.
          </p>

          <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
            <button type="button" class="btn btn--outline" id="btn-modal-portal" style="flex: 1; min-width: 170px;">
              Applicant Sign In &rarr;
            </button>
            <button type="button" class="btn btn--primary" id="btn-modal-track" style="flex: 1; min-width: 170px;">
              Live Status Tracker &rarr;
            </button>
          </div>
        </div>
      </div>
    `;

    // Append to body
    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div.firstElementChild);

    document.getElementById('btn-modal-track').addEventListener('click', () => {
      window.location.href = `../../track-application/track-application.html?appId=${encodeURIComponent(trackingNumber)}`;
    });

    const btnPortal = document.getElementById('btn-modal-portal');
    if (btnPortal) {
      btnPortal.addEventListener('click', () => {
        window.location.href = `../../auth/applicant-login/applicant-login.html`;
      });
    }
  }
  }

  /**
   * Helper: Setup Mobile Nav Toggle
   */
  function setupMobileNav() {
    const navToggleBtn = document.getElementById('nav-toggle-btn');
    const publicNavLinks = document.getElementById('public-nav-links');
    if (!navToggleBtn || !publicNavLinks) return;

    navToggleBtn.addEventListener('click', () => {
      const isOpen = publicNavLinks.classList.toggle('is-open');
      navToggleBtn.classList.toggle('is-active');
      navToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
      if (!navToggleBtn.contains(e.target) && !publicNavLinks.contains(e.target)) {
        publicNavLinks.classList.remove('is-open');
        navToggleBtn.classList.remove('is-active');
        navToggleBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /**
   * Helper: Setup Back To Top Button
   */
  function setupBackToTop() {
    const btnBackToTop = document.getElementById('btn-back-to-top');
    if (!btnBackToTop) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        btnBackToTop.classList.add('nbsc-back-to-top--visible');
      } else {
        btnBackToTop.classList.remove('nbsc-back-to-top--visible');
      }
    });

    btnBackToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});
