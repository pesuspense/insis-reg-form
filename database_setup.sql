-- 기존 테이블 삭제 (모든 데이터와 구조 제거)
DROP TABLE IF EXISTS registrations CASCADE;

-- registrations 테이블 새로 생성
CREATE TABLE registrations (
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
    contact_content TEXT,
    country VARCHAR(10) DEFAULT 'MN',
    is_registered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 국가 코드에 대한 제약 조건 추가
ALTER TABLE registrations
  ADD CONSTRAINT check_country_code
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
CREATE TRIGGER update_registrations_updated_at
    BEFORE UPDATE ON registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 월/주차 파생 컬럼 추가
ALTER TABLE registrations
  ADD COLUMN month_num integer GENERATED ALWAYS AS (extract(month from contact_date)::int) STORED;

-- Week calculation logic updated based on ISO standard
ALTER TABLE registrations
  ADD COLUMN week_of_month integer GENERATED ALWAYS AS (
    CASE
      WHEN extract(day from contact_date) + 
           (CASE 
             WHEN extract(dow from contact_date - extract(day from contact_date)::int + 1) = 0 THEN 6
             ELSE extract(dow from contact_date - extract(day from contact_date)::int + 1) - 1
           END) <= 7 THEN 1
      WHEN extract(day from contact_date) + 
           (CASE 
             WHEN extract(dow from contact_date - extract(day from contact_date)::int + 1) = 0 THEN 6
             ELSE extract(dow from contact_date - extract(day from contact_date)::int + 1) - 1
           END) <= 14 THEN 2
      WHEN extract(day from contact_date) + 
           (CASE 
             WHEN extract(dow from contact_date - extract(day from contact_date)::int + 1) = 0 THEN 6
             ELSE extract(dow from contact_date - extract(day from contact_date)::int + 1) - 1
           END) <= 21 THEN 3
      WHEN extract(day from contact_date) + 
           (CASE 
             WHEN extract(dow from contact_date - extract(day from contact_date)::int + 1) = 0 THEN 6
             ELSE extract(dow from contact_date - extract(day from contact_date)::int + 1) - 1
           END) <= 28 THEN 4
      ELSE 5
    END
  ) STORED;

-- month_week_label format and calculation logic updated
ALTER TABLE registrations
  ADD COLUMN month_week_label text GENERATED ALWAYS AS (
    (extract(month from contact_date)::int)::text || '-' || (
      CASE
        WHEN extract(day from contact_date) + 
             (CASE 
               WHEN extract(dow from contact_date - extract(day from contact_date)::int + 1) = 0 THEN 6
               ELSE extract(dow from contact_date - extract(day from contact_date)::int + 1) - 1
             END) <= 7 THEN 1
        WHEN extract(day from contact_date) + 
             (CASE 
               WHEN extract(dow from contact_date - extract(day from contact_date)::int + 1) = 0 THEN 6
               ELSE extract(dow from contact_date - extract(day from contact_date)::int + 1) - 1
             END) <= 14 THEN 2
        WHEN extract(day from contact_date) + 
             (CASE 
               WHEN extract(dow from contact_date - extract(day from contact_date)::int + 1) = 0 THEN 6
               ELSE extract(dow from contact_date - extract(day from contact_date)::int + 1) - 1
             END) <= 21 THEN 3
        WHEN extract(day from contact_date) + 
             (CASE 
               WHEN extract(dow from contact_date - extract(day from contact_date)::int + 1) = 0 THEN 6
               ELSE extract(dow from contact_date - extract(day from contact_date)::int + 1) - 1
             END) <= 28 THEN 4
        ELSE 5
      END
    )::text
  ) STORED;

-- 테스트 데이터 삽입 (2025년 8월 4, 5, 6일)
INSERT INTO registrations (full_name, is_new_user, contact_date, contact_method, contact_sub_method, country) VALUES
('테스트1', true, '2025-08-04', '연락', '전화', 'MN'),
('테스트2', true, '2025-08-05', '연락', '메신저', 'DE'),
('테스트3', false, '2025-08-06', '만남', '온라인', 'RO');

SELECT 'registrations 테이블이 성공적으로 생성되었습니다.' as message;
