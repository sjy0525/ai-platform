import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 请求拦截器 - 添加token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 错误处理
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 错误监控上报
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default apiClient;