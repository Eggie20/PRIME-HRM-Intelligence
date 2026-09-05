/**
 * NBSC PRIME-HRM Intelligence Hub — Universal Docket Filter
 * Multi-attribute candidate disambiguation and real-time filtering across all 5 hiring pipeline stages.
 * Disambiguates applicants by: Full Name, Unique Tracking ID, Filing Date, and Target Vacancy.
 */

(function(window) {
  'use strict';

  function formatDate(isoStr) {
    if (!isoStr) return 'Pending Date';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return isoStr;
    }
  }

  function formatCandidateLabel(app, vacancyMap) {
    const name = app.applicant_name || app.personal_info?.full_name || 'Candidate';
    const track = app.tracking_number || app.id || 'NBSC-APP-2026';
    const filed = formatDate(app.created_at);
    const vac = vacancyMap[app.vacancy_id];
    const pos = vac ? (vac.title || vac.position_title) : 'General Plantilla';
    const stage = (typeof STAGE_LABELS !== 'undefined' && STAGE_LABELS[app.stage]) ? STAGE_LABELS[app.stage] : app.stage;
    return `${name} • [${track}] • Filed: ${filed} • ${pos} (${stage})`;
  }

  function initDocketFilter(config) {
    const {
      activeAppId,
      onSelect,
      applications = (typeof db !== 'undefined' ? db.getTable('applications') : []) || [],
      vacancies = (typeof db !== 'undefined' ? db.getTable('vacancies') : []) || []
    } = config;

    const inputSearch = document.getElementById('input-docket-search');
    const selectVacancy = document.getElementById('select-docket-vacancy');
    const selectStage = document.getElementById('select-docket-stage');
    const selectCandidate = document.getElementById('select-docket-candidate');
    const countIndicator = document.getElementById('docket-count-indicator');
    const chipsContainer = document.getElementById('candidate-chips-container');

    // Build vacancy lookup map
    const vacancyMap = {};
    vacancies.forEach(v => {
      vacancyMap[v.id] = v;
    });

    // Populate Vacancy Dropdown
    if (selectVacancy) {
      const currentVal = selectVacancy.value;
      selectVacancy.innerHTML = '<option value="">All Positions / Vacancies</option>';
      vacancies.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        const dept = v.department_code || v.department || 'NBSC';
        opt.textContent = `${v.title || v.position_title} (${dept})`;
        if (v.id === currentVal) opt.selected = true;
        selectVacancy.appendChild(opt);
      });
    }

    let currentAppId = activeAppId;

    function applyFilterAndRender() {
      const searchQuery = (inputSearch ? inputSearch.value.trim().toLowerCase() : '');
      const selectedVac = selectVacancy ? selectVacancy.value : '';
      const selectedStg = selectStage ? selectStage.value : '';

      const filtered = applications.filter(app => {
        // Vacancy filter
        if (selectedVac && app.vacancy_id !== selectedVac) return false;

        // Stage filter
        if (selectedStg && app.stage !== selectedStg) return false;

        // Search text matching: Name, Tracking ID, Filed Date, Position, Email
        if (searchQuery) {
          const name = (app.applicant_name || app.personal_info?.full_name || '').toLowerCase();
          const track = (app.tracking_number || app.id || '').toLowerCase();
          const email = (app.personal_info?.email || '').toLowerCase();
          const filed = formatDate(app.created_at).toLowerCase();
          const vac = vacancyMap[app.vacancy_id];
          const pos = vac ? (vac.title || '').toLowerCase() : '';

          const matches = name.includes(searchQuery) ||
                          track.includes(searchQuery) ||
                          email.includes(searchQuery) ||
                          filed.includes(searchQuery) ||
                          pos.includes(searchQuery);
          if (!matches) return false;
        }

        return true;
      });

      // Update Count Indicator
      if (countIndicator) {
        countIndicator.textContent = `Showing ${filtered.length} of ${applications.length}`;
      }

      // Update Candidate Dropdown
      if (selectCandidate) {
        selectCandidate.innerHTML = '';
        if (filtered.length === 0) {
          const emptyOpt = document.createElement('option');
          emptyOpt.value = '';
          emptyOpt.textContent = 'No matching applicants found';
          selectCandidate.appendChild(emptyOpt);
        } else {
          filtered.forEach(app => {
            const opt = document.createElement('option');
            opt.value = app.id;
            opt.textContent = formatCandidateLabel(app, vacancyMap);
            if (app.id === currentAppId) opt.selected = true;
            selectCandidate.appendChild(opt);
          });
        }
      }

      // Update Quick Chips
      if (chipsContainer) {
        chipsContainer.innerHTML = '';
        filtered.slice(0, 5).forEach(app => {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = `candidate-chip ${app.id === currentAppId ? 'candidate-chip--active' : ''}`;
          const name = app.applicant_name || app.personal_info?.full_name || 'Candidate';
          const initials = name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
          const trackNum = app.tracking_number ? app.tracking_number.split('-').pop() : app.id;
          const filed = formatDate(app.created_at);
          const vac = vacancyMap[app.vacancy_id];
          const pos = vac ? (vac.title || vac.position_title) : 'Plantilla';

          chip.title = `${name}\nTracking: ${app.tracking_number || app.id}\nFiled: ${filed}\nPosition: ${pos}`;
          chip.innerHTML = `
            <span class="candidate-chip__avatar">${initials}</span>
            <span>${typeof escapeHtml === 'function' ? escapeHtml(name) : name}</span>
            <span class="candidate-chip__id">#${trackNum}</span>
          `;

          chip.addEventListener('click', () => {
            currentAppId = app.id;
            if (onSelect) onSelect(app.id);
            applyFilterAndRender();
          });

          chipsContainer.appendChild(chip);
        });
      }

      return filtered;
    }

    // Event Listeners
    if (inputSearch) {
      inputSearch.addEventListener('input', () => {
        applyFilterAndRender();
      });
    }

    if (selectVacancy) {
      selectVacancy.addEventListener('change', () => {
        const filtered = applyFilterAndRender();
        if (filtered.length > 0 && !filtered.some(a => a.id === currentAppId)) {
          currentAppId = filtered[0].id;
          if (onSelect) onSelect(currentAppId);
          applyFilterAndRender();
        }
      });
    }

    if (selectStage) {
      selectStage.addEventListener('change', () => {
        const filtered = applyFilterAndRender();
        if (filtered.length > 0 && !filtered.some(a => a.id === currentAppId)) {
          currentAppId = filtered[0].id;
          if (onSelect) onSelect(currentAppId);
          applyFilterAndRender();
        }
      });
    }

    if (selectCandidate) {
      selectCandidate.addEventListener('change', () => {
        if (selectCandidate.value) {
          currentAppId = selectCandidate.value;
          if (onSelect) onSelect(currentAppId);
          applyFilterAndRender();
        }
      });
    }

    // Initial render
    applyFilterAndRender();

    return {
      setActiveCandidate: function(appId) {
        currentAppId = appId;
        applyFilterAndRender();
      },
      refresh: function() {
        applyFilterAndRender();
      }
    };
  }

  window.initDocketFilter = initDocketFilter;
})(window);
