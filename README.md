# INSIS Contact&Meeting Registration Form

INSIS Contact&Meeting Registration Form은 연락 및 만남 등록을 위한 웹 애플리케이션입니다.

## 주요 기능

- **다중 등록**: 한 번에 여러 항목을 등록할 수 있습니다
- **동적 폼**: 연락방법에 따라 세부 옵션이 동적으로 변경됩니다
- **관리 페이지**: 등록된 데이터를 조회, 정렬, 수정할 수 있습니다
- **영문 지원**: 모든 라벨과 메시지에 영문 번역이 포함되어 있습니다
- **반응형 디자인**: 모바일과 데스크톱에서 모두 사용 가능합니다

## 기술 스택

### Frontend
- React 18
- Axios (HTTP 클라이언트)
- React DatePicker (날짜 선택)
- date-fns (날짜 유틸리티)
- CSS3 (스타일링)

### Backend
- Node.js
- Express.js
- PostgreSQL (데이터베이스)
- pg (PostgreSQL 클라이언트)
- CORS (Cross-Origin Resource Sharing)

### 배포
- Vercel (프론트엔드 및 백엔드)
- Supabase (PostgreSQL 클라우드 데이터베이스)

## 설치 및 실행

### 로컬 개발 환경

1. **저장소 클론**
   ```bash
   git clone <repository-url>
   cd INSIS_REG_FORM
   ```

2. **의존성 설치**
   ```bash
   npm run install-all
   ```

3. **Supabase 설정**
   - Supabase에서 프로젝트 생성
   - 데이터베이스 테이블 생성 (SQL Editor에서 실행)
   - 연결 문자열 복사
   - `server/.env` 파일 생성:
     ```
     DATABASE_URL=your_supabase_connection_string
     ```

4. **개발 서버 실행**
   ```bash
   npm run dev
   ```

### Vercel 배포

1. **Vercel CLI 설치**
   ```bash
   npm i -g vercel
   ```

2. **Supabase 설정**
   - Supabase에서 프로젝트 생성
   - 데이터베이스 테이블 생성 (SQL Editor에서 실행)
   - 연결 문자열 복사

3. **Vercel 환경 변수 설정**
   ```bash
   vercel env add DATABASE_URL
   # Supabase 연결 문자열 입력
   ```

4. **배포**
   ```bash
   vercel --prod
   ```

5. **config.js 업데이트**
   - `client/src/config.js`에서 `your-vercel-app.vercel.app`을 실제 Vercel 도메인으로 변경

## 프로젝트 구조

```
INSIS_REG_FORM/
├── client/                 # React 프론트엔드
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── RegistrationForm.js
│   │   │   └── AdminPage.js
│   │   ├── config.js
│   │   └── index.js
│   └── package.json
├── server/                 # Node.js 백엔드
│   ├── index.js
│   └── package.json
├── vercel.json            # Vercel 배포 설정
└── package.json
```

## API 엔드포인트

### POST /api/registrations
등록 데이터 저장
```json
{
  "registrations": [
    {
      "firstName": "홍",
      "lastName": "길동",
      "isNewUser": true,
      "gender": "남성",
      "phone": "010-1234-5678",
      "email": "hong@example.com",
      "position": "회장",
      "organization": "IPYG",
      "contactDate": "2024-01-15",
      "contactMethod": "연락",
      "contactSubMethod": "전화",
      "contactContent": "회의 일정 조율"
    }
  ]
}
```

### GET /api/registrations
등록 데이터 조회 (정렬 지원)
```
GET /api/registrations?sortBy=createdAt&sortOrder=desc
```

### PUT /api/registrations/:id
개별 항목 수정

### PATCH /api/registrations/:id/register
등록 상태 업데이트

## 데이터베이스 스키마

```javascript
{
  fullName: String (required),
  isNewUser: Boolean (required),
  gender: String,
  phone: String,
  email: String,
  position: String,
  organization: String,
  contactDate: String (required),
  contactMethod: String (required),
  contactSubMethod: String (required),
  contactContent: String,
  isRegistered: Boolean (default: false),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

## 주요 기능 설명

### 1. 동적 연락방법 카운팅
- "연락"과 "만남" 각각 별도로 카운트
- h3 태그에 "연락 (Contact) 1", "만남 (Meeting) 1" 형식으로 표시

### 2. 조건부 필드 표시
- 신규 사용자 선택 시에만 추가 정보 입력 필드 표시
- 성별, 연락처, 메일, 직책, 단체명 필수 입력

### 3. 관리 페이지 기능
- 이름, 날짜, 연락방법, 등록여부로 정렬
- 각 항목별 수정 기능
- 등록 상태 체크박스로 토글

### 4. 알림 시스템
- 성공/오류 메시지 자동 표시
- 3-5초 후 자동 제거
- 한글/영문 동시 표시

## 환경 변수

### 개발 환경
- `DATABASE_URL`: Supabase PostgreSQL 연결 문자열
- `REACT_APP_OPENAI_API_KEY`: OpenAI API 키 (ChatGPT 번역 기능용, 선택사항)

### 프로덕션 환경 (Vercel)
- `DATABASE_URL`: Supabase PostgreSQL 연결 문자열
- `REACT_APP_OPENAI_API_KEY`: OpenAI API 키 (ChatGPT 번역 기능용, 선택사항)

### ChatGPT 번역 기능 설정 (선택사항)

1. **OpenAI API 키 발급**
   - [OpenAI Platform](https://platform.openai.com/api-keys)에서 API 키 생성
   - 계정에 충분한 크레딧이 있는지 확인

2. **환경변수 설정**
   - 개발 환경: `client/.env` 파일에 `REACT_APP_OPENAI_API_KEY=your_api_key_here` 추가
   - 프로덕션 환경: Vercel 대시보드에서 환경변수 추가

3. **번역 서비스 선택**
   - ChatGPT: 고품질, API 키 필요, 기본값 (오류 시 MyMemory로 자동 전환)
   - MyMemory: 무료, 500자 제한 (fallback 옵션)

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
