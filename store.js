// Persistence layer. Uses Postgres when DATABASE_URL is set (Railway Postgres
// plugin), otherwise falls back to a local JSON file — handy for local dev,
// but note a plain Railway deployment without a database plugin will lose
// data on redeploy since the filesystem is not guaranteed to persist.

const fs = require("fs");
const path = require("path");

const FILE_PATH = path.join(__dirname, "data", "state.json");

function usePg() {
  return !!process.env.DATABASE_URL;
}

let pool = null;
function getPool() {
  if (!pool) {
    const { Pool } = require("pg");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes("railway")
        ? { rejectUnauthorized: false }
        : (process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false }),
    });
  }
  return pool;
}

async function ensureTable() {
  const p = getPool();
  await p.query(`
    CREATE TABLE IF NOT EXISTS plan_state (
      id SMALLINT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function loadState() {
  if (usePg()) {
    await ensureTable();
    const p = getPool();
    const res = await p.query("SELECT data FROM plan_state WHERE id = 1");
    if (res.rows.length) return res.rows[0].data;
    return null;
  }
  try {
    const text = fs.readFileSync(FILE_PATH, "utf8");
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

async function saveState(state) {
  if (usePg()) {
    await ensureTable();
    const p = getPool();
    await p.query(
      `INSERT INTO plan_state (id, data, updated_at) VALUES (1, $1, now())
       ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = now()`,
      [state]
    );
    return;
  }
  fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(state));
}

module.exports = { loadState, saveState, usePg };
