import React, { useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
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
      contactDate: new Date(),
      contactMethod: '',
      contactSubMethod: '',
      contactContent: '',
      country: 'MN'
    }
  ]);

     const [message, setMessage] = useState({ type: '', text: '' });

  const countries = [
    { code: 'MN', name: '몽골' },
    { code: 'DE', name: '베를린' },
    { code: 'RO', name: '루마니아' },
    { code: 'AZ', name: '아제르바이잔' }
  ];

  const contactMethods = [
    { value: '연락', label: '연락' },
    { value: '만남', label: '만남' }
  ];

  const contactSubMethods = {
    '연락': [
      { value: '전화', label: '전화' },
      { value: '메신저', label: '메신저' }
    ],
    '만남': [
      { value: '온라인', label: '온라인' },
      { value: '오프라인', label: '오프라인' }
    ]
  };

  const handleInputChange = (index, field, value) => {
    const updatedRegistrations = [...registrations];
    updatedRegistrations[index] = {
      ...updatedRegistrations[index],
      [field]: value
    };
    setRegistrations(updatedRegistrations);
  };

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
        contactDate: new Date(),
        contactMethod: '',
        contactSubMethod: '',
        contactContent: '',
        country: 'MN'
      }
    ]);
  };

  const removeRegistration = (index) => {
    if (registrations.length > 1) {
      const updatedRegistrations = registrations.filter((_, i) => i !== index);
      setRegistrations(updatedRegistrations);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 필수 필드 검증
    const hasEmptyFields = registrations.some(reg => 
      !reg.firstName || !reg.lastName || !reg.contactMethod || !reg.contactDate
    );
    
    if (hasEmptyFields) {
      setMessage({
        type: 'error',
        text: '모든 필수 필드를 입력해주세요.'
      });
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/registrations`, {
        registrations: registrations.map(reg => ({
          ...reg,
          contactDate: format(new Date(reg.contactDate), 'yyyy-MM-dd')
        }))
      });
      
      alert(`✅ 등록이 성공적으로 완료되었습니다! (${registrations.length}개 항목) / Registration completed successfully! (${registrations.length} items)`);
      
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
        contactDate: new Date(),
        contactMethod: '',
        contactSubMethod: '',
        contactContent: '',
        country: 'MN'
      }]);
      
      setMessage({ type: '', text: '' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || '등록 중 오류가 발생했습니다.'
      });
    }
  };

  return (
    <div className="registration-form">
      <h2>등록 폼</h2>
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {registrations.map((registration, index) => (
          <div key={index} className="registration-item">
            <h3>등록 항목 {index + 1}</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>이름 *</label>
                <div className="name-inputs">
                  <input
                    type="text"
                    placeholder="성"
                    value={registration.lastName}
                    onChange={(e) => handleInputChange(index, 'lastName', e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="이름"
                    value={registration.firstName}
                    onChange={(e) => handleInputChange(index, 'firstName', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>국가 *</label>
                <select
                  value={registration.country}
                  onChange={(e) => handleInputChange(index, 'country', e.target.value)}
                  required
                >
                  {countries.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>성별</label>
                <select
                  value={registration.gender}
                  onChange={(e) => handleInputChange(index, 'gender', e.target.value)}
                >
                  <option value="">선택하세요</option>
                  <option value="남성">남성</option>
                  <option value="여성">여성</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>전화번호</label>
                <input
                  type="tel"
                  value={registration.phone}
                  onChange={(e) => handleInputChange(index, 'phone', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>이메일</label>
                <input
                  type="email"
                  value={registration.email}
                  onChange={(e) => handleInputChange(index, 'email', e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>직책</label>
                <input
                  type="text"
                  value={registration.position}
                  onChange={(e) => handleInputChange(index, 'position', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>소속</label>
                <input
                  type="text"
                  value={registration.organization}
                  onChange={(e) => handleInputChange(index, 'organization', e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>연락 날짜 *</label>
                <input
                  type="date"
                  value={registration.contactDate}
                  onChange={(e) => handleInputChange(index, 'contactDate', e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>연락 방법 *</label>
                <select
                  value={registration.contactMethod}
                  onChange={(e) => handleInputChange(index, 'contactMethod', e.target.value)}
                  required
                >
                  <option value="">선택하세요</option>
                  {contactMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {registration.contactMethod && (
              <div className="form-row">
                <div className="form-group">
                  <label>세부 방법</label>
                  <select
                    value={registration.contactSubMethod}
                    onChange={(e) => handleInputChange(index, 'contactSubMethod', e.target.value)}
                  >
                    <option value="">선택하세요</option>
                    {contactSubMethods[registration.contactMethod]?.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group full-width">
                <label>연락 내용</label>
                <textarea
                  value={registration.contactContent}
                  onChange={(e) => handleInputChange(index, 'contactContent', e.target.value)}
                  rows="3"
                  placeholder="연락 내용을 입력하세요"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={registration.isNewUser}
                    onChange={(e) => handleInputChange(index, 'isNewUser', e.target.checked)}
                  />
                  신규 사용자
                </label>
              </div>
            </div>

            {registrations.length > 1 && (
              <button
                type="button"
                onClick={() => removeRegistration(index)}
                className="remove-btn"
              >
                이 항목 삭제
              </button>
            )}
          </div>
        ))}
        
        <div className="form-actions">
          <button type="button" onClick={addRegistration} className="add-btn">
            항목 추가
          </button>
          <button type="submit" className="submit-btn">
            등록하기
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;
