import axios from 'axios';

const API_BASE_URL = 'https://dev.app.trigital.in';
const NIPIGE_BASE_URL = 'https://dev.app.nipige.com';

// Trigital API instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-encrypted-key': '6986dd7c98cebc34cb85c197',
  },
});

api.interceptors.request.use(
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

api.interceptors.response.use(
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

// Nipige API instance (for tickets and categories)
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
  (error) => {
    return Promise.reject(error);
  }
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

export const loginAPI = async (credentials, userType = 'EMPLOYEE') => {
  const endpoint = userType === 'ADMIN'
    ? '/cap/users/admin/login'
    : '/cap/users/tenant/login';

  const response = await api.post(endpoint, credentials);
  return response.data;
};

export const createTicketAPI = async (ticketData) => {
  // Get user info from localStorage
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const currentUser = user?.response?.user;

  // Prepare the create payload matching the API structure
  const createPayload = {
    category: ticketData.category?._id || ticketData.category || "62ecc5cb28d1be7e18db8315", // Default category if not provided
    description: ticketData.description,
    subject: ticketData.subject,
    reportedTo: ticketData.reportedTo || {
      id: ticketData.assignTo?.id || ticketData.assignTo?._id,
      name: ticketData.assignTo?.name,
      email: ticketData.assignTo?.email,
      userType: ticketData.assignTo?.userType || "SELLER",
      phone: ticketData.assignTo?.phone
    },
    assignTo: ticketData.assignTo || {
      id: ticketData.assignTo?.id || ticketData.assignTo?._id,
      name: ticketData.assignTo?.name,
      email: ticketData.assignTo?.email,
      userType: ticketData.assignTo?.userType || "SELLER",
      phone: ticketData.assignTo?.phone
    },
    reportedBy: {
      name: currentUser?.authentication?.userName || currentUser?.name,
      email: currentUser?.authentication?.email || currentUser?.email,
      userType: currentUser?.category || "INSPECTOR",
      phone: currentUser?.phone
    },
    attachments: ticketData.attachments || [],
    priority: ticketData.priority || 5,
    severity: ticketData.severity || "Medium"
  };

  // Add startDate and endDate if provided
  if (ticketData.startDate) {
    createPayload.startDate = ticketData.startDate;
  }
  if (ticketData.endDate) {
    createPayload.endDate = ticketData.endDate;
  }

  const response = await nipige.post('/servicerequest/ticket/create', createPayload);

  console.log('Create Ticket Response:', response.data);
  return response.data;
};

export const getTicketsAPI = async () => {
  const response = await nipige.get('/servicerequest/ticket/list');

  console.log('Ticket List Response:', response.data);
  return response.data;
};

export const updateTicketAPI = async (ticketId, ticketData) => {
  // Get user info from localStorage
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const currentUser = user?.response?.user;

  // Prepare the update payload matching the API structure
  const updatePayload = {
    assignTo: ticketData.assignTo || {
      id: ticketData.assignTo?.id || ticketData.assignTo?._id,
      name: ticketData.assignTo?.name,
      email: ticketData.assignTo?.email,
      userType: ticketData.assignTo?.userType,
      phone: ticketData.assignTo?.phone
    },
    reportedTo: ticketData.reportedTo,
    reportedBy: ticketData.reportedBy,
    status: ticketData.status,
    priority: ticketData.priority,
    _id: ticketId,
    category: ticketData.category?._id || ticketData.category,
    description: ticketData.description,
    subject: ticketData.subject,
    escalated: ticketData.escalated ? "true" : "false",
    severity: ticketData.severity,
    attachments: ticketData.attachments || [],
    ticketNo: ticketData.ticketNo,
    tenant: ticketData.tenant,
    scope: ticketData.scope,
    worknoteHistory: ticketData.worknoteHistory || [],
    changeHistory: ticketData.changeHistory || [],
    internalComments: ticketData.internalComments || [],
    updatedBy: {
      name: currentUser?.authentication?.userName || currentUser?.name,
      email: currentUser?.authentication?.email || currentUser?.email,
      phone: currentUser?.phone
    },
    userCategory: currentUser?.category,
    agentId: currentUser?._id
  };

  // Add startDate and endDate if provided
  if (ticketData.startDate) {
    updatePayload.startDate = ticketData.startDate;
  }
  if (ticketData.endDate) {
    updatePayload.endDate = ticketData.endDate;
  }

  const response = await nipige.put(`/servicerequest/ticket/update/${ticketId}`, updatePayload);

  console.log('Update Ticket Response:', response.data);
  return response.data;
};

export const deleteTicketAPI = async (ticketId) => {
  const response = await api.delete(`/tickets/${ticketId}`);
  return response.data;
};

export const getCategoriesAPI = async () => {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await nipige.get('/servicerequest/category/list');

    console.log('Category API - Full Response:', response);
    console.log('Category API - response.data:', response.data);
    console.log('Category API - response.data.data:', response.data?.data);
    console.log('Category API - Token:', token ? 'Token exists' : 'No token');

    return response.data;

  } catch (error) {
    console.error('Category List Error:', error.response?.data || error.message);
    throw error;
  }
};

export const postCommentAPI = async (ticketId, commentText) => {
  // Get user info from localStorage
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const currentUser = user?.response?.user;

  const commentPayload = {
    type: "WORKNOTE",
    comment: {
      updatedBy: {
        name: currentUser?.authentication?.userName || currentUser?.name || "Unknown",
        email: currentUser?.authentication?.email || currentUser?.email || "",
        userType: currentUser?.category || "TENANT",
        phone: currentUser?.phone || ""
      },
      description: commentText
    }
  };

  const response = await nipige.post(`/servicerequest/ticket/postcomment/${ticketId}`, commentPayload);

  console.log('Post Comment Response:', response.data);
  return response.data;
};

export default api;
