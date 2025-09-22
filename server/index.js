const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// PostgreSQL 연결
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/insis-reg-form',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// 데이터베이스 연결 테스트
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL 환경 변수가 설정되지 않았습니다.');
  console.error('서버를 시작하려면 DATABASE_URL을 설정해주세요.');
  console.error('예: postgresql://localhost:5432/insis-reg-form');
  process.exit(1);
}

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('PostgreSQL 연결 오류:', err.message);
    console.error('데이터베이스 서버가 실행 중인지 확인해주세요.');
  } else {
    console.log('PostgreSQL에 연결되었습니다.');
  }
});

// 등록 데이터 저장 API
app.post('/api/registrations', async (req, res) => {
  try {
    const { registrations } = req.body;
    
    if (!Array.isArray(registrations) || registrations.length === 0) {
      return res.status(400).json({ error: '등록 데이터가 필요합니다.' });
    }

    const insertPromises = registrations.map(registration => {
      // 이름과 성을 합쳐서 fullName 생성
      const fullName = `${registration.firstName} ${registration.lastName}`.trim();
      
      const query = `
        INSERT INTO registrations 
        (full_name, is_new_user, gender, phone, email, position, organization, 
         contact_date, contact_method, contact_sub_method, contact_content, is_registered)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
        false
      ];
      
      return pool.query(query, values);
    });

    await Promise.all(insertPromises);
    res.json({ message: '등록이 성공적으로 완료되었습니다.', count: registrations.length });
  } catch (error) {
    console.error('등록 저장 오류:', error);
    res.status(500).json({ error: '등록 저장 중 오류가 발생했습니다.' });
  }
});

// 등록 데이터 조회 API
app.get('/api/registrations', async (req, res) => {
  try {
    const { sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    
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
      default:
        orderBy = 'created_at';
    }
    
    const query = `SELECT * FROM registrations ORDER BY ${orderBy} ${sortOrder.toUpperCase()}`;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('데이터 조회 오류:', error);
    res.status(500).json({ error: '데이터 조회 중 오류가 발생했습니다.' });
  }
});

// 개별 항목 업데이트 API
app.put('/api/registrations/:id', async (req, res) => {
  try {
    const { id } = req.params;
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
    
    res.json({ message: '업데이트가 성공적으로 완료되었습니다.' });
  } catch (error) {
    console.error('업데이트 오류:', error);
    res.status(500).json({ error: '업데이트 중 오류가 발생했습니다.' });
  }
});

// 등록 상태 업데이트 API
app.patch('/api/registrations/:id/register', async (req, res) => {
  try {
    const { id } = req.params;
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
    
    res.json({ message: '등록 상태가 업데이트되었습니다.' });
  } catch (error) {
    console.error('등록 상태 업데이트 오류:', error);
    res.status(500).json({ error: '등록 상태 업데이트 중 오류가 발생했습니다.' });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});

// 프로세스 종료 시 PostgreSQL 연결 종료
process.on('SIGINT', () => {
  pool.end(() => {
    console.log('PostgreSQL 연결이 종료되었습니다.');
    process.exit(0);
  });
});
