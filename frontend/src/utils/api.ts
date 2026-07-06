import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Extract server-side error messages from failed responses
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const serverMsg = err?.response?.data?.message;
    if (serverMsg && err.response) {
      err.message = serverMsg;
    }
    return Promise.reject(err);
  }
);
