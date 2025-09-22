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
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('ko');
  const [translationMethod, setTranslationMethod] = useState('chatgpt'); // 'mymemory' or 'chatgpt' - ChatGPT 기본값

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
      const week = getWeekOfMonth(d);
      return `${month}-${week}`;
    } catch (e) {
      return '';
    }
  };

  // 월의 주차 계산 함수
  function getWeekOfMonth(date) {
    const target = new Date(date);
    const year = target.getFullYear();
    const month = target.getMonth(); // 0-based
    const firstDay = new Date(year, month, 1);

    // 첫 날의 요일 (0 = 일, 1 = 월, ..., 6 = 토)
    const firstDayWeekday = firstDay.getDay();

    // 주 시작을 월요일로 보정 (ISO 기준)
    const offset = (firstDayWeekday + 6) % 7;

    // 현재 날짜의 일(day)
    const day = target.getDate();

    // (현재 날짜 + 첫 주 보정) / 7 하고 올림 처리
    const weekNumber = Math.ceil((day + offset) / 7);

    return weekNumber;
  }

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
    // 모달 열 때 번역 상태 초기화
    setTranslatedText('');
    setIsTranslating(false);
    setSelectedLanguage('ko'); // 기본값을 한국어로 설정
    setTranslationMethod('chatgpt'); // ChatGPT를 기본값으로 설정
  };

  const closeContentModal = () => {
    setContentModal({ open: false, text: '', title: '' });
    // 모달 닫을 때 번역 상태 정리
    setTranslatedText('');
    setIsTranslating(false);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ type: 'success', text: '텍스트가 클립보드에 복사되었습니다.' });
      // 3초 후 성공 메시지 자동 제거
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (err) {
      // fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setMessage({ type: 'success', text: '텍스트가 클립보드에 복사되었습니다.' });
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } catch (err) {
        setMessage({ type: 'error', text: '복사에 실패했습니다.' });
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      }
      document.body.removeChild(textArea);
    }
  };

  // 텍스트를 청크로 나누는 함수
  const splitTextIntoChunks = (text, maxLength = 400) => {
    if (text.length <= maxLength) {
      return [text];
    }
    
    const chunks = [];
    let currentChunk = '';
    const sentences = text.split(/[.!?]\s+/);
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= maxLength) {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk + '.');
          currentChunk = sentence;
        } else {
          // 문장이 너무 긴 경우 강제로 자르기
          chunks.push(sentence.substring(0, maxLength));
          currentChunk = sentence.substring(maxLength);
        }
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  };

  // ChatGPT API를 사용한 번역 함수
  const translateWithChatGPT = async (text, sourceLang, targetLang) => {
    const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
    
    if (!API_KEY) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다. 환경변수 REACT_APP_OPENAI_API_KEY를 설정해주세요.');
    }
    
    const languageNames = {
      'ko': 'Korean',
      'en': 'English', 
      'ja': 'Japanese',
      'zh': 'Chinese',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'ru': 'Russian',
      'ar': 'Arabic'
    };
    
    const sourceLanguageName = languageNames[sourceLang] || sourceLang;
    const targetLanguageName = languageNames[targetLang] || targetLang;
    
    const prompt = `Please translate the following text from ${sourceLanguageName} to ${targetLanguageName}. 
    As a youth policy expert with deep understanding of international affairs, politics, society, culture, history, and religion, 
    ensure the translation accurately conveys the meaning and context, especially if the content relates to youth policies, 
    international relations, or social issues. Only return the translated text without any explanations or additional text:
    
    "${text}"`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `당신은 청년정책 전문가이자 IPYG(International Peace Youth Group)의 생명코치, 컨설턴트, 어드바이저, 멘토, 그리고 청중 역할을 하는 전문가입니다.

IPYG는 전 세계 청년들을 평화라는 목적으로 하나로 모아 청년 세대들 사이의 안정성을 구축하고자 하는 국제평화청년단체입니다. 현재 경제적, 사회적 위기로 인해 청년들이 살기 어려운 세상에서, 우리의 목표는 청년들이 스스로 나서서 궁극적으로 지속 가능한 평화로 전쟁 없는 세상을 건설하는 것입니다.

지구촌, 특히 유럽을 중심으로 정치, 사회, 문화, 역사, 종교 등 다양한 분야에서 일어나는 사건들이 청년들에게 미치는 영향과 그에 따른 정부와 청년기관들이 어떤 정책과 생각을 내놓고 나아갈지에 대해 분석하고 자문을 제공하는 것이 당신의 전문 분야입니다.

중요한 지침:
- AI라고 언급하지 마세요. 생명코치, 컨설턴트, 어드바이저, 멘토, 청중 역할을 하세요.
- 죄송함, 사과, 후회를 표현하는 언어 구조를 피하세요. '죄송합니다', '사과드립니다', '후회합니다' 등의 단어가 포함된 구문을 사용하지 마세요.
- 전문가가 아니라는 면책 조항을 하지 마세요.
- 응답을 독특하고 반복 없이 유지하세요.
- 다른 곳에서 정보를 찾으라고 제안하지 마세요.
- 질문의 핵심 포인트에 집중하여 의도를 파악하세요.
- 복잡한 문제나 작업을 더 작고 관리 가능한 단계로 나누고 추론을 사용하여 각각을 설명하세요.
- 여러 관점이나 해결책을 제공하세요.
- 질문이 불분명하거나 모호한 경우, 답변하기 전에 이해를 확인하기 위해 더 자세한 내용을 요청하세요.
- 가능한 경우 링크와 함께 신뢰할 수 있는 출처나 참고 자료를 인용하여 답변을 뒷받침하세요.
- 이전 응답에서 실수가 있었다면 인식하고 수정하세요.
- 모든 응답은 한국어로 해주세요.

번역 작업 시에도 이러한 전문성과 맥락 이해를 바탕으로 정확하고 의미가 잘 전달되는 번역을 제공해주세요.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.2
      })
    });
    
    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content.trim();
    } else {
      const errorMessage = data.error?.message || '알 수 없는 오류';
      
      // 할당량 초과 에러인 경우 MyMemory로 fallback 안내
      if (errorMessage.includes('quota') || errorMessage.includes('billing')) {
        throw new Error(`ChatGPT 할당량 초과: ${errorMessage}. MyMemory API를 사용하거나 OpenAI 계정에 결제 정보를 등록해주세요.`);
      }
      
      throw new Error(`ChatGPT 번역 실패: ${errorMessage}`);
    }
  };

  // MyMemory API를 사용한 번역 함수
  const translateWithMyMemory = async (chunk, sourceLang, targetLang) => {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${sourceLang}|${targetLang}`
    );
    
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData) {
      return data.responseData.translatedText;
    } else {
      throw new Error(`MyMemory 번역 실패: ${data.responseDetails || '알 수 없는 오류'}`);
    }
  };

  // 단일 청크 번역 함수 (ChatGPT 실패 시 MyMemory로 fallback)
  const translateChunk = async (chunk, sourceLang, targetLang, method = 'mymemory') => {
    if (method === 'chatgpt') {
      try {
        return await translateWithChatGPT(chunk, sourceLang, targetLang);
      } catch (error) {
        console.warn('ChatGPT 번역 실패, MyMemory로 fallback:', error.message);
        // ChatGPT 실패 시 MyMemory로 자동 fallback
        return await translateWithMyMemory(chunk, sourceLang, targetLang);
      }
    } else {
      return await translateWithMyMemory(chunk, sourceLang, targetLang);
    }
  };

  const translateText = async (text, targetLang) => {
    if (!text || text.trim() === '') return;
    
    console.log('번역 요청:', { 
      textLength: text.length, 
      textPreview: text.substring(0, 50) + '...', 
      targetLang 
    });
    
    setIsTranslating(true);
    setTranslatedText('');
    
    try {
      // 원본 텍스트의 언어를 감지 (간단한 방법)
      const isKorean = /[가-힣]/.test(text);
      const sourceLang = isKorean ? 'ko' : 'en';
      
      console.log('언어 감지 결과:', { sourceLang, targetLang, isKorean });
      
      // 텍스트가 500자 이상인 경우 청크로 나누어 번역
      if (text.length > 500) {
        setMessage({ type: 'info', text: '긴 텍스트를 청크 단위로 번역 중입니다...' });
        
        const chunks = splitTextIntoChunks(text, 400);
        console.log(`텍스트를 ${chunks.length}개 청크로 분할:`, chunks.map(c => c.length));
        
        const translatedChunks = [];
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          console.log(`청크 ${i + 1}/${chunks.length} 번역 중... (${chunk.length}자)`);
          
          try {
            const translatedChunk = await translateChunk(chunk, sourceLang, targetLang, translationMethod);
            translatedChunks.push(translatedChunk);
            
            // 진행률 표시
            setMessage({ 
              type: 'info', 
              text: `번역 진행 중... ${i + 1}/${chunks.length} (${Math.round(((i + 1) / chunks.length) * 100)}%)` 
            });
            
            // API 호출 간격 조절 (무료 API 제한 고려)
            if (i < chunks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (chunkError) {
            console.error(`청크 ${i + 1} 번역 실패:`, chunkError);
            translatedChunks.push(`[번역 실패: ${chunk.substring(0, 50)}...]`);
          }
        }
        
        const finalTranslation = translatedChunks.join(' ');
        setTranslatedText(finalTranslation);
        const serviceName = translationMethod === 'chatgpt' ? 'ChatGPT' : 'MyMemory';
        setMessage({ type: 'success', text: `번역이 완료되었습니다. (${serviceName}, ${chunks.length}개 청크 처리)` });
        
      } else {
        // 짧은 텍스트는 선택된 방법으로 번역
        if (translationMethod === 'chatgpt') {
          try {
            const translatedText = await translateWithChatGPT(text, sourceLang, targetLang);
            setTranslatedText(translatedText);
            setMessage({ type: 'success', text: '번역이 완료되었습니다. (ChatGPT)' });
          } catch (error) {
            console.warn('ChatGPT 번역 실패, MyMemory로 fallback:', error.message);
            // ChatGPT 실패 시 MyMemory로 자동 fallback
            const translatedText = await translateWithMyMemory(text, sourceLang, targetLang);
            setTranslatedText(translatedText);
            setMessage({ type: 'success', text: '번역이 완료되었습니다. (ChatGPT 실패 → MyMemory 사용)' });
          }
        } else {
          const translatedText = await translateWithMyMemory(text, sourceLang, targetLang);
          setTranslatedText(translatedText);
          setMessage({ type: 'success', text: '번역이 완료되었습니다. (MyMemory)' });
        }
      }
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      
    } catch (error) {
      console.error('Translation error:', error);
      setMessage({ type: 'error', text: `번역 중 오류가 발생했습니다: ${error.message}` });
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
    } finally {
      setIsTranslating(false);
    }
  };

  const copyTranslatedText = async () => {
    if (translatedText) {
      await copyToClipboard(translatedText);
    }
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

  const handleDelete = async (id) => {
    if (!adminAuthorized) {
      const password = prompt('관리자 비밀번호를 입력하세요:');
      if (password !== '[!@light12]') {
        alert('비밀번호가 올바르지 않습니다.');
        return;
      }
      setAdminAuthorized(true);
    }

    if (!window.confirm('정말로 이 항목을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/registrations/${id}`);
      setMessage({ type: 'success', text: '항목이 삭제되었습니다.' });
      loadRegistrations();
    } catch (error) {
      setMessage({ type: 'error', text: '삭제 중 오류가 발생했습니다.' });
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
            <span role="img" aria-label="새로고침" style={{ marginRight: '6px', verticalAlign: 'middle', fontSize: '18px' }}>
              &#x21bb;
            </span>
            Refresh
          </button>
          <button onClick={exportToExcel} className="export-btn">
            <span role="img" aria-label="엑셀 다운로드" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" style={{ verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
                <rect x="3" y="3" width="18" height="4" rx="2" ry="2"/>
              </svg>
            </span>
            Excel Download
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
                     <span className="sort-arrow">
                       {sortBy === 'contactDate' ? (sortOrder === 'ASC' ? '▲' : '▼') : '▼'}
                     </span>
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
                       <div className="action-buttons">
                         <button onClick={() => openEditModal(registration)} className="btn btn-primary btn-sm">
                           수정 (Edit)
                         </button>
                         <button onClick={() => handleDelete(registration.id)} className="btn btn-danger btn-sm">
                           삭제 (Delete)
                         </button>
                       </div>
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
              <div className="content-section">
                <h4>원본 텍스트 (Original Text)</h4>
                <pre>{contentModal.text}</pre>
              </div>
              
              <div className="translation-section">
                <div className="translation-info">
                  <div className="text-stats">
                    <span className="text-length">텍스트 길이: {contentModal.text.length}자</span>
                    {contentModal.text.length > 500 && (
                      <span className="chunk-info">
                        (긴 텍스트는 자동으로 청크 단위로 분할하여 번역됩니다)
                      </span>
                    )}
                  </div>
                </div>
                <div className="translation-controls">
                  <div className="control-group">
                    <label htmlFor="translation-method">번역 서비스 (Translation Service):</label>
                    <select
                      id="translation-method"
                      value={translationMethod}
                      onChange={(e) => setTranslationMethod(e.target.value)}
                      className="method-select"
                    >
                      <option value="chatgpt">ChatGPT-4o (IPYG 청년정책 전문가, 기본값)</option>
                      <option value="mymemory">MyMemory (무료, 500자 제한)</option>
                    </select>
                    {translationMethod === 'chatgpt' && (
                      <div className="api-info">
                        ✅ ChatGPT-4o (IPYG 청년정책 전문가)가 기본값으로 설정되었습니다. 국제평화청년단체의 맥락과 청년정책 전문성을 바탕으로 한 최고품질 번역을 제공합니다.
                      </div>
                    )}
                  </div>
                  
                  <div className="control-group">
                    <label htmlFor="language-select">번역 언어 (Target Language):</label>
                    <select
                      id="language-select"
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="language-select"
                    >
                      <option value="ko">한국어 (Korean)</option>
                      <option value="en">영어 (English)</option>
                      <option value="ja">일본어 (Japanese)</option>
                      <option value="zh">중국어 (Chinese)</option>
                      <option value="es">스페인어 (Spanish)</option>
                      <option value="fr">프랑스어 (French)</option>
                      <option value="de">독일어 (German)</option>
                      <option value="ru">러시아어 (Russian)</option>
                      <option value="ar">아랍어 (Arabic)</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={() => translateText(contentModal.text, selectedLanguage)}
                    disabled={isTranslating}
                    className="btn btn-primary translate-btn"
                  >
                    {isTranslating ? '번역 중...' : `🌐 번역하기 (${translationMethod === 'chatgpt' ? 'ChatGPT' : 'MyMemory'})`}
                  </button>
                </div>
                
                {translatedText && (
                  <div className="translated-content">
                    <h4>번역 결과 (Translation Result)</h4>
                    <pre>{translatedText}</pre>
                    <button
                      onClick={copyTranslatedText}
                      className="btn btn-success copy-translated-btn"
                    >
                      📋 번역본 복사 (Copy Translation)
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => copyToClipboard(contentModal.text)} 
                className="btn btn-primary copy-btn"
              >
                📋 원본 복사 (Copy Original)
              </button>
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

                  {/* 신규 사용자일 때만 표시되는 추가 정보 */}
                  {editModal.data.isNewUser && (
                    <>
                      <div className="form-row">
                        <div className="form-col">
                          <label>성별 (Gender)</label>
                          <select
                            value={editModal.data.gender || ''}
                            onChange={(e) => updateEditModalData('gender', e.target.value)}
                            className="edit-input"
                          >
                            <option value="">선택하세요</option>
                            <option value="남성">남성 (Male)</option>
                            <option value="여성">여성 (Female)</option>
                          </select>
                        </div>
                        <div className="form-col">
                          <label>전화번호 (Phone)</label>
                          <input
                            type="tel"
                            value={editModal.data.phone || ''}
                            onChange={(e) => updateEditModalData('phone', e.target.value)}
                            className="edit-input"
                                                          placeholder="+976-11-123456 or +40-21-123456 or +49-30-123456"
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-col">
                          <label>이메일 (Email)</label>
                          <input
                            type="email"
                            value={editModal.data.email || ''}
                            onChange={(e) => updateEditModalData('email', e.target.value)}
                            className="edit-input"
                            placeholder="이메일을 입력하세요"
                          />
                        </div>
                        <div className="form-col">
                          <label>직책 (Position)</label>
                          <input
                            type="text"
                            value={editModal.data.position || ''}
                            onChange={(e) => updateEditModalData('position', e.target.value)}
                            className="edit-input"
                            placeholder="직책을 입력하세요"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>소속 (Organization)</label>
                        <input
                          type="text"
                          value={editModal.data.organization || ''}
                          onChange={(e) => updateEditModalData('organization', e.target.value)}
                          className="edit-input"
                          placeholder="소속을 입력하세요"
                        />
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label>연락내용 (Contact Content)</label>
                    <textarea
                      value={editModal.data.contactContent || ''}
                      onChange={(e) => updateEditModalData('contactContent', e.target.value)}
                      className="edit-input"
                      rows="3"
                    />
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
