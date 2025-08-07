const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/insis-reg-form';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB에 연결되었습니다.');
})
.catch((err) => {
  console.error('MongoDB 연결 오류:', err.message);
});

// Registration 스키마 정의
const registrationSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  isNewUser: {
    type: Boolean,
    required: true
  },
  gender: String,
  phone: String,
  email: String,
  position: String,
  organization: String,
  contactDate: {
    type: String,
    required: true
  },
  contactMethod: {
    type: String,
    required: true
  },
  contactSubMethod: {
    type: String,
    required: true
  },
  contactContent: String,
  isRegistered: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Registration = mongoose.model('Registration', registrationSchema);

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
      
      const newRegistration = new Registration({
        fullName,
        isNewUser: registration.isNewUser,
        gender: registration.gender || null,
        phone: registration.phone || null,
        email: registration.email || null,
        position: registration.position || null,
        organization: registration.organization || null,
        contactDate: registration.contactDate,
        contactMethod: registration.contactMethod,
        contactSubMethod: registration.contactSubMethod,
        contactContent: registration.contactContent || null,
        isRegistered: false
      });
      
      return newRegistration.save();
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
    const { sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    let sortObject = {};
    switch (sortBy) {
      case 'fullName':
        sortObject.fullName = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'contactDate':
        sortObject.contactDate = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'contactMethod':
        sortObject.contactMethod = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'isRegistered':
        sortObject.isRegistered = sortOrder === 'asc' ? 1 : -1;
        break;
      default:
        sortObject.createdAt = sortOrder === 'asc' ? 1 : -1;
    }
    
    const registrations = await Registration.find().sort(sortObject);
    res.json(registrations);
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
    
    const updatedRegistration = await Registration.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedRegistration) {
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
    
    const updatedRegistration = await Registration.findByIdAndUpdate(
      id,
      { isRegistered },
      { new: true }
    );
    
    if (!updatedRegistration) {
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

// 프로세스 종료 시 MongoDB 연결 종료
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB 연결이 종료되었습니다.');
    process.exit(0);
  });
});
