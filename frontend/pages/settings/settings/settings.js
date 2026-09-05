/**
 * NBSC PRIME-HRM Intelligence Hub — System Settings Logic
 * Manages 4-Pillar DSS weight sliders, validation of 100% total sum,
 * institutional profile changes, and cryptographic audit ledger export.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSettings();
});

/**
 * Initializes sliders, listeners, and load stored preferences.
 */
function initSettings() {
  const sliderMerit = document.getElementById('slider-weight-merit');
  const sliderComp = document.getElementById('slider-weight-competence');
  const sliderEthics = document.getElementById('slider-weight-ethics');
  const sliderService = document.getElementById('slider-weight-service');

  [sliderMerit, sliderComp, sliderEthics, sliderService].forEach(slider => {
    if (slider) {
      slider.addEventListener('input', handleWeightChange);
    }
  });

  const btnSave = document.getElementById('btn-save-settings');
  if (btnSave) {
    btnSave.addEventListener('click', saveSettings);
  }

  const btnExport = document.getElementById('btn-export-audit');
  if (btnExport) {
    btnExport.addEventListener('click', exportAuditChain);
  }

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout && typeof logout === 'function') {
    btnLogout.addEventListener('click', logout);
  }

  loadSavedSettings();
}

/**
 * Handles slider changes and updates percentage labels and sum badge.
 */
function handleWeightChange() {
  const merit = parseInt(document.getElementById('slider-weight-merit')?.value || 30, 10);
  const comp = parseInt(document.getElementById('slider-weight-competence')?.value || 30, 10);
  const ethics = parseInt(document.getElementById('slider-weight-ethics')?.value || 20, 10);
  const service = parseInt(document.getElementById('slider-weight-service')?.value || 20, 10);

  // Update pills
  const pMerit = document.getElementById('val-pct-merit');
  const pComp = document.getElementById('val-pct-competence');
  const pEthics = document.getElementById('val-pct-ethics');
  const pService = document.getElementById('val-pct-service');

  if (pMerit) pMerit.textContent = `${merit}%`;
  if (pComp) pComp.textContent = `${comp}%`;
  if (pEthics) pEthics.textContent = `${ethics}%`;
  if (pService) pService.textContent = `${service}%`;

  // Sum check
  const total = merit + comp + ethics + service;
  const sumVal = document.getElementById('val-weight-sum');
  const sumBadge = document.getElementById('weight-total-badge');
  const validationMsg = document.getElementById('weight-validation-message');

  if (sumVal) sumVal.textContent = `${total}%`;

  if (sumBadge && validationMsg) {
    sumBadge.className = 'weight-total-indicator';
    if (total === 100) {
      sumBadge.classList.add('weight-total-indicator--valid');
      validationMsg.innerHTML = '<span class="text-success font-bold">&#10004; Valid:</span> Weight distribution equals exactly 100%. Balanced for Merit Selection Plan.';
    } else {
      sumBadge.classList.add('weight-total-indicator--invalid');
      validationMsg.innerHTML = `<span class="text-danger font-bold">&#9888; Warning:</span> Current sum is ${total}%. The total weight must equal exactly 100% to save.`;
    }
  }
}

/**
 * Loads preferences from localStorage.
 */
function loadSavedSettings() {
  const savedWeights = localStorage.getItem('nbsc_dss_weights');
  if (savedWeights) {
    try {
      const w = JSON.parse(savedWeights);
      if (document.getElementById('slider-weight-merit')) document.getElementById('slider-weight-merit').value = w.merit || 30;
      if (document.getElementById('slider-weight-competence')) document.getElementById('slider-weight-competence').value = w.competence || 30;
      if (document.getElementById('slider-weight-ethics')) document.getElementById('slider-weight-ethics').value = w.ethics || 20;
      if (document.getElementById('slider-weight-service')) document.getElementById('slider-weight-service').value = w.service || 20;
      handleWeightChange();
    } catch (e) {
      console.warn('Error parsing saved weights:', e);
    }
  }
}

/**
 * Validates and saves configured settings.
 */
function saveSettings() {
  const merit = parseInt(document.getElementById('slider-weight-merit')?.value || 30, 10);
  const comp = parseInt(document.getElementById('slider-weight-competence')?.value || 30, 10);
  const ethics = parseInt(document.getElementById('slider-weight-ethics')?.value || 20, 10);
  const service = parseInt(document.getElementById('slider-weight-service')?.value || 20, 10);

  const total = merit + comp + ethics + service;
  if (total !== 100) {
    if (typeof showToast === 'function') {
      showToast(`Cannot save: 4-Pillar DSS weights sum to ${total}%, must be 100%.`, 'error');
    }
    return;
  }

  const weights = { merit, competence: comp, ethics, service };
  localStorage.setItem('nbsc_dss_weights', JSON.stringify(weights));

  if (typeof showToast === 'function') {
    showToast('System settings and 4-Pillar DSS weights successfully saved!', 'success');
  }
}

/**
 * Fetches the entire cryptographic audit chain from /api/v1/audit/chain/ and triggers a download.
 * @returns {Promise<void>}
 */
async function exportAuditChain() {
  try {
    const response = await fetch(`${API_BASE_URL}/audit/chain/`, {
      headers: {
        ...(typeof getAuthToken === 'function' && getAuthToken() ? { 'Authorization': `Bearer ${getAuthToken()}` } : {})
      }
    });

    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Failed to export audit chain');

    const chainData = json.data || {};
    const blob = new Blob([JSON.stringify(chainData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `NBSC_Audit_Chain_Snapshot_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (typeof showToast === 'function') {
      showToast('Audit chain ledger snapshot exported successfully.', 'success');
    }
  } catch (err) {
    console.error('Error exporting audit chain:', err);
    if (typeof showToast === 'function') {
      showToast('Error exporting audit ledger.', 'error');
    }
  }
}
