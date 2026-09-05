/**
 * NBSC PRIME-HRM Intelligence Hub — API Client
 * Centralized fetch client for backend communication with JWT auth injection.
 */

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'nbsc_access_token',
  REFRESH_TOKEN: 'nbsc_refresh_token',
  USER: 'nbsc_user'
};

/**
 * Stores authentication tokens in localStorage.
 * @param {string} accessToken
 * @param {string} [refreshToken]
 */
function setAuthToken(accessToken, refreshToken = null) {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }
}

/**
 * Retrieves the stored JWT access token.
 * @returns {string|null}
 */
function getAuthToken() {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * Clears stored auth tokens and user data.
 */
function clearAuth() {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

/**
 * Authenticates staff or applicant locally via NbscDB (frontend-only mode).
 * Emulates an API login endpoint without requiring a running backend.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ success: boolean, data?: Object, error?: string }>}
 */
async function apiLoginLocal(email, password) {
  if (typeof db !== 'undefined' && db.authenticate) {
    return db.authenticate(email, password);
  }
  throw new Error('NbscDB instance not found. Ensure db.js is loaded.');
}

/**
 * Builds standard request headers with Authorization Bearer token.
 * @param {boolean} isJson - Whether content-type should be application/json
 * @returns {Headers}
 */
function buildHeaders(isJson = true) {
  const headers = new Headers();
  if (isJson) {
    headers.append('Content-Type', 'application/json');
  }
  const token = getAuthToken();
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  return headers;
}

/**
 * Base HTTP request wrapper.
 * @param {string} endpoint - API path (e.g. '/employees/')
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>} Parsed response data
 */
async function request(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Direct fast-path to local store if running offline or via file:// protocol
  if (typeof db !== 'undefined' && (window.location.protocol === 'file:' || window.__NBSC_OFFLINE__)) {
    return handleLocalRequest(cleanEndpoint, options);
  }

  const url = `${API_BASE_URL}${cleanEndpoint}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 800);
    const fetchOptions = { ...options, signal: controller.signal };

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (response.status === 401) {
      clearAuth();
      const currentPath = window.location.pathname;
      if (!currentPath.includes('login') && !currentPath.includes('register')) {
        window.location.href = '/pages/auth/admin-login/admin-login.html';
      }
      throw new Error('Session expired. Please log in again.');
    }

    const contentType = response.headers.get('content-type');
    let data = null;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMsg = data && (data.message || data.error || data.detail)
        ? (data.message || data.error || data.detail)
        : `Request failed with status ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    if (typeof db !== 'undefined') {
      window.__NBSC_OFFLINE__ = true;
      console.info(`[api.js] Backend unreachable. Falling back to local NbscDB for: ${cleanEndpoint}`);
      try {
        return await handleLocalRequest(cleanEndpoint, options);
      } catch (localErr) {
        console.error(`[api.js] Local handler error:`, localErr);
        throw localErr;
      }
    }
    console.error(`API Error [${options.method || 'GET'} ${cleanEndpoint}]:`, error);
    throw error;
  }
}

/**
 * Local fallback handler using NbscDB when backend server is unavailable.
 * @param {string} endpoint - API path with optional query string
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>} Mocked response data structure
 */
async function handleLocalRequest(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const [pathname, queryString] = endpoint.split('?');
  const params = new URLSearchParams(queryString || '');
  const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};

  const path = pathname.replace(/\/+$/, '');

  // 1. Employees endpoint
  if (path === '/employees' || path.startsWith('/employees/')) {
    const segments = path.split('/').filter(Boolean);
    const isDetail = segments.length > 1 && segments[1] !== '';
    const id = isDetail ? segments[1] : null;

    if (method === 'GET' && !isDetail) {
      const page = parseInt(params.get('page') || '1', 10);
      const rawPageSize = params.get('page_size');
      const pageSize = rawPageSize === 'all' ? 99999 : (parseInt(rawPageSize || '10', 10) || 10);
      const search = (params.get('search') || '').toLowerCase().trim();
      const department = (params.get('department') || '').trim();
      const category = (params.get('category') || '').trim();
      const status = (params.get('status') || '').trim();
      const sortBy = params.get('sort_by') || 'employee_id';
      const sortOrder = (params.get('order') || 'asc').toLowerCase();

      let allEmployees = db.getTable('employees');
      if (!allEmployees || allEmployees.length === 0) {
        db.init();
        allEmployees = db.getTable('employees');
      }

      let filtered = allEmployees.filter(e => e.is_active !== false);

      if (search) {
        filtered = filtered.filter(e => {
          const name = (e.full_name || '').toLowerCase();
          const empId = (e.employee_id || e.employee_number || '').toLowerCase();
          const pos = (e.position || e.position_title || '').toLowerCase();
          const email = (e.email || '').toLowerCase();
          return name.includes(search) || empId.includes(search) || pos.includes(search) || email.includes(search);
        });
      }

      if (department) {
        filtered = filtered.filter(e => (e.department || e.department_code) === department);
      }

      if (category) {
        filtered = filtered.filter(e => e.category === category);
      }

      if (status) {
        filtered = filtered.filter(e => (e.employment_status || '') === status);
      }

      // Dynamic sorting
      filtered.sort((a, b) => {
        let valA = a[sortBy] !== undefined ? a[sortBy] : (a.full_name || '');
        let valB = b[sortBy] !== undefined ? b[sortBy] : (b.full_name || '');
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'desc' ? valB - valA : valA - valB;
        }
        return sortOrder === 'desc'
          ? String(valB).localeCompare(String(valA))
          : String(valA).localeCompare(String(valB));
      });

      const totalItems = filtered.length;
      const totalPages = Math.ceil(totalItems / pageSize) || 1;
      const validPage = Math.min(Math.max(1, page), totalPages);
      const startIdx = (validPage - 1) * pageSize;
      const pageRows = filtered.slice(startIdx, startIdx + pageSize).map(e => ({
        id: e.id || e.employee_id,
        employee_id: e.employee_id || e.employee_number || e.id,
        employee_number: e.employee_number || e.employee_id || e.id,
        full_name: e.full_name || 'Staff Member',
        email: e.email || '',
        department: e.department || e.department_code || 'General',
        department_code: e.department_code || e.department || 'General',
        position: e.position || e.position_title || 'Personnel',
        position_title: e.position_title || e.position || 'Personnel',
        category: e.category || 'TEACHING',
        employment_status: e.employment_status || 'PERMANENT',
        salary_grade: e.salary_grade || 12,
        daily_rate: Number(e.daily_rate) || 1400.00,
        phone: e.phone || '',
        is_active: e.is_active !== false
      }));

      return {
        success: true,
        data: {
          employees: pageRows,
          pagination: {
            page: validPage,
            page_size: pageSize,
            total_items: totalItems,
            total_pages: totalPages,
            start_index: totalItems === 0 ? 0 : startIdx + 1,
            end_index: Math.min(startIdx + pageSize, totalItems)
          }
        }
      };
    }

    if (method === 'GET' && isDetail) {
      const emp = db.findOne('employees', e => e.id === id || e.employee_id === id || e.employee_number === id);
      if (!emp) throw new Error(`Employee with ID ${id} not found.`);
      return { success: true, data: emp };
    }

    if (method === 'POST') {
      const newEmp = {
        ...body,
        id: db._generateId('emp'),
        employee_id: body.employee_id || body.employee_number || `NBSC-2026-${Math.floor(1000 + Math.random()*9000)}`,
        employee_number: body.employee_number || body.employee_id || `NBSC-2026-${Math.floor(1000 + Math.random()*9000)}`,
        created_at: new Date().toISOString(),
        is_active: true
      };
      db.insert('employees', newEmp);
      return { success: true, data: newEmp };
    }

    if (method === 'PUT' || method === 'PATCH') {
      const updated = db.update('employees', id, body);
      return { success: true, data: updated };
    }

    if (method === 'DELETE') {
      db.update('employees', id, { is_active: false });
      return { success: true, message: 'Employee deactivated successfully.' };
    }
  }

  // 2. Dashboard KPIs endpoint
  if (path === '/dashboard/kpis' || path.startsWith('/dashboard/kpis')) {
    const allEmps = (db.getTable('employees') || []).filter(e => e.is_active !== false);
    const teachingCount = allEmps.filter(e => e.category === 'TEACHING').length;
    const nonTeachingCount = allEmps.filter(e => e.category === 'NON_TEACHING').length;
    const vacancies = db.getTable('vacancies') || [];
    const openVacancies = vacancies.filter(v => v.status === 'OPEN').length;
    const applications = db.getTable('applications') || [];

    return {
      success: true,
      data: {
        total_employees: allEmps.length,
        teaching_faculty: teachingCount,
        non_teaching_staff: nonTeachingCount,
        active_vacancies: openVacancies,
        applicants_in_pipeline: applications.length,
        prime_hrm_status: {
          overall_score: 94.2,
          maturity_level: 'Level 2 Accredited',
          pillars: {
            rsp: 96.0,
            pm: 92.5,
            ld: 93.8,
            rr: 94.5
          }
        }
      }
    };
  }

  // 3. Vacancies endpoint
  if (path === '/vacancies' || path.startsWith('/vacancies')) {
    const page = parseInt(params.get('page') || '1', 10);
    const rawPageSize = params.get('page_size');
    const pageSize = rawPageSize === 'all' ? 99999 : (parseInt(rawPageSize || '10', 10) || 10);
    const q = (params.get('q') || '').toLowerCase().trim();
    const dept = (params.get('department') || '').trim();
    const cat = (params.get('category') || '').trim();
    const status = (params.get('status') || '').trim();
    const sortBy = params.get('sort_by') || 'title';
    const sortOrder = (params.get('order') || 'asc').toLowerCase();

    let vacs = db.getTable('vacancies') || [];
    if (!vacs || vacs.length === 0) {
      db.init();
      vacs = db.getTable('vacancies') || [];
    }

    if (q) {
      vacs = vacs.filter(v => (v.title || '').toLowerCase().includes(q) || (v.description || '').toLowerCase().includes(q));
    }
    if (dept) {
      vacs = vacs.filter(v => (v.department_code === dept || v.department === dept));
    }
    if (cat) {
      vacs = vacs.filter(v => v.category === cat);
    }
    if (status) {
      vacs = vacs.filter(v => v.status === status);
    }

    // Dynamic sorting
    vacs.sort((a, b) => {
      let valA = a[sortBy] !== undefined ? a[sortBy] : (a.title || '');
      let valB = b[sortBy] !== undefined ? b[sortBy] : (b.title || '');
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      }
      return sortOrder === 'desc'
        ? String(valB).localeCompare(String(valA))
        : String(valA).localeCompare(String(valB));
    });

    const totalItems = vacs.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const validPage = Math.min(Math.max(1, page), totalPages);
    const start = (validPage - 1) * pageSize;
    const pageRows = vacs.slice(start, start + pageSize).map(v => ({
      ...v,
      department: v.department || v.department_code || 'General',
      department_code: v.department_code || v.department || 'General',
      monthly_salary: v.monthly_salary || (v.salary_grade ? v.salary_grade * 2450 : 28000),
      slots: v.slots || 1,
      employment_status: v.employment_status || (v.category === 'TEACHING' ? 'Permanent' : 'COS')
    }));

    return {
      success: true,
      data: {
        vacancies: pageRows,
        pagination: {
          page: validPage,
          page_size: pageSize,
          total_pages: totalPages,
          total_items: totalItems,
          start_index: totalItems === 0 ? 0 : start + 1,
          end_index: Math.min(start + pageSize, totalItems)
        }
      }
    };
  }

  // 4. Programs endpoint
  if (path === '/programs' || path.startsWith('/programs')) {
    let progs = db.getTable('programs') || [];
    if (!progs || progs.length === 0) {
      db.init();
      progs = db.getTable('programs') || [];
    }
    const dept = params.get('department');
    if (dept) {
      progs = progs.filter(p => (p.department_code === dept || p.department === dept));
    }

    const mapped = progs.map(p => ({
      ...p,
      id: p.id || p.code,
      department: p.department || p.department_code || 'General',
      department_code: p.department_code || p.department || 'General',
      description: p.description || `${p.name} under ${p.department_code || 'NBSC'} offering CHED-recognized curriculum.`
    }));

    return {
      success: true,
      data: {
        programs: mapped
      }
    };
  }

  // 4.5. Public Application Tracking endpoint
  if (path.startsWith('/applications/track/')) {
    const segments = path.split('/').filter(Boolean);
    const trackCode = decodeURIComponent(segments[2] || '');
    let apps = db.getTable('applications') || [];
    if (!apps || apps.length === 0) {
      db.init();
      apps = db.getTable('applications') || [];
    }
    const vacs = db.getTable('vacancies') || [];

    // Find application by tracking_number or id
    const app = apps.find(a => 
      (a.tracking_number && a.tracking_number.toLowerCase() === trackCode.toLowerCase()) ||
      a.id.toLowerCase() === trackCode.toLowerCase()
    ) || apps[0]; // fallback to first app for sample/demo

    if (app) {
      const v = vacs.find(vac => vac.id === app.vacancy_id) || {};
      const stage = app.stage || 'DELIBERATION';
      const history = (app.stage_history && app.stage_history.length > 0) ? app.stage_history : [
        { stage: 'APPLIED', timestamp: '2026-08-20T08:30:00+08:00', remarks: 'Application packet received via NBSC Career Portal and tracking docket generated.' },
        { stage: 'SCREENING', timestamp: '2026-08-23T11:15:00+08:00', remarks: 'Human Resource Management Office (HRMO) verified Qualification Standards (QS) and TOR compliance.' },
        { stage: 'DSS_SCORED', timestamp: '2026-08-26T14:00:00+08:00', remarks: 'Automated 4-Pillar Decision Support System completed comparative benchmark scoring.' },
        { stage: 'DEPT_EVAL', timestamp: '2026-08-29T16:45:00+08:00', remarks: 'Department Head / Institute Dean completed teaching demonstration rubric and technical interview.' },
        { stage: 'DELIBERATION', timestamp: '2026-09-02T10:00:00+08:00', remarks: 'HRMPSB Board Members actively conducting comparative deliberation and consensus ranking.' }
      ];

      return {
        success: true,
        data: {
          tracking_number: app.tracking_number || trackCode || 'NBSC-APP-2026-10001',
          vacancy_title: v.title || 'Instructor I (Computer Studies)',
          department: v.department || 'Institute of Computer Studies (ICS)',
          stage: stage,
          created_at: 'August 20, 2026',
          updated_at: 'September 2, 2026',
          stage_history: history
        }
      };
    }
    return { success: false, message: `Application "${trackCode}" not found in recruitment records.` };
  }

  // 5. Applications / Hiring Pipeline endpoints (list & detail)
  if (path === '/applications' || path.startsWith('/applications/')) {
    const segments = path.split('/').filter(Boolean);
    const isDetail = segments.length >= 2 && segments[0] === 'applications';
    const appId = isDetail ? segments[1] : null;

    let apps = db.getTable('applications') || [];
    if (!apps || apps.length === 0) {
      db.init();
      apps = db.getTable('applications') || [];
    }
    const vacs = db.getTable('vacancies') || [];

    // Helper: Normalize single application record
    const normalizeApp = (a) => {
      const v = vacs.find(vac => vac.id === a.vacancy_id) || {};
      const pInfo = a.personal_info || {};
      const edu = a.education || {};
      const name = a.applicant_name || pInfo.full_name || 'Carlo Mendoza';
      const email = a.applicant_email || pInfo.email || 'applicant@nbsc.edu.ph';
      const phone = pInfo.phone || a.phone || '0917-123-4567';
      const address = pInfo.address || a.address || 'Bukidnon, Philippines';
      const degree = edu.degree || pInfo.highest_education || 'BS / MS Degree';
      const school = edu.school || pInfo.school || 'Accredited Higher Education Institution';
      const eligibility = pInfo.eligibility || 'Civil Service Professional / RA 1080';
      const experience = pInfo.years_experience || '3+ Years Documented on PDS Form 212';
      const coverLetter = pInfo.cover_letter || 'Dedicated and passionate public educator committed to NBSC academic excellence and community service.';

      const docs = (a.documents && a.documents.length > 0) ? a.documents.map(d => ({
        file_name: d.name || d.file_name || 'Document.pdf',
        doc_type: d.type || d.doc_type || 'PDF Document',
        file_size: d.size || d.file_size || 280000,
        uploaded_at: d.uploaded_at || '2026-08-25T10:00:00+08:00'
      })) : [
        { file_name: 'PDS_CS_Form_212_Signed.pdf', doc_type: 'Personal Data Sheet', file_size: 345000, uploaded_at: '2026-08-20T14:30:00+08:00' },
        { file_name: 'Official_Transcript_TOR.pdf', doc_type: 'Transcript of Records', file_size: 512000, uploaded_at: '2026-08-20T14:32:00+08:00' },
        { file_name: 'CSC_Eligibility_Certificate.pdf', doc_type: 'Civil Service Certificate', file_size: 185000, uploaded_at: '2026-08-20T14:35:00+08:00' },
        { file_name: 'Teaching_Demo_Rubric_Signed.pdf', doc_type: 'Evaluation Rubric', file_size: 210000, uploaded_at: '2026-08-22T11:00:00+08:00' }
      ];

      return {
        ...a,
        applicant_name: name,
        applicant_email: email,
        vacancy_title: v.title || 'Faculty Candidate',
        vacancy_department: v.department_code || v.department || 'NBSC',
        applicant_profile: {
          full_name: name,
          email: email,
          phone: phone,
          address: address,
          highest_education: degree,
          school: school,
          eligibility: eligibility,
          years_experience: experience,
          cover_letter: coverLetter
        },
        personal_info: {
          full_name: name,
          email: email,
          phone: phone,
          address: address,
          ...pInfo
        },
        documents: docs
      };
    };

    if (isDetail) {
      const app = apps.find(a => a.id === appId) || apps[0];
      if (!app) {
        return { success: false, message: `Application ${appId} not found.` };
      }

      if (method === 'PATCH' || method === 'PUT') {
        const targetStage = body.stage || app.stage;
        app.stage = targetStage;
        if (!app.stage_history) app.stage_history = [];
        app.stage_history.push({
          stage: targetStage,
          timestamp: new Date().toISOString(),
          actor: 'admin@nbsc.edu.ph',
          remarks: body.remarks || 'Stage updated via admin action'
        });
        db.saveTable('applications', apps);
        return {
          success: true,
          message: `Application stage updated to ${targetStage}.`,
          data: { application: normalizeApp(app) }
        };
      }

      return {
        success: true,
        data: {
          application: normalizeApp(app)
        }
      };
    }

    // List endpoint
    const vacancyId = params.get('vacancy_id');
    let filtered = apps;
    if (vacancyId) {
      filtered = filtered.filter(a => a.vacancy_id === vacancyId);
    }
    const mapped = filtered.map(normalizeApp);
    return {
      success: true,
      data: {
        applications: mapped
      }
    };
  }

  // 6. 4-Pillar DSS endpoints (/hiring/:id/dss/)
  if (path.startsWith('/hiring/') && path.includes('/dss')) {
    const parts = path.split('/').filter(Boolean);
    const appId = parts[1] || 'app-001';

    let dssScores = db.getTable('dss_scores') || [];
    let dss = dssScores.find(d => d.application_id === appId);

    if (method === 'POST') {
      const ratings = body.ratings || {};
      const edu = Number(ratings.education_score) || 12;
      const exp = Number(ratings.experience_score) || 8;
      const train = Number(ratings.training_score) || 4;
      const demo = Number(ratings.teaching_demo_score) || 12.5;
      const interview = Number(ratings.behavioral_interview_score) || 13;
      const bi = Number(ratings.background_investigation_score) || 8.5;
      const ref = Number(ratings.character_reference_score) || 9;
      const comm = Number(ratings.community_engagement_score) || 8.5;
      const ded = Number(ratings.public_service_dedication_score) || 9;

      const merit = ((edu + exp + train) / 30) * 100;
      const comp = ((demo + interview) / 30) * 100;
      const ethics = ((bi + ref) / 20) * 100;
      const service = ((comm + ded) / 20) * 100;

      const weighted = (merit * 0.3) + (comp * 0.3) + (ethics * 0.2) + (service * 0.2);

      const newDss = {
        id: `dss-${appId}`,
        application_id: appId,
        total_score: parseFloat(weighted.toFixed(2)),
        qs_compliant: weighted >= 70,
        calculated_at: new Date().toISOString(),
        merit_score: parseFloat(merit.toFixed(1)),
        competence_score: parseFloat(comp.toFixed(1)),
        ethics_score: parseFloat(ethics.toFixed(1)),
        service_score: parseFloat(service.toFixed(1)),
        details: {
          radar_coordinates: [
            parseFloat(merit.toFixed(1)),
            parseFloat(comp.toFixed(1)),
            parseFloat(ethics.toFixed(1)),
            parseFloat(service.toFixed(1))
          ],
          ratings: ratings
        }
      };

      const existingIdx = dssScores.findIndex(d => d.application_id === appId);
      if (existingIdx >= 0) {
        dssScores[existingIdx] = newDss;
      } else {
        dssScores.push(newDss);
      }
      db.saveTable('dss_scores', dssScores);

      return {
        success: true,
        message: `4-Pillar DSS score recalculated: ${newDss.total_score}% (${newDss.qs_compliant ? 'Compliant' : 'Non-Compliant'}).`,
        data: { dss: newDss }
      };
    }

    if (!dss) {
      dss = {
        application_id: appId,
        total_score: 86.15,
        qs_compliant: true,
        calculated_at: '2026-08-25T11:00:00+08:00',
        merit_score: 88.5,
        competence_score: 82.0,
        ethics_score: 90.0,
        service_score: 85.0,
        details: {
          radar_coordinates: [88.5, 82.0, 90.0, 85.0]
        }
      };
    }

    return {
      success: true,
      data: { dss: dss }
    };
  }

  // 7. Department Head Rubric Evaluation endpoints (/hiring/:id/evaluation/)
  if (path.startsWith('/hiring/') && path.includes('/evaluation')) {
    const parts = path.split('/').filter(Boolean);
    const appId = parts[1] || 'app-001';

    let evals = db.getTable('evaluations') || [];
    let appEvals = evals.filter(e => e.application_id === appId);

    if (method === 'POST') {
      const newEval = {
        id: `eval-${appId}-${Date.now()}`,
        application_id: appId,
        evaluator_name: body.evaluator_name || 'Dr. Roberto Villanueva',
        evaluator_role: body.evaluator_role || 'Dean / Department Head',
        recommendation: body.recommendation || 'RECOMMEND',
        total_score: Number(body.total_score) || 88.0,
        remarks: body.remarks || 'Evaluation rubric scored and certified compliant.',
        submitted_at: new Date().toISOString()
      };
      evals.push(newEval);
      db.saveTable('evaluations', evals);
      return {
        success: true,
        message: 'Department Head Rubric assessment successfully recorded.',
        data: { evaluation: newEval }
      };
    }

    if (appEvals.length === 0) {
      appEvals = [
        {
          evaluator_name: 'Dr. Roberto Villanueva',
          evaluator_role: 'Dean, Institute of Computer Studies',
          recommendation: 'RECOMMEND',
          total_score: 88.0,
          remarks: 'Strong pedagogical foundation and solid technical competence in software engineering.',
          submitted_at: '2026-08-25T14:30:00+08:00'
        }
      ];
    }

    return {
      success: true,
      data: { evaluations: appEvals }
    };
  }

  // 8. Deliberation Dossier & Voting endpoints (/hiring/:id/deliberation-summary/)
  if (path.startsWith('/hiring/') && path.includes('/deliberation-summary')) {
    const parts = path.split('/').filter(Boolean);
    const appId = parts[1] || 'app-001';

    let apps = db.getTable('applications') || [];
    if (!apps || apps.length === 0) {
      db.init();
      apps = db.getTable('applications') || [];
    }
    const app = apps.find(a => a.id === appId) || apps[0] || {
      id: 'app-001',
      tracking_number: 'NBSC-APP-2026-00001',
      applicant_name: 'Carlo Mendoza'
    };

    const vacs = db.getTable('vacancies') || [];
    const vacancy = vacs.find(v => v.id === app.vacancy_id) || {
      title: 'Instructor I (Computer Science)',
      department: 'Institute of Computer Studies (ICS)'
    };

    const dssScores = db.getTable('dss_scores') || [];
    const dss = dssScores.find(d => d.application_id === app.id) || {
      total_score: 86.15,
      qs_compliant: true,
      calculated_at: '2026-08-25T11:00:00+08:00',
      merit_score: 88.5,
      competence_score: 82.0,
      ethics_score: 90.0,
      service_score: 85.0
    };

    let evals = db.getTable('evaluations') || [];
    let appEvals = evals.filter(e => e.application_id === app.id);
    if (appEvals.length === 0) {
      appEvals = [
        {
          evaluator_name: 'Dr. Roberto Villanueva',
          evaluator_role: 'Dean, Institute of Computer Studies',
          recommendation: 'RECOMMEND',
          total_score: 88.0,
          remarks: 'Strong pedagogical foundation and solid technical competence in software engineering.',
          submitted_at: '2026-08-25T14:30:00+08:00'
        }
      ];
    }

    let votes = db.getTable('deliberation_votes') || [];
    let appVotes = votes.filter(v => v.application_id === app.id);
    if (appVotes.length === 0) {
      appVotes = [
        {
          voter_id: 'usr-002',
          voter_name: 'Atty. James O. Cruz',
          voter_role: 'HRMPSB Member',
          vote: 'APPROVE',
          rank: 1,
          remarks: 'Meets and exceeds CSC Qualification Standards. Highly recommended.',
          voted_at: '2026-08-26T10:15:00+08:00'
        },
        {
          voter_id: 'usr-003',
          voter_name: 'Engr. Carlos Mendoza',
          voter_role: 'HRMPSB Member',
          vote: 'APPROVE',
          rank: 1,
          remarks: 'Demonstrates deep alignment with NBSC research and academic agenda.',
          voted_at: '2026-08-26T11:30:00+08:00'
        }
      ];
    }

    const tally = { APPROVE: 0, DISAPPROVE: 0, ABSTAIN: 0, TOTAL: appVotes.length };
    appVotes.forEach(v => {
      if (tally[v.vote] !== undefined) tally[v.vote]++;
    });

    const pInfo = app.personal_info || {};
    const normApp = {
      ...app,
      applicant_name: app.applicant_name || pInfo.full_name || 'Candidate',
      applicant_email: app.applicant_email || pInfo.email || 'applicant@nbsc.edu.ph',
      vacancy: {
        title: vacancy.title || 'Faculty Candidate',
        department: vacancy.department || vacancy.department_code || 'General'
      }
    };

    return {
      success: true,
      data: {
        application: normApp,
        dss: {
          total_score: dss.total_score || 86.15,
          qs_compliant: dss.qs_compliant !== false,
          calculated_at: dss.calculated_at || '2026-08-25T11:00:00+08:00',
          merit_score: dss.merit_score || 88.5,
          competence_score: dss.competence_score || 82.0,
          ethics_score: dss.ethics_score || 90.0,
          service_score: dss.service_score || 85.0
        },
        evaluations: appEvals,
        votes: appVotes,
        vote_tally: tally
      }
    };
  }

  // 9. Vote submission (/hiring/:id/vote)
  if (path.startsWith('/hiring/') && path.includes('/vote') && method === 'POST') {
    const parts = path.split('/').filter(Boolean);
    const appId = parts[1] || 'app-001';

    let votes = db.getTable('deliberation_votes') || [];
    const newVote = {
      id: `vote-${appId}-${Date.now()}`,
      application_id: appId,
      voter_id: body.voter_id || 'usr-002',
      voter_name: body.voter_name || 'HRMPSB Board Member',
      voter_role: body.voter_role || 'HRMPSB Member',
      vote: body.vote || 'APPROVE',
      rank: Number(body.rank) || 1,
      remarks: body.remarks || 'Deliberative vote recorded in official minutes.',
      voted_at: new Date().toISOString()
    };
    votes.push(newVote);
    db.saveTable('deliberation_votes', votes);

    const appVotes = votes.filter(v => v.application_id === appId);
    const tally = { APPROVE: 0, DISAPPROVE: 0, ABSTAIN: 0, TOTAL: appVotes.length };
    appVotes.forEach(v => {
      if (tally[v.vote] !== undefined) tally[v.vote]++;
    });

    return {
      success: true,
      message: 'Official deliberative ballot recorded and anchored into cryptographic ledger.',
      data: {
        vote: newVote,
        vote_tally: tally
      }
    };
  }

  // 10. Final Appointment Resolution & Cryptographic Commit (/hiring/:id/resolution)
  if (path.startsWith('/hiring/') && (path.includes('/resolution') || path.includes('/final-decision'))) {
    const parts = path.split('/').filter(Boolean);
    const appId = parts[1] || 'app-001';

    let blocks = db.getTable('audit_blocks') || [];
    let apps = db.getTable('applications') || [];
    const app = apps.find(a => a.id === appId) || apps[0];

    if (method === 'POST') {
      const prevBlock = blocks[blocks.length - 1] || { hash: '0000000000000000000000000000000000000000000000000000000000000000' };
      const blockIdx = blocks.length;
      const payload = {
        action: 'FINAL_APPOINTMENT_COMMITTED',
        application_id: appId,
        tracking_number: app ? app.tracking_number : 'NBSC-APP-2026-00001',
        candidate_name: app ? (app.applicant_name || app.personal_info?.full_name) : 'Carlo Mendoza',
        plantilla_no: body.plantilla_no || 'NBSC-PLANTILLA-2026-042',
        salary_grade: body.salary_grade || 12,
        resolution_no: body.resolution_no || `BOR-RES-2026-${String(blockIdx).padStart(3, '0')}`,
        timestamp: new Date().toISOString(),
        actor: 'president@nbsc.edu.ph',
        role: 'COLLEGE_PRESIDENT'
      };

      // Mock deterministic SHA-256 hash
      const strToHash = JSON.stringify(payload) + prevBlock.hash;
      let hashNum = 0;
      for (let i = 0; i < strToHash.length; i++) {
        hashNum = ((hashNum << 5) - hashNum) + strToHash.charCodeAt(i);
        hashNum |= 0;
      }
      const rawHex = Math.abs(hashNum).toString(16).padStart(8, '0');
      const mockSha256 = (rawHex + 'e4a7b9c1d3f5820619abb37d0482cfa235689104b2c3d4e5f6a7b8c9d0e1f2a3').substring(0, 64);

      const newBlock = {
        block_index: blockIdx,
        index: blockIdx,
        action: 'APPOINTMENT_RESOLUTION_COMMITTED',
        entity_type: 'APPOINTMENT',
        entity_id: appId,
        actor_name: 'Dr. Maria Santos',
        actor_email: 'president@nbsc.edu.ph',
        actor_role: 'COLLEGE_PRESIDENT',
        prev_hash: prevBlock.hash || prevBlock.block_hash,
        previous_hash: prevBlock.hash || prevBlock.block_hash,
        hash: mockSha256,
        block_hash: mockSha256,
        data: payload,
        created_at: payload.timestamp
      };

      blocks.push(newBlock);
      db.saveTable('audit_blocks', blocks);

      // Advance candidate stage to CONFIRMED / APPOINTED
      if (app) {
        app.stage = 'FINAL_DECISION';
        if (!app.stage_history) app.stage_history = [];
        app.stage_history.push({
          stage: 'FINAL_DECISION',
          timestamp: payload.timestamp,
          actor: 'president@nbsc.edu.ph',
          remarks: `Appointment confirmed under Plantilla ${payload.plantilla_no}`
        });
        db.saveTable('applications', apps);
      }

      return {
        success: true,
        message: 'Executive Appointment Resolution committed and cryptographically sealed into SHA-256 audit ledger.',
        data: {
          block: newBlock,
          hash: mockSha256
        }
      };
    }

    return {
      success: true,
      data: {
        application_id: appId,
        candidate_name: app ? (app.applicant_name || app.personal_info?.full_name) : 'Carlo Mendoza',
        tracking_number: app ? app.tracking_number : 'NBSC-APP-2026-00001',
        plantilla_no: 'NBSC-PLANTILLA-2026-042',
        salary_grade: 12,
        status: app ? app.stage : 'DELIBERATION'
      }
    };
  }

  // 8. Cryptographic Audit Chain endpoint
  if (path === '/audit/chain' || path.startsWith('/audit/chain') || path === '/audit' || path.startsWith('/audit')) {
    let blocks = db.getTable('audit_blocks') || [];
    if (!blocks || blocks.length === 0) {
      db.init();
      blocks = db.getTable('audit_blocks') || [];
    }
    const actionFilter = params.get('action');
    if (actionFilter) {
      blocks = blocks.filter(b => b.action === actionFilter);
    }

    const mappedBlocks = blocks.map(b => ({
      ...b,
      index: b.index !== undefined ? b.index : b.block_index,
      block_index: b.block_index !== undefined ? b.block_index : b.index,
      prev_hash: b.prev_hash || b.previous_hash || '0000000000000000000000000000000000000000000000000000000000000000',
      previous_hash: b.previous_hash || b.prev_hash || '0000000000000000000000000000000000000000000000000000000000000000',
      actor_email: b.actor_email || 'admin@nbsc.edu.ph',
      actor_role: b.actor_role || 'HR_ADMIN',
      target_id: b.target_id || (b.data && (b.data.vacancy_id || b.data.application_id || b.data.employee_id)) || 'NBSC-LEDGER'
    })).slice().reverse();

    return {
      success: true,
      data: {
        blocks: mappedBlocks,
        pagination: {
          total_items: mappedBlocks.length,
          total_pages: 1,
          current_page: 1
        }
      }
    };
  }

  // 9. My Payslips endpoint (matched before general /payroll batches)
  if (path === '/payroll/my-payslips' || path.startsWith('/payroll/my-payslips')) {
    let batches = db.getTable('payroll_batches') || [];
    if (!batches || batches.length === 0) {
      db.init();
      batches = db.getTable('payroll_batches') || [];
    }

    const allSlips = [];
    batches.forEach(b => {
      (b.records || []).forEach(r => {
        const basic = r.gross_pay ? r.gross_pay - 2000 : 30000;
        const gsis = r.deductions?.gsis !== undefined ? r.deductions.gsis : Math.round(basic * 0.09);
        const phil = r.deductions?.philhealth !== undefined ? r.deductions.philhealth : 1000;
        const pag = r.deductions?.pagibig !== undefined ? r.deductions.pagibig : 200;
        const tax = r.deductions?.withholding_tax !== undefined ? r.deductions.withholding_tax : 0;
        const totDed = gsis + phil + pag + tax;
        const net = r.net_pay !== undefined ? r.net_pay : (r.gross_pay - totDed);

        allSlips.push({
          ...r,
          id: r.id,
          batch_id: b.batch_id,
          period_label: b.period_label,
          pay_date: b.created_at ? b.created_at.split('T')[0] : '2026-08-31',
          audit_hash: b.audit_block_hash,
          gross_pay: r.gross_pay || (basic + 2000),
          total_deductions: totDed,
          net_pay: net
        });
      });
    });

    return {
      success: true,
      data: allSlips
    };
  }

  // 10. Payroll Batches & Payslips endpoints
  if (path === '/payroll/batches' || path.startsWith('/payroll/batches') || path === '/payroll/' || path === '/payroll') {
    let batches = db.getTable('payroll_batches') || [];
    if (!batches || batches.length === 0) {
      db.init();
      batches = db.getTable('payroll_batches') || [];
    }

    const segments = path.split('/').filter(Boolean);
    // Detail view: /payroll/batches/:id
    if (segments.length >= 3 && segments[1] === 'batches') {
      const batchId = segments[2];
      const batch = batches.find(b => b.batch_id === batchId || b.id === batchId) || batches[0];
      return {
        success: true,
        data: {
          batch: batch,
          records: batch ? batch.records || [] : []
        }
      };
    }

    return {
      success: true,
      data: batches
    };
  }

  // 11. Notifications endpoint
  if (path === '/notifications' || path.startsWith('/notifications')) {
    const notifs = db.getTable('notifications') || [];
    const unread = notifs.filter(n => !n.is_read).length;
    return {
      success: true,
      data: {
        notifications: notifs,
        unread_count: unread
      }
    };
  }

  return { success: true, data: [] };
}

