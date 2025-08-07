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

  // 데이터 로드
  const loadRegistrations = async () => {
    try {
      setLoading(true);
             const response = await axios.get(`${API_BASE_URL}/registrations?sortBy=${sortBy}&sortOrder=${sortOrder}`);
      setRegistrations(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: '데이터 로드 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, [sortBy, sortOrder]);

  // 정렬 변경
  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  // 등록 상태 변경
  const handleRegisterChange = async (id, isRegistered) => {
    try {
             await axios.patch(`${API_BASE_URL}/registrations/${id}/register`, { isRegistered });
             setMessage({ 
         type: 'success', 
         text: `✅ 등록 상태가 업데이트되었습니다! (${isRegistered ? '등록됨' : '미등록'}) / Registration status updated! (${isRegistered ? 'Registered' : 'Not Registered'})` 
       });
       
       // 3초 후 성공 메시지 자동 제거
       setTimeout(() => {
         setMessage({ type: '', text: '' });
       }, 3000);
      loadRegistrations();
    } catch (error) {
      setMessage({ type: 'error', text: '등록 상태 업데이트 중 오류가 발생했습니다.' });
    }
  };

  // 수정 모드 시작
  const startEdit = (registration) => {
    setEditingId(registration.id);
    setEditForm({
      ...registration,
      contactDate: new Date(registration.contactDate)
    });
  };

  // 수정 모드 취소
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // 수정 저장
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

  // 수정 폼 필드 업데이트
  const updateEditForm = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 정렬 헤더 렌더링
  const SortableHeader = ({ field, children }) => (
    <th 
      onClick={() => handleSortChange(field)}
      style={{ cursor: 'pointer', userSelect: 'none' }}
      className={sortBy === field ? 'active-sort' : ''}
    >
      {children} {sortBy === field && (sortOrder === 'ASC' ? '↑' : '↓')}
    </th>
  );

  if (loading) {
    return <div className="loading">데이터를 불러오는 중...</div>;
  }

  return (
    <div className="admin-container">
      <div className="title-container">
        <img 
          src="https://www.hwpl.kr/wp-content/uploads/2024/02/ipyg.png" 
          alt="IPYG Logo" 
          className="ipyg-logo"
          width="40" 
          height="40"
        />
        <h1 className="admin-title">등록 관리 페이지 (Admin Page)</h1>
      </div>
      
      {message.text && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
          {message.text}
        </div>
      )}

      <div className="admin-controls">
        <div className="sort-controls">
          <label>정렬 기준 (Sort By):</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="createdAt">등록일 (Created Date)</option>
            <option value="fullName">이름 (Name)</option>
            <option value="contactDate">날짜 (Date)</option>
            <option value="contactMethod">연락방법 (Contact Method)</option>
            <option value="isRegistered">등록여부 (Registration Status)</option>
          </select>
          <button 
            onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
            className="btn btn-secondary"
          >
            {sortOrder === 'ASC' ? '오름차순 (Ascending)' : '내림차순 (Descending)'}
          </button>
        </div>
        
        <button onClick={loadRegistrations} className="btn btn-primary">
          새로고침 (Refresh)
        </button>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <SortableHeader field="fullName">이름 (Name)</SortableHeader>
              <SortableHeader field="contactDate">날짜 (Date)</SortableHeader>
              <SortableHeader field="contactMethod">연락방법 (Contact Method)</SortableHeader>
              <th>세부방법 (Detail Method)</th>
              <th>연락내용 (Content)</th>
              <th>사용자 유형 (User Type)</th>
              <SortableHeader field="isRegistered">등록여부 (Registered)</SortableHeader>
              <th>작업 (Actions)</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((registration) => (
              <tr key={registration.id} className={registration.isRegistered ? 'registered' : 'not-registered'}>
                {editingId === registration.id ? (
                  // 수정 모드
                  <>
                    <td>
                      <input
                        type="text"
                        value={editForm.fullName}
                        onChange={(e) => updateEditForm('fullName', e.target.value)}
                        className="edit-input"
                      />
                    </td>
                    <td>
                      <DatePicker
                        selected={editForm.contactDate}
                        onChange={(date) => updateEditForm('contactDate', date)}
                        dateFormat="yyyy-MM-dd"
                        locale={ko}
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
                    <td>{registration.fullName}</td>
                    <td>{format(parseISO(registration.contactDate), 'yyyy-MM-dd')}</td>
                    <td>{registration.contactMethod}</td>
                    <td>{registration.contactSubMethod}</td>
                    <td className="content-cell">
                      {registration.contactContent || '-'}
                    </td>
                    <td>{registration.isNewUser ? '신규 (New)' : '기존 (Existing)'}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={registration.isRegistered}
                        onChange={(e) => handleRegisterChange(registration.id, e.target.checked)}
                      />
                      <span className="status-text">
                        {registration.isRegistered ? '등록됨 (Registered)' : '미등록 (Not Registered)'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => startEdit(registration)} className="btn btn-primary btn-sm">
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

      <div className="summary">
        <p>총 {registrations.length}개 항목 중 {registrations.filter(r => r.isRegistered).length}개 등록됨</p>
        <p>Total {registrations.length} items, {registrations.filter(r => r.isRegistered).length} registered</p>
      </div>
    </div>
  );
};

export default AdminPage;
