/**
 * NBSC PRIME-HRM Intelligence Hub — System Settings Logic
 * Manages 4-Pillar DSS weight sliders, live multi-segment visual spectrum bar,
 * validation of 100% total sum, institutional profile, and cryptographic audit export.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSettings();
});

/**
 * Initializes sliders, listeners, and loads stored preferences.
 */
function initSettings() {
  if (typeof requireAuth === 'function' && typeof ROLES !== 'undefined') {
    requireAuth([ROLES.HR_ADMIN]);
  }

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

  const btnReset = document.getElementById('btn-reset-defaults');
  if (btnReset) {
    btnReset.addEventListener('click', resetDefaultWeights);
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
 * Handles slider changes and updates percentage labels, visual spectrum bar, KPI stats, and sum badge.
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

  // Update visual distribution spectrum bar segments
  const bMerit = document.getElementById('bar-merit');
  const bComp = document.getElementById('bar-comp');
  const bEthics = document.getElementById('bar-ethics');
  const bService = document.getElementById('bar-service');

  if (bMerit) {
    bMerit.style.width = `${merit}%`;
    bMerit.textContent = merit >= 7 ? `${merit}%` : '';
    bMerit.title = `Merit & Qualifications: ${merit}%`;
  }
  if (bComp) {
    bComp.style.width = `${comp}%`;
    bComp.textContent = comp >= 7 ? `${comp}%` : '';
    bComp.title = `Competence & Skills: ${comp}%`;
  }
  if (bEthics) {
    bEthics.style.width = `${ethics}%`;
    bEthics.textContent = ethics >= 7 ? `${ethics}%` : '';
    bEthics.title = `Ethics & Integrity: ${ethics}%`;
  }
  if (bService) {
    bService.style.width = `${service}%`;
    bService.textContent = service >= 7 ? `${service}%` : '';
    bService.title = `Service Orientation: ${service}%`;
  }

  // Sum check
  const total = merit + comp + ethics + service;
  const sumVal = document.getElementById('val-weight-sum');
  const sumBadge = document.getElementById('weight-total-badge');
  const validationMsg = document.getElementById('weight-validation-message');
  const kpiSum = document.getElementById('stat-dss-sum');
  const kpiFlag = document.getElementById('kpi-sum-flag');

  if (sumVal) sumVal.textContent = `${total}%`;
  if (kpiSum) kpiSum.textContent = `${total}%`;

  if (sumBadge && validationMsg) {
    sumBadge.className = 'weight-total-indicator';
    validationMsg.className = 'validation-banner';

    if (total === 100) {
      sumBadge.classList.add('weight-total-indicator--valid');
      validationMsg.classList.add('validation-banner--valid');
      validationMsg.innerHTML = '<span style="font-size: 1.1rem; line-height: 1;">&#10004;</span> <div><strong>Valid Distribution:</strong> Sum equals exactly 100%. Distribution meets CSC PRIME-HRM Merit Selection standards.</div>';
      if (kpiFlag) {
        kpiFlag.className = 'stat-flag flag-green';
        kpiFlag.textContent = '100% Balanced';
      }
    } else {
      sumBadge.classList.add('weight-total-indicator--invalid');
      validationMsg.classList.add('validation-banner--invalid');
      const diff = Math.abs(100 - total);
      const direction = total > 100 ? 'exceeds by' : 'is short by';
      validationMsg.innerHTML = `<span style="font-size: 1.1rem; line-height: 1;">&#9888;</span> <div><strong>Distribution Alert:</strong> Sum is <strong>${total}%</strong> (${direction} ${diff}%). Total weight across all 4 pillars must equal exactly 100% to save.</div>`;
      if (kpiFlag) {
        kpiFlag.className = 'stat-flag flag-neutral';
        kpiFlag.textContent = `${total}% Unbalanced`;
      }
    }
  }
}

/**
 * Resets weights back to default standard: 30%, 30%, 20%, 20%.
 */
function resetDefaultWeights() {
  if (document.getElementById('slider-weight-merit')) document.getElementById('slider-weight-merit').value = 30;
  if (document.getElementById('slider-weight-competence')) document.getElementById('slider-weight-competence').value = 30;
  if (document.getElementById('slider-weight-ethics')) document.getElementById('slider-weight-ethics').value = 20;
  if (document.getElementById('slider-weight-service')) document.getElementById('slider-weight-service').value = 20;
  handleWeightChange();

  if (typeof showToast === 'function') {
    showToast('4-Pillar weights reset to standard defaults (30-30-20-20).', 'info');
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
  } else {
    handleWeightChange();
  }

  // Load institutional profile if stored
  const savedProfile = localStorage.getItem('nbsc_inst_profile');
  if (savedProfile) {
    try {
      const p = JSON.parse(savedProfile);
      if (document.getElementById('input-inst-name') && p.name) document.getElementById('input-inst-name').value = p.name;
      if (document.getElementById('input-inst-address') && p.address) document.getElementById('input-inst-address').value = p.address;
      if (document.getElementById('input-president-name') && p.president) document.getElementById('input-president-name').value = p.president;
      if (document.getElementById('input-hrmo-name') && p.hrmo) document.getElementById('input-hrmo-name').value = p.hrmo;
    } catch (e) {
      console.warn('Error parsing institutional profile:', e);
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
      showToast(`Cannot save: 4-Pillar DSS weights sum to ${total}%, must equal 100%.`, 'error');
    } else {
      alert(`Cannot save: 4-Pillar DSS weights sum to ${total}%, must equal 100%.`);
    }
    return;
  }

  const weights = { merit, competence: comp, ethics, service };
  localStorage.setItem('nbsc_dss_weights', JSON.stringify(weights));

  // Save institutional profile
  const instName = document.getElementById('input-inst-name')?.value || 'Northern Bukidnon State College';
  const instAddress = document.getElementById('input-inst-address')?.value || 'Kihare, Manolo Fortich, Bukidnon 8703';
  const presName = document.getElementById('input-president-name')?.value || 'Dr. Jovelyn G. Delosa';
  const hrmoName = document.getElementById('input-hrmo-name')?.value || 'Maria Teresa Santos';

  const profile = { name: instName, address: instAddress, president: presName, hrmo: hrmoName };
  localStorage.setItem('nbsc_inst_profile', JSON.stringify(profile));

  const btnSave = document.getElementById('btn-save-settings');
  if (btnSave) {
    const originalText = btnSave.innerHTML;
    btnSave.innerHTML = '&#10004; Settings Saved!';
    setTimeout(() => {
      btnSave.innerHTML = originalText;
    }, 2000);
  }

  if (typeof showToast === 'function') {
    showToast('System settings and 4-Pillar DSS weights successfully saved!', 'success');
  }
}

/**
 * Fetches the cryptographic audit chain and triggers a download.
 */
async function exportAuditChain() {
  try {
    const response = await fetch(`${API_BASE_URL}/audit/chain/`, {
      headers: {
        ...(typeof getAuthToken === 'function' && getAuthToken() ? { 'Authorization': `Bearer ${getAuthToken()}` } : {})
      }
    });

    let chainData = {};
    if (response.ok) {
      const json = await response.json();
      chainData = json.data || {};
    } else {
      if (typeof db !== 'undefined' && db.getTable) {
        chainData = {
          audit_ledger: db.getTable('audit_logs') || [],
          exported_at: new Date().toISOString(),
          system: 'NBSC PRIME-HRM Intelligence Hub',
          status: 'OFFLINE_CACHE_SNAPSHOT'
        };
      }
    }

    const blob = new Blob([JSON.stringify(chainData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `NBSC_Audit_Chain_Snapshot_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (typeof showToast === 'function') {
      showToast('Audit chain ledger snapshot exported successfully.', 'success');
    }
  } catch (err) {
    console.error('Error exporting audit chain:', err);
    if (typeof db !== 'undefined' && db.getTable) {
      const chainData = {
        audit_ledger: db.getTable('audit_logs') || [],
        exported_at: new Date().toISOString(),
        system: 'NBSC PRIME-HRM Intelligence Hub'
      };
      const blob = new Blob([JSON.stringify(chainData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NBSC_Audit_Chain_Snapshot_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (typeof showToast === 'function') {
        showToast('Local audit ledger snapshot exported.', 'success');
      }
    } else if (typeof showToast === 'function') {
      showToast('Error exporting audit ledger.', 'error');
    }
  }
}
