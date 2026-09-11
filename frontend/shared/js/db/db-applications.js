/**
 * NBSC PRIME-HRM Intelligence Hub — Applications & Hiring Pipeline
 * 4-pillar DSS scoring, department head evaluations, HRMPSB deliberations.
 */

const DbApplicationsMixin = {
  submitCorrectionRequest(req) {
    const list = this.getTable('correction_requests') || [];
    const newReq = {
      id: this._generateId('cr'),
      applicant_id: req.applicant_id || 'usr-004',
      applicant_name: req.applicant_name || 'Carlo Mendoza',
      applicant_email: req.applicant_email || 'applicant@gmail.com',
      tracking_number: req.tracking_number || 'NBSC-APP-2026-10001',
      field_name: req.field_name,
      field_label: req.field_label,
      current_value: req.current_value,
      requested_value: req.requested_value,
      reason: req.reason,
      id_type: req.id_type,
      id_number: req.id_number,
      id_filename: req.id_filename || 'ValidID_Proof.pdf',
      proof_document: req.proof_document || null,
      status: 'PENDING',
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    list.unshift(newReq);
    this.setTable('correction_requests', list);
    return newReq;
  },

  approveCorrectionRequest(requestId, adminEmail = 'admin@nbsc.edu.ph') {
    const list = this.getTable('correction_requests') || [];
    const req = list.find(r => r.id === requestId);
    if (!req) return false;

    req.status = 'APPROVED';
    req.reviewed_at = new Date().toISOString();
    req.reviewed_by = adminEmail;
    this.setTable('correction_requests', list);

    const users = this.getTable('users') || [];
    const u = users.find(user => user.id === req.applicant_id || user.email === req.applicant_email);
    if (u) {
      if (req.field_name === 'full_name' || req.field_name === 'name') u.name = req.requested_value;
      else if (req.field_name === 'email') u.email = req.requested_value;
      else if (req.field_name === 'phone') u.phone = req.requested_value;
      this.setTable('users', users);
    }

    const apps = this.getTable('applications') || [];
    apps.forEach(app => {
      if (app.applicant_id === req.applicant_id || app.applicant_name === req.applicant_name) {
        if (req.field_name === 'full_name' || req.field_name === 'name') {
          app.applicant_name = req.requested_value;
          if (app.personal_info) app.personal_info.full_name = req.requested_value;
        }
      }
    });
    this.setTable('applications', apps);
    return true;
  },

  rejectCorrectionRequest(requestId, adminEmail = 'admin@nbsc.edu.ph', notes = 'Insufficient identity proof.') {
    const list = this.getTable('correction_requests') || [];
    const req = list.find(r => r.id === requestId);
    if (!req) return false;
    req.status = 'REJECTED';
    req.reviewed_at = new Date().toISOString();
    req.reviewed_by = adminEmail;
    req.admin_notes = notes;
    this.setTable('correction_requests', list);
    return true;
  }
};

if (typeof window !== 'undefined') window.DbApplicationsMixin = DbApplicationsMixin;
if (typeof global !== 'undefined') global.DbApplicationsMixin = DbApplicationsMixin;
