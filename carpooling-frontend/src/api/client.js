import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8081/api' });

// Singleton refresh promise — prevents token rotation race condition
// when multiple requests expire simultaneously
let refreshingPromise = null;

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
      if (!refreshTok) {
        window.dispatchEvent(new CustomEvent('auth:force-logout'));
        return Promise.reject(err);
      }

      if (!refreshingPromise) {
        refreshingPromise = axios
          .post(`http://localhost:8081/api/auth/refresh?refreshToken=${encodeURIComponent(refreshTok)}`)
          .then(res => {
            const { token, refreshToken: newRefresh } = res.data?.data || {};
            if (!token) throw new Error('no token');
            localStorage.setItem('wp_token', token);
            if (newRefresh) localStorage.setItem('wp_refresh_token', newRefresh);
            return token;
          })
          .catch(() => {
            localStorage.removeItem('wp_token');
            localStorage.removeItem('wp_refresh_token');
            localStorage.removeItem('wp_user');
            window.dispatchEvent(new CustomEvent('auth:force-logout'));
            return null;
          })
          .finally(() => { refreshingPromise = null; });
      }

      const newToken = await refreshingPromise;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
