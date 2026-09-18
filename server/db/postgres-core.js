const { Pool } = require('pg');

let pool = null;
let schemaReady = false;

function getPool() {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn('[db] DATABASE_URL no configurada.');
    return null;
  }
  pool = new Pool({
    connectionString: url,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    max: Number(process.env.PG_POOL_MAX) || 3,
    connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT) || 10000,
    idleTimeoutMillis: 30000
  });
  return pool;
}

async function getClient() {
  const p = getPool();
  if (!p) throw new Error('Base de datos no inicializada.');
  return p.connect();
}

function normalizeParams(params) {
  return (params || []).map(p => {
    if (p === undefined) return null;
    if (typeof p === 'boolean') return p;
    return p;
  });
}

function convertPlaceholders(sql, params) {
  let out = '';
  let count = 0;
  let inString = false;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'") {
      out += ch;
      let j = i + 1;
      while (j < sql.length) {
        const c = sql[j];
        if (c === "'") {
          if (sql[j + 1] === "'") { out += "''"; j += 2; continue; }
          out += "'";
          j += 1;
          break;
        }
        out += c;
        j += 1;
      }
      i = j;
      continue;
    }
    if (ch === '?') {
      count += 1;
      out += '$' + count;
      continue;
    }
    out += ch;
  }
  return out;
}

function statementKind(sql) {
  const t = String(sql).trim().toUpperCase();
  if (/^\s*INSERT/.test(t)) return 'insert';
  if (/^\s*UPDATE/.test(t)) return 'update';
  if (/^\s*DELETE/.test(t)) return 'delete';
  if (/^\s*SELECT/.test(t)) return 'select';
  return 'other';
}

function simplifyInsert(sql) {
  let s = String(sql).trim().replace(/;+$/, '');
  s = s.replace(/^\s*INSERT\s+OR\s+IGNORE\b/i, 'INSERT');
  s = s.replace(/^\s*INSERT\s+OR\s+REPLACE\b/i, 'INSERT');
  s = s.replace(/\bdate\('now'\)/gi, "CURRENT_DATE");
  s = s.replace(/\bdatetime\('now'\)/gi, "now()");
  return s;
}

function extractInsertMeta(sql) {
  const t = String(sql).trim();
  const tableMatch = t.match(/INTO\s+([A-Za-z_][A-Za-z0-9_]*)/i);
  const colsMatch = t.match(/\(([^)]*)\)\s*VALUES/i);
  const ignore = /OR\s+IGNORE/i.test(t);
  const replace = /OR\s+REPLACE/i.test(t);
  return {
    table: tableMatch ? tableMatch[1] : null,
    cols: colsMatch ? colsMatch[1].split(',').map(c => c.trim().replace(/^"|"$/g, '')).filter(Boolean) : [],
    ignore,
    replace
  };
}

function buildConflictClause(sql) {
  const meta = extractInsertMeta(sql);
  if (meta.ignore) {
    return ' ON CONFLICT DO NOTHING';
  }
  if (meta.replace && meta.cols.length > 0) {
    const nonId = meta.cols.filter(c => c.toLowerCase() !== 'id');
    if (nonId.length > 0) {
      const set = nonId.map(c => `${c} = EXCLUDED.${c}`).join(', ');
      const target = meta.cols.filter(c => c.toLowerCase() === 'id');
      return ` ON CONFLICT (id) DO UPDATE SET ${set}`;
    }
  }
  return '';
}

function addReturning(sql) {
  return String(sql).trim().replace(/;+$/, '') + ' RETURNING id';
}

module.exports = {
  getPool,
  getClient,
  normalizeParams,
  convertPlaceholders,
  statementKind,
  simplifyInsert,
  buildConflictClause,
  addReturning
};
