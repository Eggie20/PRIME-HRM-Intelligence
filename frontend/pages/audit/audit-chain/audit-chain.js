/**
 * NBSC PRIME-HRM Intelligence Hub — Audit Chain Explorer Controller
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

  let currentPage = 1;
  let currentAction = '';

  const timelineContainer = document.getElementById('blockchain-timeline-container');
  const paginationContainer = document.getElementById('chain-pagination-container');
  const selectFilter = document.getElementById('select-action-filter');
  const btnRefresh = document.getElementById('btn-refresh-chain');

  /**
   * Fetches audit chain blocks and renders timeline.
   * @param {number} page
   * @param {string} action
   */
  async function fetchChain(page = 1, action = '') {
    showLoadingSpinner(timelineContainer);

    try {
      const params = { page: page, page_size: 15 };
      if (action) params.action = action;

      const res = await apiGet('/audit/chain/', params);
      const data = res.data || {};
      const blocks = data.blocks || [];
      const pagination = data.pagination || { total_items: blocks.length, total_pages: 1, current_page: 1 };

      updateKpis(blocks, pagination);
      renderTimeline(blocks);
      renderPagination(paginationContainer, pagination.current_page, pagination.total_pages, (newPage) => {
        currentPage = newPage;
        fetchChain(currentPage, currentAction);
      });

    } catch (err) {
      console.error('Failed to retrieve audit chain:', err);
      timelineContainer.innerHTML = '<div class="p-6 text-center text-danger font-sm">Failed to retrieve audit trail ledger.</div>';
      showToast('Error loading cryptographic audit chain.', 'error');
    }
  }

  /**
   * Updates top KPI counter boxes.
   * @param {Array<Object>} blocks
   * @param {Object} pagination
   */
  function updateKpis(blocks, pagination) {
    const totalBlocksEl = document.getElementById('kpi-total-blocks');
    const genesisHashEl = document.getElementById('kpi-genesis-hash');
    const headHashEl = document.getElementById('kpi-head-hash');
    const headTimeEl = document.getElementById('kpi-head-time');

    if (totalBlocksEl) totalBlocksEl.textContent = pagination.total_items || blocks.length;

    if (blocks && blocks.length > 0) {
      const headBlock = blocks[0]; // blocks are ordered by -index
      if (headHashEl && headBlock.hash) {
        const shortHash = headBlock.hash.length > 18 
          ? `${headBlock.hash.substring(0, 8)}...${headBlock.hash.substring(headBlock.hash.length - 8)}`
          : headBlock.hash;
        headHashEl.innerHTML = `<span title="${escapeHtml(headBlock.hash)}">${shortHash}</span>`;
      }
      if (headTimeEl) headTimeEl.textContent = formatDate(headBlock.timestamp);

      const genesisBlock = blocks[blocks.length - 1];
      if (genesisHashEl && genesisBlock.index === 0 && genesisBlock.hash) {
        const shortGen = genesisBlock.hash.length > 18
          ? `${genesisBlock.hash.substring(0, 8)}...${genesisBlock.hash.substring(genesisBlock.hash.length - 8)}`
          : genesisBlock.hash;
        genesisHashEl.innerHTML = `<span title="${escapeHtml(genesisBlock.hash)}">${shortGen}</span>`;
      }
    }
  }

  /**
   * Renders the chronological block timeline cards.
   * @param {Array<Object>} blocks
   */
  function renderTimeline(blocks) {
    if (!blocks || blocks.length === 0) {
      timelineContainer.innerHTML = '<div class="p-6 text-center text-muted font-sm">No audit blocks found matching criteria.</div>';
      return;
    }

    timelineContainer.innerHTML = blocks.map(block => {
      const actionBadgeClass = getActionBadgeClass(block.action);
      const formattedDate = formatDate(block.timestamp);

      return `
        <div class="block-node" id="block-node-${block.index}">
          <div class="block-index-badge">#${block.index}</div>
          <div class="block-card">
            <div class="block-header">
              <div class="d-flex align-center gap-2">
                <span class="badge ${actionBadgeClass}">${escapeHtml(block.action)}</span>
                <span class="font-xs text-muted">${formattedDate}</span>
              </div>
              <button class="btn btn--outline btn--sm btn-inspect-payload" data-index="${block.index}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                Inspect Payload
              </button>
            </div>

            <div class="block-body">
              <div class="hash-row">
                <span class="hash-label">Block Hash</span>
                <span class="hash-value">${escapeHtml(block.hash)}</span>
                <button class="btn btn--icon btn--ghost btn--sm btn-copy-hash" data-hash="${escapeHtml(block.hash)}" title="Copy Hash" aria-label="Copy Hash">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
              </div>

              <div class="hash-row">
                <span class="hash-label">Prev Hash</span>
                <span class="hash-value hash-value--prev">${escapeHtml(block.prev_hash || 'None (Genesis Root)')}</span>
              </div>

              <div class="block-meta-grid">
                <div class="meta-field">
                  <span class="meta-field-label">Actor</span>
                  <span class="meta-field-value text-primary-900 font-bold">${escapeHtml(block.actor_email || 'SYSTEM')}</span>
                </div>
                <div class="meta-field">
                  <span class="meta-field-label">Role</span>
                  <span class="meta-field-value"><span class="badge badge--neutral font-xs">${escapeHtml(block.actor_role || 'SYSTEM')}</span></span>
                </div>
                <div class="meta-field">
                  <span class="meta-field-label">Target ID</span>
                  <span class="meta-field-value font-mono font-xs text-accent">${escapeHtml(block.target_id || 'N/A')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach inspect payload button listeners
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
      btn.addEventListener('click', () => {
        const hash = btn.getAttribute('data-hash');
        if (hash) {
          navigator.clipboard.writeText(hash).then(() => {
            showToast('Block hash copied to clipboard!', 'info', 2000);
          });
        }
      });
    });
  }

  /**
   * Maps action strings to badge CSS variants.
   * @param {string} action
   * @returns {string} CSS class
   */
  function getActionBadgeClass(action) {
    if (!action) return 'badge--neutral';
    if (action.includes('APPOINTED')) return 'badge--success';
    if (action.includes('REJECTED')) return 'badge--danger';
    if (action.includes('GENESIS')) return 'badge--primary';
    if (action.includes('EVALUATION') || action.includes('VOTE')) return 'badge--warning';
    return 'badge--info';
  }

  /**
   * Opens modal inspecting the block's JSON payload.
   * @param {Object} block
   */
  function inspectPayload(block) {
    const jsonString = JSON.stringify(block.payload || {}, null, 2);
    const bodyHtml = `
      <div class="mb-3 font-xs text-muted">
        Inspecting metadata for Block <strong>#${block.index}</strong> &bull; Action: <strong>${escapeHtml(block.action)}</strong>
      </div>
      <pre class="json-viewer-box">${escapeHtml(jsonString)}</pre>
    `;

    showModal(`Audit Block #${block.index} Payload`, bodyHtml, 'Close', null, 'Dismiss');
  }

  // Filter change listener
  if (selectFilter) {
    selectFilter.addEventListener('change', () => {
      currentAction = selectFilter.value;
      currentPage = 1;
      fetchChain(currentPage, currentAction);
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
