const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'wg.db');

let db = null;

function saveDatabase() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (error) {
    console.warn('[db] No se pudo persistir la base de datos:', error.message);
  }
}

function toSqliteParams(params) {
  return (params || []).map(p => {
    if (typeof p === 'boolean') return p ? 1 : 0;
    return p;
  });
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return createWrapper(db);
}

function createWrapper(sqliteDb) {
  return {
    prepare(sql) {
      return {
        async run(...params) {
          const bind = toSqliteParams(params);
          sqliteDb.run(sql, bind);
          const lastResult = sqliteDb.exec('SELECT last_insert_rowid() as id');
          const changes = sqliteDb.getRowsModified();
          saveDatabase();
          return {
            lastInsertRowid: lastResult.length > 0 && lastResult[0].values.length > 0 ? lastResult[0].values[0][0] : 0,
            changes: changes
          };
        },
        async get(...params) {
          const bind = toSqliteParams(params);
          const stmt = sqliteDb.prepare(sql);
          stmt.bind(bind);
          if (stmt.step()) {
            const cols = stmt.getColumnNames();
            const vals = stmt.get();
            stmt.free();
            const row = {};
            cols.forEach((col, i) => {
              row[col] = vals[i];
            });
            return row;
          }
          stmt.free();
          return undefined;
        },
        async all(...params) {
          const bind = toSqliteParams(params);
          const results = [];
          const stmt = sqliteDb.prepare(sql);
          stmt.bind(bind);
          while (stmt.step()) {
            const cols = stmt.getColumnNames();
            const vals = stmt.get();
            const row = {};
            cols.forEach((col, i) => {
              row[col] = vals[i];
            });
            results.push(row);
          }
          stmt.free();
          return results;
        }
      };
    },
    async exec(sql) {
      sqliteDb.exec(sql);
      saveDatabase();
    },
    async pragma(pragmaStr) {
      try {
        sqliteDb.exec(`PRAGMA ${pragmaStr}`);
      } catch (e) {
        // WAL mode not supported in sql.js, silently ignore
      }
    }
  };
}

async function initDatabase() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  return createWrapper(db);
}

module.exports = { initDatabase, getDb, saveDatabase };