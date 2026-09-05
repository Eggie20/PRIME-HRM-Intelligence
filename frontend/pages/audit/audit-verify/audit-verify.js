/**
 * NBSC PRIME-HRM Intelligence Hub — Audit Chain Integrity Verifier Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Authorization guard
  requireAuth([ROLES.HR_ADMIN, ROLES.HRMPSB_MEMBER, ROLES.DEPT_HEAD]);

  // Set user profile in sidebar
  const user = getUser();
  if (user) {
    const nameEl = document.getElementById('user-display-name');
    const roleEl = document.getElementById('user-display-role');
    const avatarEl = document.getElementById('user-avatar');
    if (nameEl) nameEl.textContent = user.name || user.email;
    if (roleEl) roleEl.textContent = ROLE_LABELS[user.role] || user.role;
    if (avatarEl) {
      avatarEl.textContent = (user.name || user.email).substring(0, 2).toUpperCase();
    }
  }

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      logout('/pages/auth/admin-login/admin-login.html');
    });
  }

  const btnRunVerify = document.getElementById('btn-run-verify');
  const btnCopyReport = document.getElementById('btn-copy-report');
  const logConsole = document.getElementById('verifier-log-console');
  const logTimestamp = document.getElementById('log-timestamp');

  let latestReport = null;

  /**
   * Runs the cryptographic verification check against backend.
   */
  async function runVerification() {
    if (btnRunVerify) {
      btnRunVerify.disabled = true;
      btnRunVerify.textContent = 'Verifying Hash Chain...';
    }

    const now = new Date();
    if (logTimestamp) logTimestamp.textContent = formatDate(now.toISOString());

    logConsole.textContent = `[${now.toLocaleTimeString()}] INITIATING CRYPTOGRAPHIC INTEGRITY VERIFICATION SEQUENCE...\n`
      + `[${now.toLocaleTimeString()}] Querying MongoDB audit ledger for all linked blocks...\n`
      + `[${now.toLocaleTimeString()}] Recomputing cryptographic hashes using SHA-256 deterministic serialization...`;

    try {
      const response = await apiGet('/audit/verify/');
      const data = response.data || {};
      const report = data.report || { valid: false, total_blocks: 0, message: 'No report returned' };
      latestReport = report;

      renderVerificationResults(report);

      const finishTime = new Date().toLocaleTimeString();
      if (report.valid) {
        logConsole.textContent += `\n[${finishTime}] [PASS] Genesis Block #0 validated (prev_hash = '0'*64).`
          + `\n[${finishTime}] [PASS] All ${report.total_blocks} block pointers sequentially matched.`
          + `\n[${finishTime}] [PASS] Deterministic payload JSON serialization matched stored hashes.`
          + `\n[${finishTime}] [PASS] Zero cryptographic anomalies detected.`
          + `\n[${finishTime}] CONCLUSION: 100% IMMUTABLE & VERIFIED.`;
        showToast('Audit chain verification passed: 100% intact!', 'success');
      } else {
        logConsole.textContent += `\n[${finishTime}] [FAIL] Integrity anomaly detected at Block #${report.tampered_block_index}!`
          + `\n[${finishTime}] [FAIL] Message: ${report.message}`
          + `\n[${finishTime}] CONCLUSION: INTEGRITY COMPROMISED.`;
        showToast(`Audit chain compromised: ${report.message}`, 'error', 5000);
      }

    } catch (err) {
      console.error('Verification failure:', err);
      logConsole.textContent += `\n[ERROR] Verification call failed: ${err.message || 'Network error'}`;
      showToast('Could not execute chain verification check.', 'error');
    } finally {
      if (btnRunVerify) {
        btnRunVerify.disabled = false;
        btnRunVerify.textContent = '▶ Run Full Chain Verification';
      }
    }
  }

  /**
   * Updates DOM status based on verification report.
   * @param {Object} report
   */
  function renderVerificationResults(report) {
    const card = document.getElementById('verifier-status-card');
    const pulseIcon = document.getElementById('verifier-pulse-icon');
    const shieldGlyph = document.getElementById('shield-glyph');
    const titleEl = document.getElementById('heading-verifier-status');
    const descEl = document.getElementById('verifier-status-desc');
    const totalBlocksEl = document.getElementById('stat-total-blocks');
    const tamperedBlocksEl = document.getElementById('stat-tampered-blocks');
    const chainStateEl = document.getElementById('stat-chain-state');

    totalBlocksEl.textContent = report.total_blocks || 0;

    if (report.valid) {
      card.className = 'card mb-6 verifier-hero-card';
      pulseIcon.className = 'verifier-pulse-icon mb-4';
      shieldGlyph.textContent = '🛡️';
      titleEl.textContent = 'Cryptographic Chain Verified Valid';
      titleEl.className = 'card__title font-2xl mb-2 text-success';
      descEl.textContent = `All ${report.total_blocks} blocks in the NBSC PRIME-HRM audit ledger have been recomputed from Genesis and verified cryptographically intact.`;
      tamperedBlocksEl.textContent = '0';
      tamperedBlocksEl.className = 'font-xl font-bold text-success';
      chainStateEl.textContent = '100% INTACT';
      chainStateEl.className = 'font-xl font-bold text-success';

      updateChecklistIcons(true);
    } else {
      card.className = 'card mb-6 verifier-hero-card verifier-hero-card--invalid';
      pulseIcon.className = 'verifier-pulse-icon verifier-pulse-icon--invalid mb-4';
      shieldGlyph.textContent = '⚠️';
      titleEl.textContent = 'Cryptographic Integrity Warning';
      titleEl.className = 'card__title font-2xl mb-2 text-danger';
      descEl.textContent = `ALERT: ${report.message || 'Tampering or hash mismatch detected in audit ledger.'}`;
      tamperedBlocksEl.textContent = report.tampered_block_index !== undefined ? `#${report.tampered_block_index}` : '1+';
      tamperedBlocksEl.className = 'font-xl font-bold text-danger';
      chainStateEl.textContent = 'COMPROMISED';
      chainStateEl.className = 'font-xl font-bold text-danger';

      updateChecklistIcons(false, report.tampered_block_index);
    }
  }

  /**
   * Updates the checklist indicators.
   * @param {boolean} isValid
   * @param {number|null} tamperedIndex
   */
  function updateChecklistIcons(isValid, tamperedIndex = null) {
    const stepGenesis = document.getElementById('step-genesis-icon');
    const stepPointers = document.getElementById('step-pointers-icon');
    const stepPayloads = document.getElementById('step-payloads-icon');
    const stepHead = document.getElementById('step-head-icon');

    if (isValid) {
      [stepGenesis, stepPointers, stepPayloads, stepHead].forEach(el => {
        if (el) {
          el.className = 'step-check-icon step-check-icon--pass';
          el.textContent = '✔';
        }
      });
    } else {
      if (tamperedIndex === 0 && stepGenesis) {
        stepGenesis.className = 'step-check-icon step-check-icon--fail';
        stepGenesis.textContent = '✖';
      } else if (stepPointers) {
        stepPointers.className = 'step-check-icon step-check-icon--fail';
        stepPointers.textContent = '✖';
      }
    }
  }

  // Copy report listener
  if (btnCopyReport) {
    btnCopyReport.addEventListener('click', () => {
      const reportText = `NBSC PRIME-HRM CRYPTOGRAPHIC AUDIT VERIFICATION REPORT\n`
        + `Generated: ${new Date().toISOString()}\n`
        + `Total Blocks: ${latestReport ? latestReport.total_blocks : 0}\n`
        + `Integrity Status: ${latestReport && latestReport.valid ? 'PASS (100% INTACT)' : 'FAIL (TAMPERED)'}\n`
        + `Details:\n${logConsole.textContent}`;

      navigator.clipboard.writeText(reportText).then(() => {
        showToast('Full audit verification report copied to clipboard!', 'info');
      });
    });
  }

  // Re-verify listener
  if (btnRunVerify) {
    btnRunVerify.addEventListener('click', runVerification);
  }

  // Initial verification on load
  runVerification();
});
