const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://insis-reg-form.vercel.app/api' 
  : 'http://localhost:5002/api';

export default API_BASE_URL;
