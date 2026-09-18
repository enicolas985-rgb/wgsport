const { getClient, normalizeParams, convertPlaceholders, statementKind, simplifyInsert, buildConflictClause } = require('./postgres-core');
const sqlite = require('./sqlite');

const PG_URL = process.env.DATABASE_URL;
if (PG_URL && !process.env.PGSSL && (PG_URL.includes('sslmode=') || /neon\.tech/i.test(PG_URL))) {
  process.env.PGSSL = 'true';
}

const usesPostgres = () => !!process.env.DATABASE_URL;

function normalizePgSql(sql) {
  let s = String(sql);
  s = s.replace(/\bdate\(['"]now['"]\)/gi, 'CURRENT_DATE');
  s = s.replace(/\bdatetime\(['"]now['"]\)/gi, 'now()');
  s = s.replace(/\bis_active\s*=\s*([01])\b/gi, (m, n) => `is_active = ${n === '1' ? 'TRUE' : 'FALSE'}`);
  return s;
}

function splitStatements(sql) {
  const out = [];
  let cur = '';
  let inStr = false;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'") {
      cur += ch;
      if (inStr && sql[i + 1] === "'") { cur += "'"; i += 1; continue; }
      inStr = !inStr;
      continue;
    }
    cur += ch;
    if (ch === ';' && !inStr) {
      out.push(cur);
      cur = '';
    }
  }
  if (cur.trim()) out.push(cur);
  return out;
}

async function pgExecute(sql, params, method) {
  const client = await getClient();
  try {
    const raw = normalizePgSql(sql);
    const kind = statementKind(raw);
    let psql = convertPlaceholders(raw, params);
    const bind = normalizeParams(params);
    if (kind === 'insert') {
      const conflict = buildConflictClause(psql);
      psql = simplifyInsert(psql);
      psql = psql + conflict + ' RETURNING *';
    }
    if (method === 'run') {
      const result = await client.query(psql, bind);
      const changes = result.rowCount || 0;
      let lastInsertRowid = 0;
      if (kind === 'insert' && result.rows && result.rows.length > 0 && result.rows[0].id != null) {
        lastInsertRowid = result.rows[0].id;
      }
      return { lastInsertRowid, changes };
    }
    if (method === 'get') {
      const result = await client.query(psql, bind);
      return result.rows[0];
    }
    const result = await client.query(psql, bind);
    return result.rows;
  } finally {
    client.release();
  }
}

function pgWrapper() {
  return {
    prepare(sql) {
      return {
        async run(...params) { return pgExecute(sql, params, 'run'); },
        async get(...params) { return pgExecute(sql, params, 'get'); },
        async all(...params) { return pgExecute(sql, params, 'all'); }
      };
    },
    async exec(sql) {
      const statements = splitStatements(sql);
      const client = await getClient();
      try {
        await client.query('BEGIN');
        for (const stmt of statements) {
          if (!stmt.trim()) continue;
          let psql = normalizePgSql(stmt);
          if (statementKind(psql) === 'insert') {
            const conflict = buildConflictClause(psql);
            psql = simplifyInsert(psql);
            psql = psql + conflict + ' RETURNING *';
          }
          await client.query(psql);
        }
        await client.query('COMMIT');
      } catch (error) {
        try { await client.query('ROLLBACK'); } catch (e) { /* ignore */ }
        throw error;
      } finally {
        client.release();
      }
    },
    async pragma() {}
  };
}

function getDb() {
  return usesPostgres() ? pgWrapper() : sqlite.getDb();
}

async function initDatabase() {
  if (usesPostgres()) {
    return pgWrapper();
  }
  return sqlite.initDatabase();
}

function saveDatabase() {
  if (usesPostgres()) return Promise.resolve();
  return sqlite.saveDatabase();
}

module.exports = { initDatabase, getDb, saveDatabase };