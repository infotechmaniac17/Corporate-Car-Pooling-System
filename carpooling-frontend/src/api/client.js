import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8081/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('wp_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default api;
