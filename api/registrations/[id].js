const { Pool } = require('pg');

// DATABASE_URL 수동 파싱 및 Pool 구성 생성
function createPoolFromEnv() {
  const raw = process.env.DATABASE_URL;
  if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
    console.error('DATABASE_URL이 비어있거나 유효하지 않습니다.');
    return null;
  }

  try {
    const trimmed = raw.trim();
    const url = new URL(trimmed);

    const pool = new Pool({
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

    // 연결 이벤트 로깅
    pool.on('error', (err) => {
      console.error('PostgreSQL 연결 오류:', err);
    });
    pool.on('connect', () => {
      console.log('PostgreSQL에 연결되었습니다.');
    });

    return pool;
  } catch (e) {
    console.error('DATABASE_URL 파싱 실패:', e.message);
    return null;
  }
}

const pool = createPoolFromEnv();

module.exports = async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 데이터베이스 연결 테스트
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL이 설정되지 않았습니다.');
      return res.status(500).json({ error: '데이터베이스 설정 오류' });
    }

    if (!pool) {
      return res.status(500).json({ error: '데이터베이스 연결 초기화 실패' });
    }

    const { id } = req.query;

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API 오류:', error);
    return res.status(500).json({ 
      error: '서버 오류가 발생했습니다.',
      details: error.message 
    });
  }
}

// GET: 특정 등록 항목 조회
async function handleGet(req, res) {
  const { id } = req.query;
  
  const query = `
    SELECT * FROM registrations WHERE id = $1
  `;
  
  const result = await pool.query(query, [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: '등록 항목을 찾을 수 없습니다.' });
  }
  
  return res.json(result.rows[0]);
}

// PUT: 등록 항목 업데이트
async function handlePut(req, res) {
  const { id } = req.query;
  const updateData = req.body;
  
  const query = `
    UPDATE registrations SET 
    full_name = $1, is_new_user = $2, gender = $3, phone = $4, email = $5,
    position = $6, organization = $7, contact_date = $8, contact_method = $9,
    contact_sub_method = $10, contact_content = $11, is_registered = $12
    WHERE id = $13
    RETURNING *
  `;
  
  const values = [
    updateData.fullName,
    updateData.isNewUser,
    updateData.gender,
    updateData.phone,
    updateData.email,
    updateData.position,
    updateData.organization,
    updateData.contactDate,
    updateData.contactMethod,
    updateData.contactSubMethod,
    updateData.contactContent,
    updateData.isRegistered,
    id
  ];
  
  const result = await pool.query(query, values);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: '등록 항목을 찾을 수 없습니다.' });
  }
  
  return res.json({ message: '업데이트가 성공적으로 완료되었습니다.' });
}

// DELETE: 등록 항목 삭제
async function handleDelete(req, res) {
  const { id } = req.query;
  
  const query = `
    DELETE FROM registrations WHERE id = $1
    RETURNING id
  `;
  
  const result = await pool.query(query, [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: '등록 항목을 찾을 수 없습니다.' });
  }
  
  return res.json({ message: '항목이 삭제되었습니다.' });
}
