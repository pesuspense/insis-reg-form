-- registrations 테이블 생성
CREATE TABLE IF NOT EXISTS registrations (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    is_new_user BOOLEAN NOT NULL,
    gender VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    position VARCHAR(100),
    organization VARCHAR(255),
    contact_date DATE NOT NULL,
    contact_method VARCHAR(50) NOT NULL,
    contact_method_en VARCHAR(50),
    contact_sub_method VARCHAR(50),
    contact_sub_method_en VARCHAR(50),
    contact_content TEXT,
    is_registered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- updated_at 자동 업데이트를 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_registrations_updated_at 
    BEFORE UPDATE ON registrations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 테이블 생성 확인
SELECT 'registrations 테이블이 성공적으로 생성되었습니다.' as message;
