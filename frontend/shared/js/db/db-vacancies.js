/**
 * NBSC PRIME-HRM Intelligence Hub — Vacancies Data Operations
 * Posting creation, status management, CSC qualification standards.
 */

const DbVacanciesMixin = {
  createVacancy(vData) {
    const vacancies = this.getTable('vacancies') || [];
    const count = vacancies.length + 1;
    const year = new Date().getFullYear();
    const itemNum = vData.item_number || `PLANTILLA-${year}-${String(count).padStart(3, '0')}`;

    const title = vData.title || vData.position_title || 'Untitled Vacancy';
    const id = this._generateId('vac');
    const newVac = {
      id: id,
      vacancy_id: id,
      title: title,
      position_title: title,
      department: vData.department || vData.department_code || 'ADMIN',
      department_code: vData.department_code || vData.department || 'ADMIN',
      category: vData.category || 'TEACHING',
      appointment_status: vData.appointment_status || 'Contract of Service (COS)',
      employment_status: vData.employment_status || 'COS',
      slots: Number(vData.slots) || 1,
      salary_grade: Number(vData.salary_grade) || 12,
      salary_rate: Number(vData.salary_rate || vData.monthly_salary) || 29165.00,
      monthly_salary: Number(vData.salary_rate || vData.monthly_salary) || 29165.00,
      daily_rate: Number(vData.daily_rate) || 1325.68,
      status: vData.status || 'OPEN',
      item_number: itemNum,
      description: vData.description || 'Instructional and administrative responsibilities per college mandate.',
      qualification_standards: {
        education: vData.education || vData.qs_education || "Bachelor's degree in relevant discipline",
        experience: vData.experience || vData.qs_experience || 'None required',
        training: vData.training || vData.qs_training || 'None required',
        eligibility: vData.eligibility || vData.qs_eligibility || 'RA 1080 / CS Professional'
      },
      deadline: vData.deadline || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      created_at: new Date().toISOString()
    };

    vacancies.unshift(newVac);
    this.setTable('vacancies', vacancies);

    if (typeof this.appendAuditBlock === 'function') {
      this.appendAuditBlock({
        action: 'VACANCY_POSTED',
        target_id: newVac.id,
        summary: `Posted vacancy: ${newVac.title} (${newVac.department} • SG ${newVac.salary_grade})`
      });
    }

    return newVac;
  },

  closeVacancy(id) {
    return this.update('vacancies', id, { status: 'CLOSED', closed_at: new Date().toISOString() });
  }
};

if (typeof window !== 'undefined') window.DbVacanciesMixin = DbVacanciesMixin;
if (typeof global !== 'undefined') global.DbVacanciesMixin = DbVacanciesMixin;
