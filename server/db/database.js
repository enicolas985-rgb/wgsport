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
        run(...params) {
          sqliteDb.run(sql, params);
          const lastResult = sqliteDb.exec('SELECT last_insert_rowid() as id');
          const changes = sqliteDb.getRowsModified();
          saveDatabase();
          return {
            lastInsertRowid: lastResult.length > 0 && lastResult[0].values.length > 0 ? lastResult[0].values[0][0] : 0,
            changes: changes
          };
        },
        get(...params) {
          const stmt = sqliteDb.prepare(sql);
          stmt.bind(params);
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
        all(...params) {
          const results = [];
          const stmt = sqliteDb.prepare(sql);
          stmt.bind(params);
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
    exec(sql) {
      sqliteDb.exec(sql);
      saveDatabase();
    },
    pragma(pragmaStr) {
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
