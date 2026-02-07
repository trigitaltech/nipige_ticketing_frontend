import axios from 'axios';

const API_BASE_URL = 'https://dev.app.trigital.in/cap';

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

export const loginAPI = async (credentials) => {
  const response = await api.post('/users/tenant/login', credentials);  
  return response.data;
};

export const createTicketAPI = async (ticketData) => {
  const token = localStorage.getItem('token');

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

  const response = await axios.post(
    'https://dev.app.nipige.com/servicerequest/ticket/create',
    createPayload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      }
    }
  );

  console.log('Create Ticket Response:', response.data);
  return response.data;
};

export const getTicketsAPI = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get('https://dev.app.nipige.com/servicerequest/ticket/list', {
    headers: {
      'accept': 'application/json, text/plain, */*',
      'authorization': `Bearer ${token}`,
      'x-encrypted-key': '6986dd7c98cebc34cb85c197',
      'Content-Type': 'application/json',
    },
  });

  console.log('Ticket List Response:', response.data);
  return response.data;
};

export const updateTicketAPI = async (ticketId, ticketData) => {
  const token = localStorage.getItem('token');

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

  const response = await axios.put(
    `https://dev.app.nipige.com/servicerequest/ticket/update/${ticketId}`,
    updatePayload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      }
    }
  );

  console.log('Update Ticket Response:', response.data);
  return response.data;
};

export const deleteTicketAPI = async (ticketId) => {
  const response = await api.delete(`/tickets/${ticketId}`);
  return response.data;
};

export default api;