/**
 * Performs a GET request to the API.
 * @param {string} endpoint - Endpoint path
 * @param {Object} [queryParams] - Optional query params
 * @returns {Promise<any>}
 */
async function apiGet(endpoint, queryParams = null) {
  let url = endpoint;
  if (queryParams) {
    const search = new URLSearchParams();
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        search.append(k, v);
      }
    });
    const queryString = search.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  return request(url, {
    method: 'GET',
    headers: buildHeaders(true)
  });
}

/**
 * Performs a POST request with a JSON body.
 * @param {string} endpoint
 * @param {Object} body
 * @returns {Promise<any>}
 */
async function apiPost(endpoint, body = {}) {
  return request(endpoint, {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify(body)
  });
}

/**
 * Performs a PUT request with a JSON body.
 * @param {string} endpoint
 * @param {Object} body
 * @returns {Promise<any>}
 */
async function apiPut(endpoint, body = {}) {
  return request(endpoint, {
    method: 'PUT',
    headers: buildHeaders(true),
    body: JSON.stringify(body)
  });
}

/**
 * Performs a PATCH request with a JSON body.
 * @param {string} endpoint
 * @param {Object} body
 * @returns {Promise<any>}
 */
async function apiPatch(endpoint, body = {}) {
  return request(endpoint, {
    method: 'PATCH',
    headers: buildHeaders(true),
    body: JSON.stringify(body)
  });
}

/**
 * Performs a DELETE request.
 * @param {string} endpoint
 * @returns {Promise<any>}
 */
async function apiDelete(endpoint) {
  return request(endpoint, {
    method: 'DELETE',
    headers: buildHeaders(true)
  });
}

/**
 * Uploads FormData (multipart/form-data) to the API.
 * @param {string} endpoint
 * @param {FormData} formData
 * @returns {Promise<any>}
 */
async function apiUpload(endpoint, formData) {
  return request(endpoint, {
    method: 'POST',
    headers: buildHeaders(false), // Omit content-type for multipart boundary
    body: formData
  });
}
