/**
 * NBSC PRIME-HRM Intelligence Hub — Academic Degree Programs Operations
 */

const DbProgramsMixin = {
  addProgram(pData) {
    const programs = this.getTable('programs') || [];
    const progId = this._generateId('prg');
    const progName = pData.name || pData.title || 'Degree Program';
    const newProg = {
      id: progId,
      program_id: progId,
      code: (pData.code || 'DEG').toUpperCase(),
      name: progName,
      title: progName,
      department_code: pData.department_code || pData.department || 'ICS',
      department_name: pData.department_name || pData.department || 'Institute of Computer Studies',
      degree_level: pData.degree_level || 'Baccalaureate',
      status: pData.status || 'ACTIVE',
      majors: Array.isArray(pData.majors) ? pData.majors : (pData.majors ? pData.majors.split(',').map(s => s.trim()) : []),
      ched_status: pData.ched_status || 'Compliant (COPC Recognized)',
      created_at: new Date().toISOString()
    };
    programs.unshift(newProg);
    this.setTable('programs', programs);
    return newProg;
  }
};

if (typeof window !== 'undefined') window.DbProgramsMixin = DbProgramsMixin;
if (typeof global !== 'undefined') global.DbProgramsMixin = DbProgramsMixin;
