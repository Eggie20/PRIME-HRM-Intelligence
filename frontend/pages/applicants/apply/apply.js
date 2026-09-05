/**
 * NBSC PRIME-HRM Intelligence Hub — Application Wizard Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  const vacancyId = getQueryParam('vacancy_id');
  if (!vacancyId) {
    showToast('No vacancy selected. Redirecting to job board...', 'warning');
    setTimeout(() => {
      window.location.href = '../../vacancies/job-board/job-board.html';
    }, 1500);
    return;
  }

  // Load Vacancy Data
  let vacancyData = null;
  try {
    const res = await apiGet(`/vacancies/${vacancyId}/`);
    if (res.success && res.data && res.data.vacancy) {
      vacancyData = res.data.vacancy;
      renderVacancyHeader(vacancyData);
    } else {
      showToast('Position details could not be found.', 'error');
    }
  } catch (err) {
    showToast('Network error loading vacancy requirements.', 'error');
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

  // If user is currently logged in, prefill personal information
  const currentUser = getUser();
  if (currentUser) {
    inputFullName.value = currentUser.name || '';
    inputEmail.value = currentUser.email || '';
  }

  /**
   * Renders target position header details.
   * @param {Object} v
   */
  function renderVacancyHeader(v) {
    const titleEl = document.getElementById('target-title');
    const deptEl = document.getElementById('target-dept');
    const catEl = document.getElementById('target-category');
    const metaEl = document.getElementById('target-meta');

    if (titleEl) titleEl.textContent = v.title;
    if (deptEl) deptEl.textContent = `${v.department} Department • ${v.employment_status || 'COS'}`;
    if (catEl) catEl.textContent = v.category === 'TEACHING' ? 'Faculty Position' : 'Administrative Position';
    if (metaEl) {
      metaEl.innerHTML = `
        <span class="badge badge--neutral">SG ${v.salary_grade || 12}</span>
        <span class="badge badge--open ml-2">Open for Submissions</span>
      `;
    }
  }

  /**
   * Switches active wizard step with validation.
   * @param {number} newStep
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
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (newStep === 4) {
      populateReviewSummary();
    }
  }

  /**
   * Validates inputs for Step 1.
   * @returns {boolean}
   */
  function validateStep1() {
    let valid = true;
    if (!inputFullName.value.trim()) {
      document.getElementById('error-full-name').textContent = 'Full legal name is required.';
      valid = false;
    } else {
      document.getElementById('error-full-name').textContent = '';
    }

    if (!inputEmail.value.trim() || !validateEmail(inputEmail.value.trim())) {
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
      document.getElementById('error-address').textContent = 'Address is required.';
      valid = false;
    } else {
      document.getElementById('error-address').textContent = '';
    }

    return valid;
  }

  /**
   * Validates inputs for Step 2.
   * @returns {boolean}
   */
  function validateStep2() {
    let valid = true;
    if (!inputHighestEducation.value.trim()) {
      document.getElementById('error-highest-education').textContent = 'Degree attainment is required.';
      valid = false;
    } else {
      document.getElementById('error-highest-education').textContent = '';
    }
    return valid;
  }

  /**
   * Validates mandatory document attachments.
   * @returns {boolean}
   */
  function validateStep3() {
    if (!filePds.files || filePds.files.length === 0) {
      showToast('CSC Form 212 (Personal Data Sheet) is mandatory.', 'warning');
      return false;
    }
    if (!fileTor.files || fileTor.files.length === 0) {
      showToast('Official Transcript of Records (TOR) is mandatory.', 'warning');
      return false;
    }
    return true;
  }

  /**
   * Renders summary for Step 4 review pane.
   */
  function populateReviewSummary() {
    reviewContent.innerHTML = `
      <div class="mb-3">
        <strong>Position Applied:</strong> ${escapeHtml(vacancyData ? vacancyData.title : 'Selected Position')} (${escapeHtml(vacancyData ? vacancyData.department : '')})
      </div>
      <div class="mb-2">
        <strong>Applicant Name:</strong> ${escapeHtml(inputFullName.value)}
      </div>
      <div class="mb-2">
        <strong>Email & Phone:</strong> ${escapeHtml(inputEmail.value)} • ${escapeHtml(inputPhone.value)}
      </div>
      <div class="mb-2">
        <strong>Educational Attainment:</strong> ${escapeHtml(inputHighestEducation.value)} (${escapeHtml(inputSchool.value)})
      </div>
      <div class="mb-2">
        <strong>Civil Service Eligibility:</strong> ${escapeHtml(inputEligibilityType.value || 'None Specified')}
      </div>
      <div class="mb-2">
        <strong>Attached Documents:</strong>
        ${filePds.files[0] ? escapeHtml(filePds.files[0].name) : 'PDS'},
        ${fileTor.files[0] ? escapeHtml(fileTor.files[0].name) : 'TOR'}
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
      document.getElementById('error-oath').textContent = 'You must affirm the Oath of Truthfulness to submit.';
      return;
    }
    document.getElementById('error-oath').textContent = '';

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Transmitting Application...';

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
    formData.append('cover_letter', textareaCoverLetter.value.trim());

    if (filePds.files[0]) formData.append('PDS_CS_FORM_212', filePds.files[0]);
    if (fileTor.files[0]) formData.append('TRANSCRIPT_OF_RECORDS', fileTor.files[0]);
    if (fileEligibility.files[0]) formData.append('ELIGIBILITY_PROOF', fileEligibility.files[0]);
    if (fileTrainings.files[0]) formData.append('TRAINING_CERTIFICATES', fileTrainings.files[0]);

    try {
      const res = await apiUpload('/applications/submit/', formData);
      if (res.success && res.data) {
        const trackingNumber = res.data.tracking_number;
        showModal(
          'Application Submitted Successfully!',
          `
            <div class="text-center py-4">
              <div class="badge badge--open mb-3 font-md">OFFICIALLY REGISTERED</div>
              <p>Your application has been received by the Northern Bukidnon State College HR Selection Board.</p>
              <div class="p-3 my-4 card bg-surface">
                <span class="text-muted font-xs">Official CSC Tracking Number:</span>
                <div class="font-xl font-bold text-primary mt-1">${trackingNumber}</div>
              </div>
              <p class="font-xs text-muted">Please record this tracking number. You can track your progress at any time through our public tracking portal.</p>
            </div>
          `,
          'Track Application Now',
          () => {
            window.location.href = `../application-track/application-track.html?tracking=${encodeURIComponent(trackingNumber)}`;
          }
        );
      } else {
        showToast(res.message || 'Application submission failed.', 'error');
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Submit Official Application';
      }
    } catch (err) {
      showToast('Network error during application transmission.', 'error');
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Submit Official Application';
    }
  });
});
