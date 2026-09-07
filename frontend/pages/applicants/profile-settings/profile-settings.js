/**
 * NBSC Candidate Portal — Profile Settings & ID Verification Logic
 * Handles candidate data presentation, correction ticket submission with proof ID,
 * and live synchronization with HRMO verification database.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Current candidate profile (Carlo Mendoza)
  const candidate = {
    id: 'usr-004',
    applicant_id: 'APP-2026-00417',
    name: 'Carlo D. Mendoza',
    email: 'carlo.mendoza@email.com',
    phone: '+63 917 555 0192',
    education: 'Bachelor of Science in Computer Science',
    eligibility: 'Career Service Professional / RA 1080 Equivalent',
    experience: '2 Years (Full-time Software Developer / IT Specialist)',
    training: '16 Hours (Accredited IT Systems Training)',
    avatar: 'CM'
  };

  // Sync profile from DB if exists
  if (typeof db !== 'undefined') {
    const users = db.getTable('users') || [];
    const dbUser = users.find(u => u.email === candidate.email || u.id === candidate.id);
    if (dbUser) {
      if (dbUser.name) candidate.name = dbUser.name;
      if (dbUser.phone) candidate.phone = dbUser.phone;
    }
  }

  // Populate UI
  populateProfile(candidate);

  // Field selector change handler
  const selectField = document.getElementById('select-field');
  const inputCurrentVal = document.getElementById('input-current-val');
  const inputNewVal = document.getElementById('input-new-val');

  if (selectField && inputCurrentVal) {
    selectField.addEventListener('change', () => {
      const field = selectField.value;
      switch (field) {
        case 'name':
          inputCurrentVal.value = candidate.name;
          if (inputNewVal) inputNewVal.placeholder = 'e.g. Carlo De Guzman Mendoza';
          break;
        case 'email':
          inputCurrentVal.value = candidate.email;
          if (inputNewVal) inputNewVal.placeholder = 'e.g. carlo.mendoza@nbsc.edu.ph';
          break;
        case 'phone':
          inputCurrentVal.value = candidate.phone;
          if (inputNewVal) inputNewVal.placeholder = 'e.g. +63 918 234 5678';
          break;
        case 'education':
          inputCurrentVal.value = candidate.education;
          if (inputNewVal) inputNewVal.placeholder = 'e.g. Master of Science in Information Technology';
          break;
        case 'eligibility':
          inputCurrentVal.value = candidate.eligibility;
          if (inputNewVal) inputNewVal.placeholder = 'e.g. RA 1080 Licensed Professional Teacher';
          break;
        case 'experience':
          inputCurrentVal.value = candidate.experience;
          if (inputNewVal) inputNewVal.placeholder = 'e.g. 3 Years Systems & Network Administration';
          break;
        default:
          inputCurrentVal.value = '';
      }
    });
  }

  // ID Upload handling & preview
  let attachedProof = null;
  const dropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('file-id-proof');
  const btnBrowse = document.getElementById('btn-browse-file');
  const emptyState = document.getElementById('dropzone-empty-state');
  const previewContainer = document.getElementById('upload-preview-container');
  const previewImg = document.getElementById('preview-img');
  const previewFilename = document.getElementById('preview-filename');
  const previewFilesize = document.getElementById('preview-filesize');
  const btnRemove = document.getElementById('btn-remove-file');

  if (btnBrowse && fileInput) {
    btnBrowse.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => {
      if (!attachedProof) fileInput.click();
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--brass)';
      dropzone.style.background = '#FDFBF7';
    });

    dropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '';
      dropzone.style.background = '';
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '';
      dropzone.style.background = '';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processUploadedFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        processUploadedFile(fileInput.files[0]);
      }
    });
  }

  if (btnRemove) {
    btnRemove.addEventListener('click', (e) => {
      e.stopPropagation();
      clearProofAttachment();
    });
  }

  function processUploadedFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      attachedProof = {
        fileName: file.name,
        fileSize: formatBytes(file.size),
        dataUrl: e.target.result,
        attachedAt: new Date().toISOString()
      };
      showProofPreview(attachedProof);
    };
    reader.readAsDataURL(file);
  }

  function showProofPreview(proof) {
    if (emptyState) emptyState.classList.add('d-none');
    if (previewContainer) previewContainer.classList.remove('d-none');
    if (previewImg) previewImg.src = proof.dataUrl;
    if (previewFilename) previewFilename.textContent = proof.fileName;
    if (previewFilesize) previewFilesize.textContent = `${proof.fileSize} • Valid Government Document`;
  }

  function clearProofAttachment() {
    attachedProof = null;
    if (fileInput) fileInput.value = '';
    if (previewContainer) previewContainer.classList.add('d-none');
    if (emptyState) emptyState.classList.remove('d-none');
  }

  // Quick Demo Sample ID buttons
  const sampleBtns = document.querySelectorAll('.sample-id-btn');
  sampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      const num = btn.dataset.num;
      const sample = btn.dataset.sample;

      const selectType = document.getElementById('select-id-type');
      const inputNum = document.getElementById('input-id-number');
      if (selectType) selectType.value = type;
      if (inputNum) inputNum.value = num;

      // Generate SVG data url for realistic ID card preview
      const svgId = sample === 'philid'
        ? generateSamplePhilIDSvg(candidate.name, num)
        : generateSamplePrcSvg(candidate.name, num);

      attachedProof = {
        fileName: sample === 'philid' ? 'PhilID_National_Card_Front.png' : 'PRC_Professional_License.png',
        fileSize: '620 KB',
        dataUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgId),
        attachedAt: new Date().toISOString()
      };
      showProofPreview(attachedProof);
    });
  });

  // Correction Form Submission
  const formCorrection = document.getElementById('form-correction');
  const formMsg = document.getElementById('form-message');

  if (formCorrection) {
    formCorrection.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!attachedProof) {
        showFormMessage('Please attach a clear photo or scan of your valid government ID as proof of identity.', 'error');
        return;
      }

      const field = selectField.value;
      const currentVal = inputCurrentVal.value.trim();
      const newVal = inputNewVal.value.trim();
      const idType = document.getElementById('select-id-type').value;
      const idNumber = document.getElementById('input-id-number').value.trim();
      const reason = document.getElementById('input-reason').value.trim();

      if (!field || !newVal || !idType || !idNumber || !reason) {
        showFormMessage('Please fill out all required fields before submitting.', 'error');
        return;
      }

      const ticket = {
        applicant_id: candidate.id,
        applicant_name: candidate.name,
        applicant_email: candidate.email,
        field_name: field,
        field_label: selectField.options[selectField.selectedIndex].text,
        current_value: currentVal,
        requested_value: newVal,
        id_type: idType,
        id_number: idNumber,
        reason: reason,
        proof_document: {
          file_name: attachedProof.fileName,
          file_size: attachedProof.fileSize,
          data_url: attachedProof.dataUrl
        }
      };

      let submittedTicket = null;
      if (typeof db !== 'undefined' && typeof db.submitCorrectionRequest === 'function') {
        submittedTicket = db.submitCorrectionRequest(ticket);
      } else {
        // Fallback local storage
        submittedTicket = {
          id: 'CR-' + Date.now().toString().slice(-6),
          ...ticket,
          status: 'PENDING',
          created_at: new Date().toISOString()
        };
      }

      showFormMessage(`Correction request successfully submitted! Tracking Ticket Docket #${submittedTicket.id} has been registered. An HRMO Administrative Reviewer will verify your ID document.`, 'success');

      // Reset form
      formCorrection.reset();
      clearProofAttachment();
      if (inputCurrentVal) inputCurrentVal.value = '';

      // Refresh tickets list
      renderTickets();
    });
  }

  // Refresh Tickets button
  const btnRefreshTickets = document.getElementById('btn-refresh-tickets');
  if (btnRefreshTickets) {
    btnRefreshTickets.addEventListener('click', () => {
      renderTickets();
    });
  }

  // Initial tickets render
  renderTickets();

  // Mobile Navigation Drawer Toggle
  const navToggleBtn = document.getElementById('nav-toggle-btn');
  const mobileDrawer = document.getElementById('topbar-mobile-drawer');
  if (navToggleBtn && mobileDrawer) {
    navToggleBtn.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.toggle('is-open');
      navToggleBtn.classList.toggle('is-active', isOpen);
      navToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // Sign out buttons (Desktop & Mobile)
  function handleSignOut() {
    if (confirm('Are you sure you want to sign out of the Candidate Portal?')) {
      if (typeof logout === 'function') {
        logout('../../auth/applicant-login/applicant-login.html');
      } else {
        localStorage.removeItem('nbsc_access_token');
        localStorage.removeItem('nbsc_user');
        window.location.href = '../../auth/applicant-login/applicant-login.html';
      }
    }
  }

  const btnLogout = document.getElementById('btn-applicant-logout');
  if (btnLogout) btnLogout.addEventListener('click', handleSignOut);

  const btnMobileLogout = document.getElementById('btn-mobile-logout');
  if (btnMobileLogout) btnMobileLogout.addEventListener('click', handleSignOut);

  // ── Helper Functions ─────────────────────────────────────────
  function populateProfile(data) {
    const setElem = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setElem('sidebar-name', data.name);
    setElem('disp-fullname', data.name);
    setElem('nav-username', data.name);
    setElem('mobile-username', data.name);
    setElem('mobile-avatar', data.avatar || 'CM');
    setElem('sidebar-email', data.email);
    setElem('disp-email', data.email);
    setElem('sidebar-phone', data.phone);
    setElem('disp-phone', data.phone);
    setElem('sidebar-degree', data.education);
    setElem('disp-education', data.education);
    setElem('sidebar-elig', data.eligibility);
    setElem('disp-eligibility', data.eligibility);
    setElem('disp-experience', data.experience);
  }

  function showFormMessage(msg, type) {
    if (!formMsg) return;
    formMsg.textContent = msg;
    formMsg.className = `form-message form-message--${type}`;
    formMsg.classList.remove('d-none');
    setTimeout(() => {
      if (type === 'success') {
        formMsg.classList.add('d-none');
      }
    }, 8000);
  }

  function renderTickets() {
    const container = document.getElementById('tickets-container');
    if (!container) return;

    let tickets = [];
    if (typeof db !== 'undefined') {
      tickets = db.getTable('correction_requests') || [];
    }

    // Filter for current applicant
    const userTickets = tickets.filter(t => 
      t.applicant_email === candidate.email || 
      t.applicant_id === candidate.id ||
      t.applicant_name === candidate.name
    );

    if (userTickets.length === 0) {
      container.innerHTML = `
        <div class="ticket-empty">
          <div style="font-size: 24px; margin-bottom: 6px;">&#128194;</div>
          <strong>No Information Correction Requests on File</strong>
          <p style="font-size: 13px; margin: 4px 0 0;">All your biographical and qualification records are up to date. If any discrepancy appears in the future, use the form above to submit an authenticated correction.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = userTickets.map(t => {
      const statusClass = (t.status || 'PENDING').toLowerCase();
      const statusLabel = t.status === 'APPROVED' 
        ? '✓ Approved & Synced' 
        : t.status === 'REJECTED' 
        ? '✕ Rejected' 
        : '⏳ Pending HRMO Verification';

      const formattedDate = t.created_at 
        ? new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Recent';

      return `
        <div class="ticket-card ticket-card--${statusClass}">
          <div class="ticket-header">
            <div>
              <span class="ticket-id code">${escapeHtml(t.id || 'CR-REQ')}</span>
              <span style="margin: 0 6px; color: var(--line);">&bull;</span>
              <strong>${escapeHtml(t.field_label || t.field_name || 'Record Field')}</strong>
            </div>
            <span class="ticket-badge ticket-badge--${statusClass}">${statusLabel}</span>
          </div>

          <div class="ticket-diff-box">
            <div>
              <div class="diff-side-label">Original Value on File:</div>
              <div class="diff-old">${escapeHtml(t.current_value || '—')}</div>
            </div>
            <div class="diff-arrow">&rarr;</div>
            <div>
              <div class="diff-side-label">Requested Accurate Value:</div>
              <div class="diff-new">${escapeHtml(t.requested_value || '—')}</div>
            </div>
          </div>

          <div style="font-size: 12.5px; color: var(--ink-2); background: #F6F7F3; padding: 6px 10px; border-radius: 4px;">
            <strong>Justification:</strong> ${escapeHtml(t.reason || 'None provided')}
          </div>

          <div class="ticket-footer">
            <div class="ticket-proof-tag">
              <span>&#128179;</span>
              <span><strong>${escapeHtml(t.id_type || 'Valid ID')}</strong> (${escapeHtml(t.id_number || 'Verified')})</span>
            </div>
            <div class="text-muted">
              Submitted: ${formattedDate}
              ${t.approved_by ? `&bull; Verified by ${escapeHtml(t.approved_by)}` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function generateSamplePhilIDSvg(name, idNum) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" width="360" height="220">
      <rect width="360" height="220" rx="10" fill="#f0f7f4" stroke="#3F7D58" stroke-width="3"/>
      <rect x="15" y="15" width="330" height="36" rx="4" fill="#152238"/>
      <text x="180" y="38" fill="#ffffff" font-size="12" font-family="sans-serif" font-weight="bold" text-anchor="middle">REPUBLIC OF THE PHILIPPINES &bull; PHILID</text>
      <rect x="25" y="65" width="80" height="100" rx="6" fill="#2B3B57" stroke="#A97C22" stroke-width="2"/>
      <text x="65" y="120" fill="#ffffff" font-size="28" font-family="sans-serif" text-anchor="middle">CM</text>
      <text x="120" y="82" fill="#5B6472" font-size="10" font-family="sans-serif">APPLICANT LEGAL NAME:</text>
      <text x="120" y="100" fill="#152238" font-size="13" font-family="sans-serif" font-weight="bold">${name.toUpperCase()}</text>
      <text x="120" y="125" fill="#5B6472" font-size="10" font-family="sans-serif">CARD CONTROL NUMBER:</text>
      <text x="120" y="142" fill="#A97C22" font-size="12" font-family="monospace" font-weight="bold">${idNum}</text>
      <text x="120" y="165" fill="#3F7D58" font-size="9" font-family="sans-serif" font-weight="bold">&#10003; PHILIPPINE STATISTIC AUTHORITY AUTHENTICATED</text>
      <rect x="25" y="180" width="310" height="24" rx="3" fill="#EEF0E9"/>
      <text x="180" y="196" fill="#152238" font-size="9" font-family="monospace" text-anchor="middle">&lt;PHL19288472&lt;&lt;90142281&lt;&lt;MENDOZA&lt;&lt;CARLO&lt;&lt;</text>
    </svg>`;
  }

  function generateSamplePrcSvg(name, idNum) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" width="360" height="220">
      <rect width="360" height="220" rx="10" fill="#faf5eb" stroke="#A97C22" stroke-width="3"/>
      <rect x="15" y="15" width="330" height="36" rx="4" fill="#2B3B57"/>
      <text x="180" y="38" fill="#ffffff" font-size="11" font-family="sans-serif" font-weight="bold" text-anchor="middle">PROFESSIONAL REGULATION COMMISSION</text>
      <rect x="25" y="65" width="80" height="100" rx="6" fill="#152238" stroke="#3F7D58" stroke-width="2"/>
      <text x="65" y="120" fill="#ffffff" font-size="28" font-family="sans-serif" text-anchor="middle">CM</text>
      <text x="120" y="82" fill="#5B6472" font-size="10" font-family="sans-serif">LICENSED PROFESSIONAL:</text>
      <text x="120" y="100" fill="#152238" font-size="13" font-family="sans-serif" font-weight="bold">${name.toUpperCase()}</text>
      <text x="120" y="125" fill="#5B6472" font-size="10" font-family="sans-serif">REGISTRATION NO:</text>
      <text x="120" y="142" fill="#A97C22" font-size="12" font-family="monospace" font-weight="bold">${idNum}</text>
      <text x="120" y="165" fill="#3F7D58" font-size="9" font-family="sans-serif" font-weight="bold">&#10003; REPUBLIC ACT 1080 VERIFIED</text>
      <rect x="25" y="180" width="310" height="24" rx="3" fill="#EEF0E9"/>
      <text x="180" y="196" fill="#152238" font-size="9" font-family="monospace" text-anchor="middle">PRC-REG-0149821&lt;&lt;IT-SPECIALIST&lt;&lt;MENDOZA&lt;&lt;</text>
    </svg>`;
  }
});
