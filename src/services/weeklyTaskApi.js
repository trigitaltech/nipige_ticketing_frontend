import axios from 'axios';

const NIPIGE_BASE_URL = 'https://dev.app.nipige.com';

const nipige = axios.create({
  baseURL: NIPIGE_BASE_URL,
  headers: {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'x-encrypted-key': '6986dd7c98cebc34cb85c197',
  },
});

nipige.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

nipige.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const getWeeklyTasksAPI = async (params) => {
  const response = await nipige.get('/servicerequest/weekly-task/list', { params });
  return response.data;
};

export const saveWeeklyTaskAPI = async (taskData) => {
  const response = await nipige.post('/servicerequest/weekly-task/save', taskData);
  return response.data;
};

export const updateWeeklyTaskAPI = async (taskId, taskData) => {
  const response = await nipige.put(`/servicerequest/weekly-task/update/${taskId}`, taskData);
  return response.data;
};
