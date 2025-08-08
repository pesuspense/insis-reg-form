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
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  } catch (e) {
    return null;
  }
}

const pool = createPoolFromEnv();

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (!pool) return res.status(500).json({ error: '데이터베이스 연결 초기화 실패' });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id가 필요합니다.' });

    if (req.method !== 'PATCH') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { isRegistered } = req.body || {};
    if (typeof isRegistered !== 'boolean') {
      return res.status(400).json({ error: 'isRegistered(boolean)가 필요합니다.' });
    }

    const query = `
      UPDATE registrations SET is_registered = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id
    `;
    const result = await pool.query(query, [isRegistered, id]);
    if (result.rowCount === 0) return res.status(404).json({ error: '대상을 찾을 수 없습니다.' });

    return res.json({ message: '등록 상태 업데이트 완료', id, isRegistered });
  } catch (e) {
    console.error('PATCH /registrations/:id/register 오류:', e);
    return res.status(500).json({ error: '서버 오류', details: e.message });
  }
}
