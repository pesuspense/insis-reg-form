import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import API_BASE_URL from '../config';

const AdminPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [adminAuthorized, setAdminAuthorized] = useState(false);
  const [contentModal, setContentModal] = useState({ open: false, text: '', title: '' });
  const [editModal, setEditModal] = useState({ open: false, data: null });
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedMonthWeek, setSelectedMonthWeek] = useState('');
  const [selectedContactMethod, setSelectedContactMethod] = useState('');
  const [monthWeekOptions, setMonthWeekOptions] = useState([]);

  const countries = [
    { code: '', name: '전체' },
    { code: 'MN', name: '몽골(MN)' },
    { code: 'DE', name: '베를린(DE)' },
    { code: 'RO', name: '루마니아(RO)' },
    { code: 'AZ', name: '아제르바이잔(AZ)' }
  ];

  // contactDate(ISO)로부터 "n-m" 라벨 계산
  const computeMonthWeekLabel = (dateString) => {
    try {
      const d = parseISO(dateString);
      const month = d.getMonth() + 1;
      const day = d.getDate();
      
      // 주차 계산 수정
      let week;
      if (day <= 7) week = 1;
      else if (day <= 14) week = 2;
      else if (day <= 21) week = 3;
      else if (day <= 28) week = 4;
      else week = 5;
      
      return `${month}-${week}`;
    } catch (e) {
      return '';
    }
  };

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        sortBy,
        sortOrder,
        ...(selectedCountry && { country: selectedCountry }),
        ...(selectedMonthWeek && { monthWeek: selectedMonthWeek }),
        ...(selectedContactMethod && { contactMethod: selectedContactMethod })
      });
      
      const response = await axios.get(`${API_BASE_URL}/registrations?${params}`);
      
      // API 응답 필드를 camelCase로 변환
      const transformedData = response.data.map(item => ({
        id: item.id,
        fullName: item.full_name,
        isNewUser: item.is_new_user,
        gender: item.gender,
        phone: item.phone,
        email: item.email,
        position: item.position,
        organization: item.organization,
        contactDate: item.contact_date,
        contactMethod: item.contact_method,
        contactSubMethod: item.contact_sub_method,
        contactContent: item.contact_content,
        isRegistered: item.is_registered,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        country: item.country,
        monthWeekLabel: item.month_week_label ?? computeMonthWeekLabel((item.contact_date ?? item.contactDate) || ''),
      }));
      
      setRegistrations(transformedData);
      
      // 월/주차 옵션 업데이트
      const uniqueMonthWeeks = [...new Set(transformedData.map(item => item.monthWeekLabel).filter(Boolean))];
      setMonthWeekOptions(uniqueMonthWeeks.sort());
    } catch (error) {
      setMessage({ type: 'error', text: '데이터 로드 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterChange = async (id, isRegistered) => {
    if (!adminAuthorized) {
      const password = prompt('관리자 비밀번호를 입력하세요:');
      if (password !== '[!@light12]') {
        alert('비밀번호가 올바르지 않습니다.');
        return;
      }
      setAdminAuthorized(true);
    }

    try {
      await axios.patch(`${API_BASE_URL}/registrations/${id}/register`, {
        isRegistered
      });
      
      setRegistrations(prev => 
        prev.map(reg => 
          reg.id === id ? { ...reg, isRegistered } : reg
        )
      );
      
      setMessage({ type: 'success', text: '등록 상태가 업데이트되었습니다.' });
    } catch (error) {
      setMessage({ type: 'error', text: '상태 업데이트 중 오류가 발생했습니다.' });
    }
  };

  const startEdit = (registration) => {
    setEditingId(registration.id);
    setEditForm({
      ...registration,
      contactDate: new Date(registration.contactDate)
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    try {
      const updateData = {
        ...editForm,
        contactDate: format(editForm.contactDate, 'yyyy-MM-dd')
      };
      
             await axios.put(`${API_BASE_URL}/registrations/${editingId}`, updateData);
             setMessage({ 
         type: 'success', 
         text: '✅ 수정이 완료되었습니다! / Edit completed successfully!' 
       });
       
       // 3초 후 성공 메시지 자동 제거
       setTimeout(() => {
         setMessage({ type: '', text: '' });
       }, 3000);
      setEditingId(null);
      setEditForm({});
      loadRegistrations();
    } catch (error) {
      setMessage({ type: 'error', text: '수정 중 오류가 발생했습니다.' });
    }
  };

  const updateEditForm = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  const openContentModal = (text, title) => {
    setContentModal({ open: true, text, title });
  };

  const closeContentModal = () => {
    setContentModal({ open: false, text: '', title: '' });
  };

  const openEditModal = (registration) => {
    setEditModal({ 
      open: true, 
      data: {
        ...registration,
        contactDate: new Date(registration.contactDate)
      }
    });
  };

  const closeEditModal = () => {
    setEditModal({ open: false, data: null });
  };

  const updateEditModalData = (field, value) => {
    setEditModal(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value
      }
    }));
  };

  const saveEditModal = async () => {
    try {
      const updateData = {
        ...editModal.data,
        contactDate: format(editModal.data.contactDate, 'yyyy-MM-dd')
      };
      
      await axios.put(`${API_BASE_URL}/registrations/${editModal.data.id}`, updateData);
      setMessage({ 
        type: 'success', 
        text: '✅ 수정이 완료되었습니다! / Edit completed successfully!' 
      });
      
      // 3초 후 성공 메시지 자동 제거
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      
      closeEditModal();
      loadRegistrations();
    } catch (error) {
      setMessage({ type: 'error', text: '수정 중 오류가 발생했습니다.' });
    }
  };

  const exportToExcel = () => {
    const headers = [
      'ID', '이름', '국가', '성별', '전화번호', '이메일', '직책', '소속',
      '연락날짜', '월/주차', '연락방법', '세부방법', '연락내용', '신규사용자', '등록여부', '생성일'
    ];
    
    const data = registrations.map(reg => [
      reg.id,
      reg.fullName,
      reg.country,
      reg.gender || '',
      reg.phone || '',
      reg.email || '',
      reg.position || '',
      reg.organization || '',
      reg.contactDate ? format(parseISO(reg.contactDate), 'yyyy-MM-dd') : '',
      reg.monthWeekLabel || '',
      reg.contactMethod || '',
      reg.contactSubMethod || '',
      reg.contactContent || '',
      reg.isNewUser ? 'Y' : 'N',
      reg.isRegistered ? 'Y' : 'N',
      reg.createdAt ? format(parseISO(reg.createdAt), 'yyyy-MM-dd HH:mm:ss') : ''
    ]);
    
    const csvContent = [headers, ...data]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `registrations_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getContactMethodEn = (method) => {
    switch (method) {
      case '연락': return 'Contact';
      case '만남': return 'Meeting';
      default: return method || '';
    }
  };

  const getContactSubMethodEn = (subMethod) => {
    switch (subMethod) {
      case '전화': return 'Phone';
      case '메신저': return 'Messenger';
      case '온라인': return 'Online';
      case '오프라인': return 'Offline';
      default: return subMethod || '';
    }
  };

  const getUserTypeEn = (isNewUser) => {
    return isNewUser ? 'New' : 'Existing';
  };

  const getCountryName = (code) => {
    const country = countries.find(c => c.code === code);
    if (country && country.code) {
      const name = country.name.replace(`(${country.code})`, '').trim();
      return `${name}\n(${country.code})`;
    }
    return code;
  };

  useEffect(() => {
    loadRegistrations();
  }, [sortBy, sortOrder, selectedCountry, selectedMonthWeek, selectedContactMethod]);

  const SortableHeader = ({ children, field }) => (
    <th onClick={() => handleSort(field)} style={{ cursor: 'pointer' }}>
      {children}
      {sortBy === field && (
        <span className="sort-arrow" style={{ marginLeft: '5px' }}>
          {sortOrder === 'ASC' ? '▲' : '▼'}
        </span>
      )}
    </th>
  );

  const HeaderLabel = ({ ko, en }) => (
    <div className="header-label">
      <span className="ko">{ko}</span>
      <span className="en">{en}</span>
    </div>
  );

  return (
    <div className="admin-page">
      <h2>관리자 페이지</h2>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="admin-controls">
        <div className="filter-section">
          <div className="filter-group">
            <label>국가 (Country)</label>
            <select 
              value={selectedCountry} 
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="filter-select"
            >
              {countries.map(country => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>월/주차 (Month/Week)</label>
            <select 
              value={selectedMonthWeek} 
              onChange={(e) => setSelectedMonthWeek(e.target.value)}
              className="filter-select"
            >
              <option value="">전체 주차</option>
              {monthWeekOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>연락방법 (Method)</label>
            <select 
              value={selectedContactMethod} 
              onChange={(e) => setSelectedContactMethod(e.target.value)}
              className="filter-select"
            >
              <option value="">전체 연락방법</option>
              <option value="연락">연락 (Contact)</option>
              <option value="만남">만남 (Meeting)</option>
            </select>
          </div>
        </div>

        <div className="action-buttons">
          <button onClick={loadRegistrations} className="refresh-btn">
            새로고침
          </button>
          <button onClick={exportToExcel} className="export-btn">
            엑셀 다운로드
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th><HeaderLabel ko="월/주차" en="Month/Week" /></th>
                <SortableHeader field="fullName"><HeaderLabel ko="이름" en="Name" /></SortableHeader>
                <SortableHeader field="country"><HeaderLabel ko="국가" en="Country" /></SortableHeader>
                <SortableHeader field="contactDate">
                   <span className="no-wrap">
                     <HeaderLabel ko="날짜" en="Date" />
                     <span className="sort-arrow">▼</span>
                   </span>
                 </SortableHeader>
                <SortableHeader field="contactMethod"><HeaderLabel ko="연락방법" en="Contact Method" /></SortableHeader>
                <th><HeaderLabel ko="세부방법" en="Detail Method" /></th>
                <th><HeaderLabel ko="연락내용" en="Content" /></th>
                <th><HeaderLabel ko="사용자 유형" en="User Type" /></th>
                <SortableHeader field="isRegistered"><HeaderLabel ko="등록여부" en="Registered" /></SortableHeader>
                <th><HeaderLabel ko="작업" en="Actions" /></th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((registration) => (
                <tr key={registration.id} className={registration.isRegistered ? 'registered' : 'not-registered'}>
                  {editingId === registration.id ? (
                  // 수정 모드
                  <>
                    <td className="no-wrap">{registration.monthWeekLabel}</td>
                    <td>
                      <input
                        type="text"
                        value={editForm.fullName}
                        onChange={(e) => updateEditForm('fullName', e.target.value)}
                        className="edit-input"
                      />
                    </td>
                    <td>
                      <select
                        value={editForm.contactMethod}
                        onChange={(e) => updateEditForm('contactMethod', e.target.value)}
                        className="edit-input"
                      >
                        <option value="연락">연락 (Contact)</option>
                        <option value="만남">만남 (Meeting)</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={editForm.contactSubMethod}
                        onChange={(e) => updateEditForm('contactSubMethod', e.target.value)}
                        className="edit-input"
                      >
                        {editForm.contactMethod === '연락' ? (
                          <>
                            <option value="전화">전화 (Phone)</option>
                            <option value="메신저">메신저 (Messenger)</option>
                          </>
                        ) : (
                          <>
                            <option value="온라인">온라인 (Online)</option>
                            <option value="오프라인">오프라인 (Offline)</option>
                          </>
                        )}
                      </select>
                    </td>
                    <td>
                      <textarea
                        value={editForm.contactContent || ''}
                        onChange={(e) => updateEditForm('contactContent', e.target.value)}
                        className="edit-input"
                        rows="2"
                      />
                    </td>
                    <td>
                      <select
                        value={editForm.isNewUser ? 'new' : 'existing'}
                        onChange={(e) => updateEditForm('isNewUser', e.target.value === 'new')}
                        className="edit-input"
                      >
                        <option value="existing">기존 (Existing)</option>
                        <option value="new">신규 (New)</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={editForm.isRegistered}
                        onChange={(e) => updateEditForm('isRegistered', e.target.checked)}
                      />
                    </td>
                    <td>
                      <button onClick={saveEdit} className="btn btn-success btn-sm">
                        저장 (Save)
                      </button>
                      <button onClick={cancelEdit} className="btn btn-secondary btn-sm">
                        취소 (Cancel)
                      </button>
                    </td>
                  </>
                ) : (
                  // 보기 모드
                  <>
                    <td className="no-wrap">{registration.monthWeekLabel}</td>
                    <td>{registration.fullName}</td>
                    <td className="country-cell">{getCountryName(registration.country)}</td>
                    <td className="no-wrap">{format(parseISO(registration.contactDate), 'yyyy-MM-dd')}</td>
                    <td>
                      <div className="header-label">
                        <span className="ko">{registration.contactMethod}</span>
                        <span className="en">{getContactMethodEn(registration.contactMethod)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="header-label">
                        <span className="ko">{registration.contactSubMethod}</span>
                        <span className="en">{getContactSubMethodEn(registration.contactSubMethod)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="content-preview">
                        {registration.contactContent}
                        {registration.contactContent && registration.contactContent.length > 50 && (
                          <button 
                            className="btn-more"
                            onClick={() => openContentModal(registration.contactContent, '연락내용')}
                          >
                            more
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="header-label">
                        <span className="ko">{registration.isNewUser ? '신규' : '기존'}</span>
                        <span className="en">{getUserTypeEn(registration.isNewUser)}</span>
                      </div>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={registration.isRegistered}
                        onChange={(e) => handleRegisterChange(registration.id, e.target.checked)}
                      />
                      <span className="status-text header-label">
                        <span className="ko">{registration.isRegistered ? '등록됨' : '미등록'}</span>
                        <span className="en">{registration.isRegistered ? 'Registered' : 'Not Registered'}</span>
                      </span>
                    </td>
                    <td>
                      <button onClick={() => openEditModal(registration)} className="btn btn-primary btn-sm">
                        수정 (Edit)
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      )}

      {contentModal.open && (
        <div className="modal-overlay" onClick={closeContentModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{contentModal.title}</h3>
              <button onClick={closeContentModal} className="close-btn">&times;</button>
            </div>
            <div className="modal-body">
              <pre>{contentModal.text}</pre>
            </div>
          </div>
        </div>
      )}

      {editModal.open && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>수정 (Edit)</h3>
              <button onClick={closeEditModal} className="close-btn">&times;</button>
            </div>
            <div className="modal-body">
              {editModal.data && (
                <div className="edit-form">
                  <div className="form-row">
                    <div className="form-col">
                      <label>이름 (Name) *</label>
                      <input
                        type="text"
                        value={editModal.data.fullName}
                        onChange={(e) => updateEditModalData('fullName', e.target.value)}
                        className="edit-input"
                      />
                    </div>
                    <div className="form-col">
                      <label>국가 (Country) *</label>
                      <select
                        value={editModal.data.country}
                        onChange={(e) => updateEditModalData('country', e.target.value)}
                        className="edit-input"
                      >
                        {countries.filter(c => c.code).map(country => (
                          <option key={country.code} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-col">
                      <label>날짜 (Date) *</label>
                      <DatePicker
                        selected={editModal.data.contactDate}
                        onChange={(date) => updateEditModalData('contactDate', date)}
                        dateFormat="yyyy-MM-dd"
                        className="edit-input"
                        maxDate={new Date()}
                      />
                    </div>
                    <div className="form-col">
                      <label>연락방법 (Contact Method) *</label>
                      <select
                        value={editModal.data.contactMethod}
                        onChange={(e) => updateEditModalData('contactMethod', e.target.value)}
                        className="edit-input"
                      >
                        <option value="">선택하세요</option>
                        <option value="연락">연락 (Contact)</option>
                        <option value="만남">만남 (Meeting)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-col">
                      <label>세부방법 (Detail Method) *</label>
                      <select
                        value={editModal.data.contactSubMethod}
                        onChange={(e) => updateEditModalData('contactSubMethod', e.target.value)}
                        className="edit-input"
                      >
                        <option value="">선택하세요</option>
                        {editModal.data.contactMethod === '연락' ? (
                          <>
                            <option value="전화">전화 (Phone)</option>
                            <option value="메신저">메신저 (Messenger)</option>
                          </>
                        ) : editModal.data.contactMethod === '만남' ? (
                          <>
                            <option value="온라인">온라인 (Online)</option>
                            <option value="오프라인">오프라인 (Offline)</option>
                          </>
                        ) : null}
                      </select>
                    </div>
                    <div className="form-col">
                      <label>사용자 유형 (User Type) *</label>
                      <select
                        value={editModal.data.isNewUser ? 'new' : 'existing'}
                        onChange={(e) => updateEditModalData('isNewUser', e.target.value === 'new')}
                        className="edit-input"
                      >
                        <option value="existing">기존 (Existing)</option>
                        <option value="new">신규 (New)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>연락내용 (Contact Content)</label>
                    <textarea
                      value={editModal.data.contactContent || ''}
                      onChange={(e) => updateEditModalData('contactContent', e.target.value)}
                      className="edit-input"
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={editModal.data.isRegistered}
                        onChange={(e) => updateEditModalData('isRegistered', e.target.checked)}
                      />
                      등록여부 (Registered)
                    </label>
                  </div>

                  <div className="modal-actions">
                    <button onClick={saveEditModal} className="btn btn-success">
                      저장 (Save)
                    </button>
                    <button onClick={closeEditModal} className="btn btn-secondary">
                      취소 (Cancel)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
