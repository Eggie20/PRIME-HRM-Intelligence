/**
 * NBSC PRIME-HRM Intelligence Hub — Employees Data Operations
 * CRUD, bulk roster import, CSV roster export, and department distributions.
 */

const DbEmployeesMixin = {
  addEmployee(empData) {
    const employees = this.getTable('employees') || [];
    const count = employees.length + 1;
    const year = new Date().getFullYear();
    const empId = empData.employee_id || `NBSC-${year}-${String(count).padStart(4, '0')}`;

    const newEmp = {
      id: this._generateId('emp'),
      employee_id: empId,
      first_name: empData.first_name || '',
      last_name: empData.last_name || '',
      middle_name: empData.middle_name || '',
      full_name: empData.full_name || `${empData.first_name || ''} ${empData.last_name || ''}`.trim(),
      email: empData.email || `${(empData.first_name||'emp')[0].toLowerCase()}${(empData.last_name||'').toLowerCase()}@nbsc.edu.ph`,
      phone: empData.phone || '0917-000-0000',
      department_code: empData.department_code || empData.department || 'ADMIN',
      department: empData.department || empData.department_code || 'ADMIN',
      position_title: empData.position_title || 'Instructor I',
      category: empData.category || 'TEACHING',
      employment_status: empData.employment_status || 'PERMANENT',
      daily_rate: Number(empData.daily_rate) || 1325.68,
      monthly_salary: Number(empData.monthly_salary) || 29165.00,
      salary_grade: Number(empData.salary_grade) || 12,
      is_active: true,
      created_at: new Date().toISOString()
    };

    employees.unshift(newEmp);
    this.setTable('employees', employees);

    // Append to audit trail
    if (typeof this.appendAuditBlock === 'function') {
      this.appendAuditBlock({
        action: 'EMPLOYEE_RECORD_CREATED',
        target_id: newEmp.employee_id,
        summary: `Added employee ${newEmp.full_name} (${newEmp.position_title} - ${newEmp.department_code})`
      });
    }

    return newEmp;
  },

  bulkImportEmployees(records) {
    if (!Array.isArray(records) || records.length === 0) return { count: 0 };
    const employees = this.getTable('employees') || [];
    let added = 0;

    records.forEach(r => {
      const newEmp = {
        id: this._generateId('emp'),
        employee_id: r.employee_id || `NBSC-2026-${String(employees.length + 1).padStart(4, '0')}`,
        first_name: r.first_name || '',
        last_name: r.last_name || '',
        middle_name: r.middle_name || '',
        full_name: r.full_name || `${r.first_name || ''} ${r.last_name || ''}`.trim(),
        email: r.email || '',
        phone: r.phone || '',
        department_code: r.department_code || r.department || 'ADMIN',
        department: r.department || r.department_code || 'ADMIN',
        position_title: r.position_title || 'Faculty',
        category: r.category || 'TEACHING',
        employment_status: r.employment_status || 'PERMANENT',
        daily_rate: Number(r.daily_rate) || 1325.68,
        monthly_salary: Number(r.monthly_salary) || 29165.00,
        salary_grade: Number(r.salary_grade) || 12,
        is_active: true,
        created_at: new Date().toISOString()
      };
      employees.unshift(newEmp);
      added++;
    });

    this.setTable('employees', employees);
    return { count: added };
  },

  exportRosterCsv() {
    const employees = this.getTable('employees') || [];
    const headers = ['Employee ID', 'Full Name', 'Department', 'Position Title', 'Category', 'Appointment Status', 'Daily Rate', 'Monthly Salary'];
    const rows = employees.map(e => [
      `"${e.employee_id || ''}"`,
      `"${e.full_name || ''}"`,
      `"${e.department || e.department_code || ''}"`,
      `"${e.position_title || ''}"`,
      `"${e.category || ''}"`,
      `"${e.employment_status || ''}"`,
      e.daily_rate || 0,
      e.monthly_salary || 0
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nbsc_personnel_roster_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }
};

if (typeof window !== 'undefined') window.DbEmployeesMixin = DbEmployeesMixin;
if (typeof global !== 'undefined') global.DbEmployeesMixin = DbEmployeesMixin;
