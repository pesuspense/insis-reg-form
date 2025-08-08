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
    contact_sub_method VARCHAR(50),
    contact_method_en VARCHAR(100),
    contact_sub_method_en VARCHAR(100),
    contact_content TEXT,
    country VARCHAR(10) DEFAULT 'MN',
    is_registered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 국가 코드에 대한 제약 조건 추가
ALTER TABLE registrations
  ADD CONSTRAINT IF NOT EXISTS check_country_code
  CHECK (country IN ('MN', 'DE', 'RO', 'AZ'));

-- updated_at 자동 업데이트를 위한 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
DROP TRIGGER IF EXISTS update_registrations_updated_at ON registrations;
CREATE TRIGGER update_registrations_updated_at
    BEFORE UPDATE ON registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

SELECT 'registrations 테이블이 성공적으로 생성되었습니다.' as message;

-- 월/주차 파생 컬럼 추가 (이미 존재 시 건너뜀)
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS month_num integer GENERATED ALWAYS AS (extract(month from contact_date)::int) STORED;

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS week_of_month integer GENERATED ALWAYS AS (((extract(day from contact_date)::int - 1) / 7) + 1) STORED;

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS month_week_label text GENERATED ALWAYS AS (
    concat(extract(month from contact_date)::int, '월 ', (((extract(day from contact_date)::int - 1) / 7) + 1), '주차')
  ) STORED;

-- 국가 컬럼 추가
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS country VARCHAR(10) DEFAULT 'MN';

-- 국가 코드에 대한 제약 조건 추가
ALTER TABLE registrations
  ADD CONSTRAINT IF NOT EXISTS check_country_code
  CHECK (country IN ('MN', 'DE', 'RO', 'AZ'));
