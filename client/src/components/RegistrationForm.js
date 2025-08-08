import React, { useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import API_BASE_URL from '../config';

const RegistrationForm = () => {
  const [registrations, setRegistrations] = useState([
    {
      firstName: '',
      lastName: '',
      isNewUser: false,
      gender: '',
      phone: '',
      email: '',
      position: '',
      organization: '',
      contactDate: new Date().toISOString().split('T')[0],
      contactMethod: '',
      contactSubMethod: '',
      contactContent: '',
      country: 'MN'
    }
  ]);

  const [message, setMessage] = useState({ type: '', text: '' });

  const countries = [
    { code: 'MN', name: '몽골(MN)' },
    { code: 'DE', name: '베를린(DE)' },
    { code: 'RO', name: '루마니아(RO)' },
    { code: 'AZ', name: '아제르바이잔(AZ)' }
  ];

  // 연락방법별 카운트 계산
  const getContactCount = (contactMethod, currentIndex) => {
    if (!contactMethod) return currentIndex + 1;
    
    let count = 1;
    for (let i = 0; i < currentIndex; i++) {
      if (registrations[i].contactMethod === contactMethod) {
        count++;
      }
    }
    return count;
  };

  // 새로운 등록 항목 추가
  const addRegistration = () => {
    setRegistrations([
      ...registrations,
      {
        firstName: '',
        lastName: '',
        isNewUser: false,
        gender: '',
        phone: '',
        email: '',
        position: '',
        organization: '',
        contactDate: new Date().toISOString().split('T')[0],
        contactMethod: '',
        contactSubMethod: '',
        contactContent: '',
        country: 'MN'
      }
    ]);
  };

  // 등록 항목 제거
  const removeRegistration = (index) => {
    if (registrations.length > 1) {
      const newRegistrations = registrations.filter((_, i) => i !== index);
      setRegistrations(newRegistrations);
    }
  };

  // 입력 필드 업데이트
  const updateRegistration = (index, field, value) => {
    const newRegistrations = [...registrations];
    newRegistrations[index] = {
      ...newRegistrations[index],
      [field]: value
    };

    // 연락방법이 변경되면 하위 방법 초기화
    if (field === 'contactMethod') {
      newRegistrations[index].contactSubMethod = '';
    }

    setRegistrations(newRegistrations);
  };

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 유효성 검사
    const isValid = registrations.every((reg, index) => {
      if (!reg.firstName || !reg.lastName || !reg.contactMethod || !reg.contactSubMethod) {
        setMessage({ type: 'error', text: `${index + 1}번 항목의 필수 필드를 모두 입력해주세요.` });
        return false;
      }
      
      if (reg.isNewUser) {
        if (!reg.gender || !reg.phone || !reg.email || !reg.position || !reg.organization) {
          setMessage({ type: 'error', text: `${index + 1}번 항목의 신규 사용자 정보를 모두 입력해주세요.` });
          return false;
        }
      }
      
      return true;
    });

    if (!isValid) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/registrations`, {
        registrations: registrations.map(reg => ({
          ...reg,
          contactDate: format(new Date(reg.contactDate), 'yyyy-MM-dd')
        }))
      });

      // 성공 알림(alert)
      const savedCount = response?.data?.count ?? registrations.length;
      window.alert(`등록이 성공적으로 완료되었습니다! (${savedCount}개 항목)`);

      setMessage({ 
        type: 'success', 
        text: `✅ 등록이 성공적으로 완료되었습니다! (${registrations.length}개 항목) / Registration completed successfully! (${registrations.length} items)` 
      });
      
      // 5초 후 성공 메시지 자동 제거
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      
      // 폼 초기화
      setRegistrations([{
        firstName: '',
        lastName: '',
        isNewUser: false,
        gender: '',
        phone: '',
        email: '',
        position: '',
        organization: '',
        contactDate: new Date().toISOString().split('T')[0],
        contactMethod: '',
        contactSubMethod: '',
        contactContent: '',
        country: 'MN'
      }]);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || '등록 중 오류가 발생했습니다.' 
      });
    }
  };

  // 연락방법에 따른 하위 옵션
  const getContactSubOptions = (contactMethod) => {
    if (contactMethod === '연락') {
      return ['전화 (Phone)', '메신저 (Messenger)'];
    } else if (contactMethod === '만남') {
      return ['온라인 (Online)', '오프라인 (Offline)'];
    }
    return [];
  };

  // 연락방법에 따른 세부 방법 값 매핑
  const getContactSubMethodValue = (contactMethod, displayText) => {
    if (contactMethod === '연락') {
      if (displayText.includes('전화')) return '전화';
      if (displayText.includes('메신저')) return '메신저';
    } else if (contactMethod === '만남') {
      if (displayText.includes('온라인')) return '온라인';
      if (displayText.includes('오프라인')) return '오프라인';
    }
    return displayText;
  };

  return (
    <div className="form-container">
      <div className="title-container">
        <h1 className="form-title">입력폼 (Input Form)</h1>
      </div>
      
      {message.text && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {registrations.map((registration, index) => (
          <div key={index} className="registration-item">
            <h3>
              {registration.contactMethod ? 
                `${registration.contactMethod} (${registration.contactMethod === '연락' ? 'Contact' : 'Meeting'}) ${getContactCount(registration.contactMethod, index)}` : 
                `Contact ${index + 1}`
              }
            </h3>
            
            {/* 이름 입력 */}
            <div className="form-row">
              <div className="form-col">
                <label htmlFor={`firstName-${index}`}>이름 (First Name) *</label>
                <input
                  type="text"
                  id={`firstName-${index}`}
                  value={registration.firstName}
                  onChange={(e) => updateRegistration(index, 'firstName', e.target.value)}
                  required
                />
              </div>
              <div className="form-col">
                <label htmlFor={`lastName-${index}`}>성 (Last Name) *</label>
                <input
                  type="text"
                  id={`lastName-${index}`}
                  value={registration.lastName}
                  onChange={(e) => updateRegistration(index, 'lastName', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 국가 선택 */}
            <div className="form-row">
              <div className="form-col">
                <label htmlFor={`country-${index}`}>국가 (Country) *</label>
                <select
                  id={`country-${index}`}
                  value={registration.country}
                  onChange={(e) => updateRegistration(index, 'country', e.target.value)}
                  required
                >
                  <option value="">선택하세요 (Please select)</option>
                  {countries.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 기존/신규 선택 */}
            <div className="form-group">
              <label>사용자 유형 (User Type) *</label>
              <select
                value={registration.isNewUser ? 'new' : 'existing'}
                onChange={(e) => updateRegistration(index, 'isNewUser', e.target.value === 'new')}
                required
              >
                <option value="existing">기존 (Existing)</option>
                <option value="new">신규 (New)</option>
              </select>
            </div>

            {/* 신규 사용자일 때만 표시되는 필드들 */}
            {registration.isNewUser && (
              <div className="conditional-fields">
                <h4>신규 사용자 정보 (New User Information)</h4>
                
                <div className="form-group">
                  <label htmlFor={`gender-${index}`}>성별 (Gender) *</label>
                  <select
                    id={`gender-${index}`}
                    value={registration.gender}
                    onChange={(e) => updateRegistration(index, 'gender', e.target.value)}
                    required
                  >
                    <option value="">선택하세요 (Please select)</option>
                    <option value="남성">남성 (Male)</option>
                    <option value="여성">여성 (Female)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor={`phone-${index}`}>연락처 (Phone) *</label>
                  <input
                    type="tel"
                    id={`phone-${index}`}
                    value={registration.phone}
                    onChange={(e) => updateRegistration(index, 'phone', e.target.value)}
                    placeholder="010-1234-5678"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`email-${index}`}>메일 (Email) *</label>
                  <input
                    type="email"
                    id={`email-${index}`}
                    value={registration.email}
                    onChange={(e) => updateRegistration(index, 'email', e.target.value)}
                    placeholder="example@email.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`position-${index}`}>직책 (Position) *</label>
                  <input
                    type="text"
                    id={`position-${index}`}
                    value={registration.position}
                    onChange={(e) => updateRegistration(index, 'position', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`organization-${index}`}>단체명 (Organization) *</label>
                  <input
                    type="text"
                    id={`organization-${index}`}
                    value={registration.organization}
                    onChange={(e) => updateRegistration(index, 'organization', e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* 날짜 선택 */}
            <div className="form-group">
              <label htmlFor={`contactDate-${index}`}>날짜 (Date) *</label>
              <DatePicker
                id={`contactDate-${index}`}
                selected={registration.contactDate ? new Date(registration.contactDate) : null}
                onChange={(date) => updateRegistration(index, 'contactDate', date ? date.toISOString().split('T')[0] : '')}
                dateFormat="yyyy-MM-dd"
                placeholderText="날짜를 선택하세요 (Select date)"
                className="form-control"
                required
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                maxDate={new Date()}
              />
            </div>

            {/* 연락방법 선택 */}
            <div className="form-row">
              <div className="form-col">
                <label htmlFor={`contactMethod-${index}`}>연락방법 (Contact Method) *</label>
                <select
                  id={`contactMethod-${index}`}
                  value={registration.contactMethod}
                  onChange={(e) => updateRegistration(index, 'contactMethod', e.target.value)}
                  required
                >
                  <option value="">선택하세요 (Please select)</option>
                  <option value="연락">연락 (Contact)</option>
                  <option value="만남">만남 (Meeting)</option>
                </select>
              </div>
              <div className="form-col">
                <label htmlFor={`contactSubMethod-${index}`}>세부 방법 (Detail Method) *</label>
                <select
                  id={`contactSubMethod-${index}`}
                  value={registration.contactSubMethod ? 
                    (registration.contactMethod === '연락' ? 
                      (registration.contactSubMethod === '전화' ? '전화 (Phone)' : '메신저 (Messenger)') :
                      (registration.contactMethod === '만남' ? 
                        (registration.contactSubMethod === '온라인' ? '온라인 (Online)' : '오프라인 (Offline)') : 
                        registration.contactSubMethod)
                    ) : ''
                  }
                  onChange={(e) => {
                    const selectedValue = getContactSubMethodValue(registration.contactMethod, e.target.value);
                    updateRegistration(index, 'contactSubMethod', selectedValue);
                  }}
                  required
                  disabled={!registration.contactMethod}
                >
                  <option value="">선택하세요 (Please select)</option>
                  {getContactSubOptions(registration.contactMethod).map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 연락내용 */}
            <div className="form-group">
              <label htmlFor={`contactContent-${index}`}>연락내용 (Contact Content)</label>
              <textarea
                id={`contactContent-${index}`}
                value={registration.contactContent}
                onChange={(e) => updateRegistration(index, 'contactContent', e.target.value)}
                placeholder="연락 내용을 입력하세요... (Enter contact content...)"
              />
            </div>

            {/* 등록 항목 제거 버튼 */}
            {registrations.length > 1 && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => removeRegistration(index)}
              >
                이 항목 삭제 (Delete This Item)
              </button>
            )}
          </div>
        ))}

        <div className="button-group">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={addRegistration}
          >
            입력란 추가 (Add Form)
          </button>
          <button
            type="submit"
            className="btn btn-success"
          >
            등록하기 (Submit)
          </button>
        </div>

        {/* 주의사항 */}
        <div className="notice-section">
          <h4>주의사항 (Important Notes)</h4>
          <div className="notice-content">
            <p>
              <strong>1.</strong> 성과 이름을 정확히 입력하지 않으면(오타, 중복이름 등) 인사 구분에 어려움이 있으니 잘 확인해서 적어주세요.
              <br />
              <em>Please ensure accurate entry of last name and first name (typos, duplicate names, etc.) as incorrect information may cause difficulties in personal identification.</em>
            </p>
            <p>
              <strong>2.</strong> 애매하거나 궁금한 부분은 문의주세요.
              <br />
              <em>Please contact us if you have any unclear or questionable matters.</em>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;