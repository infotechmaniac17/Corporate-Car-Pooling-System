import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8081/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('wp_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshTok = localStorage.getItem('wp_refresh_token');
      if (refreshTok) {
        try {
          const res = await axios.post(
            `http://localhost:8081/api/auth/refresh?refreshToken=${encodeURIComponent(refreshTok)}`
          );
          const { token, refreshToken: newRefresh } = res.data?.data || {};
          if (token) {
            localStorage.setItem('wp_token', token);
            if (newRefresh) localStorage.setItem('wp_refresh_token', newRefresh);
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          }
        } catch {
          localStorage.removeItem('wp_token');
          localStorage.removeItem('wp_refresh_token');
          localStorage.removeItem('wp_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
