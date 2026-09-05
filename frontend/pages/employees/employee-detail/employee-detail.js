/**
 * NBSC PRIME-HRM Intelligence Hub — Employee Detail Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  requireAuth([ROLES.HR_ADMIN, ROLES.HRMPSB_MEMBER, ROLES.DEPT_HEAD]);

  const empId = getQueryParam('id');
  if (!empId) {
    showToast('No employee ID specified.', 'error');
    setTimeout(() => {
      window.location.href = '../employee-list/employee-list.html';
    }, 1000);
    return;
  }

  const btnEdit = document.getElementById('btn-edit-profile');
  if (btnEdit) {
    btnEdit.href = `../employee-form/employee-form.html?id=${empId}`;
  }

  try {
    const response = await apiGet(`/employees/${empId}/`);
    const emp = response.data.employee;
    if (!emp) throw new Error('Employee record missing');

    document.getElementById('prof-name').textContent = emp.full_name;
    document.getElementById('prof-position').textContent = emp.position;
    document.getElementById('prof-dept').textContent = `Division: ${emp.department}`;
    document.getElementById('prof-id').textContent = emp.employee_id;
    document.getElementById('prof-rate').textContent = emp.daily_rate ? formatCurrency(emp.daily_rate) : '—';
    document.getElementById('prof-salary').textContent = emp.monthly_salary ? formatCurrency(emp.monthly_salary) : '—';
    document.getElementById('prof-hired').textContent = formatDate(emp.date_hired);
    document.getElementById('prof-email').textContent = emp.email;
    document.getElementById('prof-phone').textContent = emp.phone || 'None provided';

    const avatarEl = document.getElementById('prof-avatar');
    if (avatarEl) {
      avatarEl.textContent = emp.full_name.substring(0, 2).toUpperCase();
    }

    const catBadge = document.getElementById('prof-category-badge');
    if (catBadge) {
      catBadge.textContent = emp.category === 'TEACHING' ? 'Teaching Faculty' : 'Non-Teaching Staff';
      catBadge.className = `badge ${emp.category === 'TEACHING' ? 'badge--teaching' : 'badge--non-teaching'}`;
    }

    const statusBadge = document.getElementById('prof-status-badge');
    if (statusBadge) {
      statusBadge.textContent = emp.employment_status;
      statusBadge.className = `badge ${emp.employment_status === 'PERMANENT' ? 'badge--permanent' : 'badge--cos'}`;
    }

  } catch (err) {
    showToast('Error loading profile: ' + err.message, 'error');
  }
});
