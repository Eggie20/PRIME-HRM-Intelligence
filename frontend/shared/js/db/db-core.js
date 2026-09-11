/**
 * NBSC PRIME-HRM Intelligence Hub — Core Storage Engine
 * Handles localStorage persistence, table CRUD, querying, and ID generation.
 */

class NbscDBCore {
  constructor() {
    this.prefix = 'nbsc_db_';
    this.initKey = 'nbsc_db_initialized';
  }

  init() {
    const isInitialized = localStorage.getItem(this.initKey);
    const dbVersion = localStorage.getItem('nbsc_db_version');
    const CURRENT_VERSION = '2.4.0';

    const seed = (typeof DB_SEED !== 'undefined') ? DB_SEED : (window.DB_SEED || {});
    Object.entries(seed).forEach(([table, rows]) => {
      const existing = localStorage.getItem(this.prefix + table);
      if (!isInitialized || !existing || dbVersion !== CURRENT_VERSION) {
        this.setTable(table, rows);
      }
    });
    if (!isInitialized || dbVersion !== CURRENT_VERSION) {
      localStorage.setItem(this.initKey, new Date().toISOString());
      localStorage.setItem('nbsc_db_version', CURRENT_VERSION);
      console.log('[NbscDB] Database initialized (v' + CURRENT_VERSION + ').');
    }
  }

  reset() {
    const seed = (typeof DB_SEED !== 'undefined') ? DB_SEED : (window.DB_SEED || {});
    Object.keys(seed).forEach(table => {
      localStorage.removeItem(this.prefix + table);
    });
    localStorage.removeItem(this.initKey);
    this.init();
    console.log('[NbscDB] Database reset complete.');
  }

  getTable(table) {
    const raw = localStorage.getItem(this.prefix + table);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }

  setTable(table, rows) {
    localStorage.setItem(this.prefix + table, JSON.stringify(rows));
  }

  saveTable(table, rows) {
    this.setTable(table, rows);
  }

  findOne(table, predicate) {
    return this.getTable(table).find(predicate) || null;
  }

  findAll(table, predicate) {
    const rows = this.getTable(table);
    return predicate ? rows.filter(predicate) : rows;
  }

  count(table, predicate) {
    return this.findAll(table, predicate).length;
  }

  insert(table, row) {
    const rows = this.getTable(table);
    if (!row.id) {
      row.id = this._generateId(table);
    }
    if (!row.created_at) {
      row.created_at = new Date().toISOString();
    }
    rows.push(row);
    this.setTable(table, rows);
    return row;
  }

  update(table, id, changes) {
    const rows = this.getTable(table);
    const idx = rows.findIndex(r => r.id === id);
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...changes, updated_at: new Date().toISOString() };
    this.setTable(table, rows);
    return rows[idx];
  }

  remove(table, id) {
    const rows = this.getTable(table);
    const filtered = rows.filter(r => r.id !== id);
    if (filtered.length === rows.length) return false;
    this.setTable(table, filtered);
    return true;
  }

  exportForPostgres() {
    const seed = (typeof DB_SEED !== 'undefined') ? DB_SEED : (window.DB_SEED || {});
    const dump = {};
    Object.keys(seed).forEach(table => {
      dump[table] = this.getTable(table);
    });
    return {
      _metadata: {
        exported_at: new Date().toISOString(),
        source: 'NBSC PRIME-HRM Intelligence Hub — Modular DB',
        version: '2.4.0',
        tables: Object.keys(dump),
        total_rows: Object.values(dump).reduce((sum, rows) => sum + rows.length, 0)
      },
      ...dump
    };
  }

  downloadExport() {
    const data = this.exportForPostgres();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nbsc_primehrm_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  _generateId(prefix) {
    const short = prefix.substring(0, 3);
    const rand = Math.random().toString(36).substring(2, 10);
    const ts = Date.now().toString(36);
    return `${short}-${ts}-${rand}`;
  }

  _generateToken() {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      iss: 'nbsc-primehrm',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
      jti: Math.random().toString(36).substring(2, 15)
    }));
    const sig = btoa(Math.random().toString(36).substring(2, 30));
    return `${header}.${payload}.${sig}`;
  }
}

if (typeof window !== 'undefined') window.NbscDBCore = NbscDBCore;
if (typeof global !== 'undefined') global.NbscDBCore = NbscDBCore;
