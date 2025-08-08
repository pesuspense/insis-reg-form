const { Pool } = require('pg');

function createPoolFromEnv() {
  const raw = process.env.DATABASE_URL;
  if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
    return null;
  }
  try {
    const url = new URL(raw.trim());
    return new Pool({
      user: decodeURIComponent(url.username || ''),
      password: decodeURIComponent(url.password || ''),
      host: url.hostname,
      port: url.port ? Number(url.port) : 5432,
      database: url.pathname ? url.pathname.replace(/^\//, '') : undefined,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 3000,
    });
  } catch (e) {
    return null;
  }
}

module.exports = async function handler(req, res) {
  try {
    const raw = process.env.DATABASE_URL || '';
    const pool = createPoolFromEnv();
    if (!pool) {
      return res.status(500).json({ ok: false, reason: 'POOL_INIT_FAILED', rawPrefix: raw.substring(0, 25) });
    }
    const now = await pool.query('SELECT NOW() as now');
    return res.json({ ok: true, host: pool.options.host, db: pool.options.database, now: now.rows[0].now });
  } catch (e) {
    return res.status(500).json({ ok: false, reason: e.message });
  }
}
