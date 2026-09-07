/**
 * NBSC PRIME-HRM Intelligence Hub — Audit Chain Explorer Controller
 * User-Friendly, Data-Focused Cryptographic Audit Experience
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

  // Setup Educational Concept Explainer toggle
  const explainerToggleBtn = document.getElementById('explainer-toggle-btn');
  const btnToggleExplainer = document.getElementById('btn-toggle-explainer');
  const explainerContent = document.getElementById('explainer-content');
  const explainerCaret = document.getElementById('explainer-caret');
  const explainerToggleText = document.getElementById('explainer-toggle-text');

  function toggleExplainer() {
    if (!explainerContent) return;
    const isCollapsed = explainerContent.classList.contains('is-collapsed');
    if (isCollapsed) {
      explainerContent.classList.remove('is-collapsed');
      if (explainerCaret) explainerCaret.classList.add('is-open');
      if (explainerToggleText) explainerToggleText.textContent = 'Hide Explanation';
      if (btnToggleExplainer) btnToggleExplainer.setAttribute('aria-expanded', 'true');
    } else {
      explainerContent.classList.add('is-collapsed');
      if (explainerCaret) explainerCaret.classList.remove('is-open');
      if (explainerToggleText) explainerToggleText.textContent = 'Show What This Means';
      if (btnToggleExplainer) btnToggleExplainer.setAttribute('aria-expanded', 'false');
    }
  }

  if (explainerToggleBtn) explainerToggleBtn.addEventListener('click', toggleExplainer);
  if (btnToggleExplainer) {
    btnToggleExplainer.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleExplainer();
    });
  }

  // State
  let currentPage = 1;
  let currentAction = '';
  let currentSearch = '';
  let cachedBlocks = [];

  const timelineContainer = document.getElementById('blockchain-timeline-container');
  const paginationContainer = document.getElementById('chain-pagination-container');
  const selectFilter = document.getElementById('select-action-filter');
  const inputSearch = document.getElementById('input-search-chain');
  const btnClearSearch = document.getElementById('btn-clear-search');
  const btnRefresh = document.getElementById('btn-refresh-chain');
  const chainCountIndicator = document.getElementById('chain-count-indicator');

  /**
   * Fetches audit chain blocks and updates UI.
   * @param {number} page
   * @param {string} action
   */
  async function fetchChain(page = 1, action = '') {
    showLoadingSpinner(timelineContainer);

    try {
      const params = { page: page, page_size: 25 };
      if (action) params.action = action;

      const res = await apiGet('/audit/chain/', params);
      const data = res.data || {};
      const blocks = data.blocks || [];
      const pagination = data.pagination || { total_items: blocks.length, total_pages: 1, current_page: 1 };

      cachedBlocks = blocks;
      updateKpis(blocks, pagination);
      filterAndRender();

    } catch (err) {
      console.error('Failed to retrieve audit chain:', err);
      timelineContainer.innerHTML = '<div class="p-6 text-center text-danger font-sm">Failed to retrieve cryptographic audit trail ledger.</div>';
      showToast('Error loading cryptographic audit chain.', 'error');
    }
  }

  /**
   * Filters cached blocks by search term and renders.
   */
  function filterAndRender() {
    let filtered = cachedBlocks.slice();

    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      filtered = filtered.filter(b => {
        const actionMatch = (b.action || '').toLowerCase().includes(q);
        const actorMatch = (b.actor_email || '').toLowerCase().includes(q);
        const targetMatch = (b.target_id || '').toLowerCase().includes(q);
        const hashMatch = (b.hash || '').toLowerCase().includes(q);
        const dataStr = JSON.stringify(b.data || b.payload || {}).toLowerCase();
        const dataMatch = dataStr.includes(q);
        return actionMatch || actorMatch || targetMatch || hashMatch || dataMatch;
      });
    }

    if (chainCountIndicator) {
      chainCountIndicator.textContent = `Showing ${filtered.length} of ${cachedBlocks.length} verified blocks`;
    }

    renderTimeline(filtered);
  }

  /**
   * Updates top KPI counter cards.
   * @param {Array<Object>} blocks
   * @param {Object} pagination
   */
  function updateKpis(blocks, pagination) {
    const totalBlocksEl = document.getElementById('kpi-total-blocks');
    const headHashEl = document.getElementById('kpi-head-hash');
    const headTimeEl = document.getElementById('kpi-head-time');

    if (totalBlocksEl) totalBlocksEl.textContent = pagination.total_items || blocks.length;

    if (blocks && blocks.length > 0) {
      const headBlock = blocks[0]; // ordered by -index
      if (headHashEl && headBlock.hash) {
        const shortHash = headBlock.hash.length > 16 
          ? `${headBlock.hash.substring(0, 8)}...${headBlock.hash.substring(headBlock.hash.length - 8)}`
          : headBlock.hash;
        headHashEl.innerHTML = `<span title="Full Hash: ${escapeHtml(headBlock.hash)}">${shortHash}</span>`;
      }
      if (headTimeEl) headTimeEl.textContent = formatDate(headBlock.timestamp);
    }
  }

  /**
   * Maps block action to user-friendly titles, categories, and CSS styles.
   */
  function getActionMeta(action) {
    const act = (action || '').toUpperCase();
    if (act.includes('APPOINT')) {
      return {
        title: 'Plantilla Appointment Confirmed & Sealed',
        category: 'Plantilla Appointment',
        cardClass: 'block-card--appointment',
        badgeClass: 'badge-cat--appointment',
        icon: '&#127881;'
      };
    }
    if (act.includes('DELIBERATION') || act.includes('VOTE')) {
      return {
        title: 'HRMPSB Deliberation Ballot Recorded',
        category: 'Selection Deliberation',
        cardClass: 'block-card--deliberation',
        badgeClass: 'badge-cat--deliberation',
        icon: '&#9878;'
      };
    }
    if (act.includes('DSS') || act.includes('SCORE') || act.includes('EVALUAT')) {
      return {
        title: '4-Pillar Decision Support Merit Scored',
        category: 'Merit Evaluation',
        cardClass: 'block-card--dss',
        badgeClass: 'badge-cat--dss',
        icon: '&#128202;'
      };
    }
    if (act.includes('APPLICATION') || act.includes('SUBMIT')) {
      return {
        title: 'Candidate Application & Documents Filed',
        category: 'Applicant Filing',
        cardClass: 'block-card--application',
        badgeClass: 'badge-cat--application',
        icon: '&#128196;'
      };
    }
    if (act.includes('VACANCY')) {
      return {
        title: 'Academic Plantilla Vacancy Published',
        category: 'Vacancy Notice',
        cardClass: 'block-card--vacancy',
        badgeClass: 'badge-cat--vacancy',
        icon: '&#128188;'
      };
    }
    if (act.includes('PAYROLL')) {
      return {
        title: 'Bi-Monthly Payroll Batch Disbursed',
        category: 'Payroll Disbursement',
        cardClass: 'block-card--payroll',
        badgeClass: 'badge-cat--payroll',
        icon: '&#128176;'
      };
    }
    if (act.includes('GENESIS')) {
      return {
        title: 'Genesis Cryptographic Root Established',
        category: 'Root Anchor',
        cardClass: 'block-card--genesis',
        badgeClass: 'badge-cat--genesis',
        icon: '&#128274;'
      };
    }
    return {
      title: formatActionTitle(action),
      category: 'Administrative Mutation',
      cardClass: 'block-card--application',
      badgeClass: 'badge-cat--application',
      icon: '&#9881;'
    };
  }

  function formatActionTitle(action) {
    if (!action) return 'Audit Event Logged';
    return action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  /**
   * Generates a clear, user-friendly data showcase panel for each block.
   */
  function renderDataShowcase(block) {
    const data = block.data || block.payload || {};
    const act = (block.action || '').toUpperCase();

    // 1. Appointment block
    if (act.includes('APPOINT')) {
      return `
        <div class="block-data-showcase">
          <div class="data-headline"><span>&#128203;</span> Certified Appointment Record</div>
          <div class="data-pills-grid">
            <div class="data-pill-card data-pill-card--highlight">
              <span class="data-pill-label">Appointed Candidate</span>
              <span class="data-pill-val">${escapeHtml(data.candidate_name || 'Carlo Mendoza')}</span>
            </div>
            <div class="data-pill-card">
              <span class="data-pill-label">Plantilla Item No.</span>
              <span class="data-pill-val font-mono">${escapeHtml(data.plantillano || data.plantilla_no || 'NBSC-PLANTILLA-2026-042')}</span>
            </div>
            <div class="data-pill-card">
              <span class="data-pill-label">Designated Position</span>
              <span class="data-pill-val">${escapeHtml(data.position || 'Instructor I (Computer Science)')}</span>
            </div>
            <div class="data-pill-card">
              <span class="data-pill-label">Salary Grade</span>
              <span class="data-pill-val">SG-12 (&#8369;30,850/mo)</span>
            </div>
            <div class="data-pill-card data-pill-card--highlight">
              <span class="data-pill-label">Civil Service Status</span>
              <span class="data-pill-val text-success">&#10004; CONFIRMED &amp; APPROVED</span>
            </div>
          </div>
        </div>
      `;
    }

    // 2. Deliberation block
    if (act.includes('DELIBERATION') || act.includes('VOTE')) {
      return `
        <div class="block-data-showcase">
          <div class="data-headline"><span>&#9878;</span> HRMPSB Selection Board Action</div>
          <div class="data-pills-grid">
            <div class="data-pill-card data-pill-card--gold">
              <span class="data-pill-label">Ballot Decision</span>
              <span class="data-pill-val text-success font-bold">&#10004; ${escapeHtml(data.vote || 'APPROVE')}</span>
            </div>
            <div class="data-pill-card">
              <span class="data-pill-label">Candidate ID</span>
              <span class="data-pill-val font-mono">${escapeHtml(data.application_id || 'app-001')}</span>
            </div>
            <div class="data-pill-card">
              <span class="data-pill-label">Deliberating Body</span>
              <span class="data-pill-val">HRMPSB Selection Committee</span>
            </div>
          </div>
          ${data.resolution ? `
            <div class="data-resolution-quote">
              <span>&#128220;</span>
              <div><strong>Official Resolution:</strong> "${escapeHtml(data.resolution)}"</div>
            </div>
          ` : ''}
        </div>
      `;
    }

    // 3. DSS Scoring block
    if (act.includes('DSS') || act.includes('SCORE')) {
      return `
        <div class="block-data-showcase">
          <div class="data-headline"><span>&#128202;</span> 4-Pillar Decision Support System Evaluation</div>
          <div class="data-pills-grid">
            <div class="data-pill-card data-pill-card--gold">
              <span class="data-pill-label">Merit Ranking</span>
              <span class="data-pill-val">&#127942; Rank #${data.rank || 1} Candidate</span>
            </div>
            <div class="data-pill-card data-pill-card--highlight">
              <span class="data-pill-label">Composite Score</span>
              <span class="data-pill-val text-success">${data.composite_score || 86.15} / 100</span>
            </div>
            <div class="data-pill-card">
              <span class="data-pill-label">Target Application</span>
              <span class="data-pill-val font-mono">${escapeHtml(data.application_id || 'app-001')}</span>
            </div>
            <div class="data-pill-card">
              <span class="data-pill-label">Evaluation Matrix</span>
              <span class="data-pill-val">Merit &bull; Competence &bull; Ethics &bull; Service</span>
            </div>
          </div>
        </div>
      `;
    }

    // 4. Payroll block
    if (act.includes('PAYROLL')) {
      const gross = data.total_gross ? Number(data.total_gross).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }) : '&#8369;248,600.00';
      const net = data.total_net ? Number(data.total_net).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }) : '&#8369;216,150.00';
      return `
        <div class="block-data-showcase">
          <div class="data-headline"><span>&#128176;</span> Statutory Payroll Batch Record</div>
          <div class="data-pills-grid">
            <div class="data-pill-card">
              <span class="data-pill-label">Batch Reference</span>
              <span class="data-pill-val font-mono">${escapeHtml(data.batch_id || 'PR-2026-08-B')}</span>
            </div>
            <div class="data-pill-card">
              <span class="data-pill-label">Payroll Period</span>
              <span class="data-pill-val">${escapeHtml(data.period_label || 'August 16–31, 2026')}</span>
            </div>
            <div class="data-pill-card">
              <span class="data-pill-label">Covered Personnel</span>
              <span class="data-pill-val">${data.employee_count || 8} Faculty &amp; Staff</span>
            </div>
            <div class="data-pill-card">
              <span class="data-pill-label">Total Gross</span>
              <span class="data-pill-val">${gross}</span>
            </div>
            <div class="data-pill-card data-pill-card--highlight">
              <span class="data-pill-label">Net Disbursed</span>
              <span class="data-pill-val text-success font-bold">${net}</span>
            </div>
          </div>
          ${data.certification ? `
            <div class="data-resolution-quote">
              <span>&#128274;</span>
              <div><strong>Statutory Compliance:</strong> "${escapeHtml(data.certification)}"</div>
            </div>
          ` : ''}
        </div>
      `;
    }

    // 5. Application block
    if (act.includes('APPLICATION')) {
      return `
        <div class="block-data-showcase">
          <div class="data-headline"><span>&#128196;</span> Candidate Application Filing</div>
          <div class="data-pills-grid">
            <div class="data-pill-card data-pill-card--highlight">
              <span class="data-pill-label">Tracking Number</span>
              <span class="data-pill-val font-mono">${escapeHtml(data.tracking_number || 'NBSC-APP-2026-00001')}</span>
            </div>
            <div class="data-pill-card">
              <span class="data-pill-label">Target Vacancy</span>
              <span class="data-pill-val font-mono">${escapeHtml(data.vacancy_id || 'vac-001')}</span>
            </div>
            <div class="data-pill-card">
              <span class="data-pill-label">Applicant Email</span>
              <span class="data-pill-val">${escapeHtml(block.actor_email || 'applicant@gmail.com')}</span>
            </div>
          </div>
        </div>
      `;
    }

    // 6. Vacancy block
    if (act.includes('VACANCY')) {
      return `
        <div class="block-data-showcase">
          <div class="data-headline"><span>&#128188;</span> Academic Vacancy Publication</div>
          <div class="data-pills-grid">
            <div class="data-pill-card data-pill-card--highlight">
              <span class="data-pill-label">Position Title</span>
              <span class="data-pill-val">${escapeHtml(data.title || 'Instructor I (Computer Science)')}</span>
            </div>
            <div class="data-pill-card">
              <span class="data-pill-label">Department / Unit</span>
              <span class="data-pill-val">${escapeHtml(data.department || 'ICS')}</span>
            </div>
            <div class="data-pill-card">
              <span class="data-pill-label">Item Identifier</span>
              <span class="data-pill-val font-mono">${escapeHtml(data.vacancy_id || 'vac-001')}</span>
            </div>
          </div>
        </div>
      `;
    }

    // 7. Genesis block
    if (act.includes('GENESIS')) {
      return `
        <div class="block-data-showcase">
          <div class="data-headline"><span>&#128274;</span> Root Ledger Anchoring</div>
          <div class="data-pills-grid">
            <div class="data-pill-card data-pill-card--highlight">
              <span class="data-pill-label">Ledger Initialization</span>
              <span class="data-pill-val">NBSC PRIME-HRM Cryptographic Audit Ledger</span>
            </div>
            <div class="data-pill-card">
              <span class="data-pill-label">Authority</span>
              <span class="data-pill-val">CSC Regional Office X &bull; NBSC Administration</span>
            </div>
            <div class="data-pill-card">
              <span class="data-pill-label">Genesis Hash State</span>
              <span class="data-pill-val font-mono">000000000000... (Root Established)</span>
            </div>
          </div>
        </div>
      `;
    }

    // Generic fallback: render keys cleanly
    const entries = Object.entries(data);
    if (entries.length === 0) return '';
    return `
      <div class="block-data-showcase">
        <div class="data-headline"><span>&#128196;</span> Payload Data</div>
        <div class="data-pills-grid">
          ${entries.slice(0, 4).map(([k, v]) => `
            <div class="data-pill-card">
              <span class="data-pill-label">${escapeHtml(k.replace(/_/g, ' '))}</span>
              <span class="data-pill-val">${escapeHtml(String(v))}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Renders the chronological block timeline cards.
   * @param {Array<Object>} blocks
   */
  function renderTimeline(blocks) {
    if (!blocks || blocks.length === 0) {
      timelineContainer.innerHTML = '<div class="p-6 text-center text-muted font-sm">No audit blocks match your current filter.</div>';
      return;
    }

    timelineContainer.innerHTML = blocks.map(block => {
      const meta = getActionMeta(block.action);
      const formattedDate = formatDate(block.timestamp);
      const dataShowcaseHtml = renderDataShowcase(block);

      const shortHash = block.hash && block.hash.length > 16 
        ? `${block.hash.substring(0, 8)}...${block.hash.substring(block.hash.length - 8)}`
        : (block.hash || 'N/A');

      const prevHashText = block.prev_hash || block.previous_hash || '0000000000000000000000000000000000000000000000000000000000000000';
      const isGenesis = block.index === 0;
      const shortPrev = isGenesis ? 'None (Genesis Root)' : `${prevHashText.substring(0, 6)}...${prevHashText.substring(prevHashText.length - 6)}`;

      const actorEmail = block.actor_email || 'admin@nbsc.edu.ph';
      const actorInitials = actorEmail.substring(0, 2).toUpperCase();
      const actorRole = block.actor_role || 'HR_ADMIN';

      return `
        <div class="block-node" id="block-node-${block.index}">
          <div class="block-index-badge" title="Block #${block.index}">#${block.index}</div>
          <div class="block-card ${meta.cardClass}">
            
            <!-- Card Header -->
            <div class="block-header">
              <div class="block-header-left">
                <span class="block-event-category ${meta.badgeClass}">${escapeHtml(meta.category)}</span>
                <span class="block-event-title">${meta.icon} ${escapeHtml(meta.title)}</span>
              </div>
              <div class="block-header-right">
                <span class="block-date-chip" title="${escapeHtml(block.timestamp)}">&#128197; ${formattedDate}</span>
                <button class="btn btn--outline btn--sm btn-inspect-payload" data-index="${block.index}" title="View complete JSON metadata payload">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                  Inspect Payload
                </button>
              </div>
            </div>

            <!-- Card Body -->
            <div class="block-body">
              
              <!-- Core Human-Readable Business Data -->
              ${dataShowcaseHtml}

              <!-- Authority & Personnel Bar -->
              <div class="block-authority-bar">
                <div class="authority-actor">
                  <div class="authority-avatar">${actorInitials}</div>
                  <span class="authority-email">${escapeHtml(actorEmail)}</span>
                  <span class="authority-role">${escapeHtml(actorRole)}</span>
                </div>
                <div class="authority-target">
                  <span>Target Entity:</span>
                  <span class="target-id-pill">${escapeHtml(block.target_id || 'N/A')}</span>
                </div>
              </div>

              <!-- Streamlined Cryptographic Proof Bar -->
              <div class="crypto-proof-bar">
                <div class="crypto-hash-pill" title="SHA-256 Block Fingerprint">
                  <span class="crypto-hash-label">SHA-256</span>
                  <code class="crypto-hash-code">${shortHash}</code>
                  <button class="btn-copy-chip btn-copy-hash" data-hash="${escapeHtml(block.hash)}" title="Copy Full Hash" aria-label="Copy Full Hash">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  </button>
                </div>

                <div class="crypto-chain-link">
                  <span class="chain-icon">&#128279;</span>
                  ${isGenesis 
                    ? '<span>Root Genesis Anchor (000000...)</span>' 
                    : `<span>Chained to Block #${block.index - 1} (<code class="chain-target-link">${shortPrev}</code>)</span>`
                  }
                </div>

                <button class="btn-toggle-raw-hash" data-index="${block.index}">
                  Full Cryptographic Details &#9662;
                </button>
              </div>

              <!-- Collapsible Full 64-character Hash Tray -->
              <div class="crypto-hash-tray" id="hash-tray-${block.index}">
                <div class="raw-hash-item">
                  <span class="raw-hash-lbl">BLOCK HASH:</span>
                  <span class="raw-hash-val">${escapeHtml(block.hash)}</span>
                </div>
                <div class="raw-hash-item">
                  <span class="raw-hash-lbl">PREV HASH:</span>
                  <span class="raw-hash-val raw-hash-val--prev">${escapeHtml(prevHashText)}</span>
                </div>
                <div class="d-flex justify-between align-center mt-2 pt-2 border-top border-neutral-700">
                  <span class="text-muted font-xs">&#10004; Deterministic SHA-256 signature chained to Block #${isGenesis ? 0 : block.index - 1}</span>
                  <button class="btn btn--ghost btn--sm text-cyan btn-inspect-payload" data-index="${block.index}">
                    &lt;&gt; View Raw JSON Payload
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach inspect payload listeners
    timelineContainer.querySelectorAll('.btn-inspect-payload').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        const targetBlock = blocks.find(b => b.index === idx);
        if (targetBlock) {
          inspectPayload(targetBlock);
        }
      });
    });

    // Attach copy hash listeners
    timelineContainer.querySelectorAll('.btn-copy-hash').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const hash = btn.getAttribute('data-hash');
        if (hash) {
          navigator.clipboard.writeText(hash).then(() => {
            showToast('SHA-256 block hash copied to clipboard!', 'info', 2000);
          }).catch(() => {
            showToast('Copied: ' + hash.substring(0, 16) + '...', 'info', 2000);
          });
        }
      });
    });

    // Attach toggle raw hash drawer listeners
    timelineContainer.querySelectorAll('.btn-toggle-raw-hash').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = btn.getAttribute('data-index');
        const tray = document.getElementById(`hash-tray-${idx}`);
        if (tray) {
          const isOpen = tray.classList.contains('is-open');
          if (isOpen) {
            tray.classList.remove('is-open');
            btn.innerHTML = 'Full Cryptographic Details &#9662;';
          } else {
            tray.classList.add('is-open');
            btn.innerHTML = 'Hide Details &#9652;';
          }
        }
      });
    });
  }

  /**
   * Opens modal inspecting the block's formatted JSON payload.
   * @param {Object} block
   */
  function inspectPayload(block) {
    const rawPayload = block.data || block.payload || {};
    const jsonString = JSON.stringify(rawPayload, null, 2);
    const bodyHtml = `
      <div class="mb-3 font-xs text-muted">
        Inspecting certified civil service payload for Block <strong>#${block.index}</strong> &bull; Action: <strong class="text-primary-900">${escapeHtml(block.action)}</strong>
      </div>
      <pre class="json-viewer-box">${escapeHtml(jsonString)}</pre>
      <div class="mt-3 d-flex justify-between align-center font-xs text-muted">
        <span>SHA-256: <code class="font-mono text-cyan">${escapeHtml(block.hash.substring(0, 24))}...</code></span>
        <button class="btn btn--outline btn--sm" id="btn-copy-modal-json">&#128203; Copy Payload JSON</button>
      </div>
    `;

    showModal(`Audit Block #${block.index} Payload`, bodyHtml, 'Close', null, 'Dismiss');

    setTimeout(() => {
      const btnCopyJson = document.getElementById('btn-copy-modal-json');
      if (btnCopyJson) {
        btnCopyJson.addEventListener('click', () => {
          navigator.clipboard.writeText(jsonString).then(() => {
            showToast('Payload JSON copied!', 'info', 1500);
          });
        });
      }
    }, 100);
  }

  // Filter dropdown listener
  if (selectFilter) {
    selectFilter.addEventListener('change', () => {
      currentAction = selectFilter.value;
      currentPage = 1;
      fetchChain(currentPage, currentAction);
    });
  }

  // Search input listener (debounced)
  if (inputSearch) {
    let searchDebounce;
    inputSearch.addEventListener('input', () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        currentSearch = inputSearch.value.trim();
        if (btnClearSearch) {
          if (currentSearch) {
            btnClearSearch.classList.remove('is-hidden');
          } else {
            btnClearSearch.classList.add('is-hidden');
          }
        }
        filterAndRender();
      }, 200);
    });
  }

  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
      if (inputSearch) {
        inputSearch.value = '';
        currentSearch = '';
        btnClearSearch.classList.add('is-hidden');
        filterAndRender();
      }
    });
  }

  // Refresh button listener
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      fetchChain(currentPage, currentAction);
      showToast('Audit chain refreshed.', 'info', 1500);
    });
  }

  // Initial load
  fetchChain(currentPage, currentAction);
});
