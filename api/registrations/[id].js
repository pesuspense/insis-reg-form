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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (!pool) return res.status(500).json({ error: '데이터베이스 연결 초기화 실패' });
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id가 필요합니다.' });

    if (req.method === 'GET') {
      const { rows } = await pool.query('SELECT * FROM registrations WHERE id = $1', [id]);
      if (rows.length === 0) return res.status(404).json({ error: '대상을 찾을 수 없습니다.' });
      return res.json(rows[0]);
    }

    if (req.method === 'PUT') {
      const u = req.body || {};
      const query = `
        UPDATE registrations SET 
          full_name = $1, is_new_user = $2, gender = $3, phone = $4, email = $5,
          position = $6, organization = $7, contact_date = $8, contact_method = $9,
          contact_sub_method = $10, contact_content = $11, is_registered = $12, updated_at = NOW()
        WHERE id = $13
        RETURNING id
      `;
      const values = [
        u.fullName, u.isNewUser, u.gender, u.phone, u.email,
        u.position, u.organization, u.contactDate, u.contactMethod,
        u.contactSubMethod, u.contactContent, u.isRegistered, id
      ];
      const result = await pool.query(query, values);
      if (result.rowCount === 0) return res.status(404).json({ error: '대상을 찾을 수 없습니다.' });
      return res.json({ message: '업데이트 완료', id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('GET/PUT /registrations/:id 오류:', e);
    return res.status(500).json({ error: '서버 오류', details: e.message });
  }
}
