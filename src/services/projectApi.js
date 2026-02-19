import axios from 'axios';

const NIPIGE_BASE_URL = 'https://dev.app.nipige.com';

const projectApi = axios.create({
  baseURL: NIPIGE_BASE_URL,
  headers: {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'x-encrypted-key': '6986dd7c98cebc34cb85c197',
  },
});

projectApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

projectApi.interceptors.response.use(
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

export const getProjectsAPI = async () => {
  const response = await projectApi.get('/servicerequest/project/list');
  return response.data;
};

export const createProjectAPI = async (projectData) => {
  const payload = {
    name: projectData.name,
    code: projectData.code,
    description: projectData.description,
    status: projectData.status,
    startDate: projectData.startDate,
    endDate: projectData.endDate,
    category: projectData.category,
    client: { name: typeof projectData.client === 'string' ? projectData.client : (projectData.client?.name || '') },
    owner: projectData.owner || undefined,
  };

  const response = await projectApi.post('/servicerequest/project/create', payload);
  return response.data;
};

export const updateProjectAPI = async (projectId, projectData) => {
  const payload = {
    name: projectData.name,
    code: projectData.code,
    description: projectData.description,
    status: projectData.status,
    startDate: projectData.startDate,
    endDate: projectData.endDate,
    category: projectData.category,
    client: { name: typeof projectData.client === 'string' ? projectData.client : (projectData.client?.name || '') },
    owner: projectData.owner || undefined,
  };

  const response = await projectApi.put(`/servicerequest/project/update/${projectId}`, payload);
  return response.data;
};

export const deleteProjectAPI = async (projectId) => {
  const response = await projectApi.delete(`/servicerequest/project/delete/${projectId}`);
  return response.data;
};

export default projectApi;
