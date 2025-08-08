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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, OPTIONS');
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

    // DATABASE_URL 형식 확인
    console.log('DATABASE_URL 길이:', process.env.DATABASE_URL.length);
    console.log('DATABASE_URL 시작:', process.env.DATABASE_URL.substring(0, 20));

    if (!pool) {
      return res.status(500).json({ error: '데이터베이스 연결 초기화 실패' });
    }

    // 기본 연결 테스트
    const testQuery = await pool.query('SELECT NOW() as current_time');
    console.log('데이터베이스 연결 성공:', testQuery.rows[0]);

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'PATCH':
        return await handlePatch(req, res);
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

// GET: 등록 데이터 조회
async function handleGet(req, res) {
  try {
    const { sortBy = 'created_at', sortOrder = 'desc', country, monthWeek, contactMethod } = req.query;
    
    console.log('GET 요청 파라미터:', { sortBy, sortOrder, country, monthWeek, contactMethod });
    
    let orderBy = 'created_at';
    switch (sortBy) {
      case 'fullName':
        orderBy = 'full_name';
        break;
      case 'contactDate':
        orderBy = 'contact_date';
        break;
      case 'contactMethod':
        orderBy = 'contact_method';
        break;
      case 'isRegistered':
        orderBy = 'is_registered';
        break;
      case 'country':
        orderBy = 'country';
        break;
      case 'createdAt':
        orderBy = 'created_at';
        break;
      default:
        orderBy = 'created_at';
    }
    
    // 테이블 존재 여부 확인
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'registrations'
      );
    `;
    
    console.log('테이블 존재 여부 확인 중...');
    const tableExists = await pool.query(tableCheckQuery);
    console.log('테이블 존재 여부:', tableExists.rows[0].exists);
    
    if (!tableExists.rows[0].exists) {
      console.error('registrations 테이블이 존재하지 않습니다.');
      return res.status(500).json({ 
        error: '데이터베이스 테이블이 존재하지 않습니다.',
        details: 'registrations 테이블을 생성해주세요.'
      });
    }
    
    // 필터 조건 구성
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;
    
    if (country) {
      whereConditions.push(`country = $${paramIndex}`);
      queryParams.push(country);
      paramIndex++;
    }
    
    if (monthWeek) {
      whereConditions.push(`month_week_label = $${paramIndex}`);
      queryParams.push(monthWeek);
      paramIndex++;
    }

    if (contactMethod) {
      whereConditions.push(`contact_method = $${paramIndex}`);
      queryParams.push(contactMethod);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const query = `
      SELECT 
        id,
        full_name,
        is_new_user,
        gender,
        phone,
        email,
        position,
        organization,
        contact_date,
        contact_method,
        contact_sub_method,
        contact_content,
        country,
        is_registered,
        created_at,
        updated_at,
        month_week_label
      FROM registrations
      ${whereClause}
      ORDER BY ${orderBy} ${sortOrder.toUpperCase()}
    `;
    
    console.log('실행할 쿼리:', query);
    console.log('쿼리 파라미터:', queryParams);
    
    const result = await pool.query(query, queryParams);
    console.log('쿼리 결과 행 수:', result.rows.length);
    
    return res.json(result.rows);
  } catch (error) {
    console.error('GET 요청 오류:', error);
    console.error('오류 스택:', error.stack);
    return res.status(500).json({ 
      error: '데이터 조회 중 오류가 발생했습니다.',
      details: error.message,
      code: error.code
    });
  }
}

// POST: 등록 데이터 저장
async function handlePost(req, res) {
  const { registrations } = req.body;
  
  if (!Array.isArray(registrations) || registrations.length === 0) {
    return res.status(400).json({ error: '등록 데이터가 필요합니다.' });
  }

  const insertPromises = registrations.map(registration => {
    const fullName = `${registration.firstName} ${registration.lastName}`.trim();
    
    const query = `
      INSERT INTO registrations 
      (full_name, is_new_user, gender, phone, email, position, organization, 
       contact_date, contact_method, contact_sub_method, contact_content, country, is_registered)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `;
    
    const values = [
      fullName,
      registration.isNewUser,
      registration.gender || null,
      registration.phone || null,
      registration.email || null,
      registration.position || null,
      registration.organization || null,
      registration.contactDate,
      registration.contactMethod,
      registration.contactSubMethod,
      registration.contactContent || null,
      registration.country || 'MN',
      false
    ];
    
    return pool.query(query, values);
  });

  await Promise.all(insertPromises);
  return res.json({ message: '등록이 성공적으로 완료되었습니다.', count: registrations.length });
}

// PUT: 개별 항목 업데이트
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

// PATCH: 등록 상태 업데이트
async function handlePatch(req, res) {
  const { id } = req.query;
  const { isRegistered } = req.body;
  
  const query = `
    UPDATE registrations SET is_registered = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `;
  
  const result = await pool.query(query, [isRegistered, id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: '등록 항목을 찾을 수 없습니다.' });
  }
  
  return res.json({ message: '등록 상태가 업데이트되었습니다.' });
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
