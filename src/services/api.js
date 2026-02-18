import axios from 'axios';
import { extractBase64Data } from '../function/function';

const API_BASE_URL = 'https://dev.app.trigital.in';
const NIPIGE_BASE_URL = 'https://dev.app.nipige.com';

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
    const isLoginRequest = error.config?.url?.includes('/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

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
    const isPasswordChange = error.config?.url?.includes('/update-password');
    if (error.response?.status === 401 && !isPasswordChange) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const loginAPI = async (credentials, userType = 'EMPLOYEE') => {
  const endpoint = userType === 'EMPLOYEE'
    ? '/cap/users/admin/login'
    : '/cap/users/tenant/login';

  const response = await api.post(endpoint, credentials);
  return response.data;
};

const normalizeAttachmentPayload = (attachmentsInput) => {
  const attachments = Array.isArray(attachmentsInput)
    ? attachmentsInput
    : attachmentsInput
      ? [attachmentsInput]
      : [];

  return attachments
    .map((attachment) => {
      if (typeof attachment === 'string') {
        const url = attachment.trim();
        return url ? { url } : null;
      }

      if (attachment && typeof attachment === 'object') {
        const url = (attachment.url || attachment.fileUrl || '').trim();
        return url ? { url } : null;
      }

      return null;
    })
    .filter(Boolean);
};

export const createTicketAPI = async (ticketData) => {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const currentUser = user?.response?.user;
  const projectId =
    ticketData.project?.id ||
    ticketData.project?._id ||
    (typeof ticketData.project === 'string' ? ticketData.project : '');

  const createPayload = {
    category: ticketData.category?._id || ticketData.category || "62ecc5cb28d1be7e18db8315", // Default category if not provided
    description: ticketData.description,
    subject: ticketData.subject,
    reportedBy: {
      name: currentUser?.authentication?.userName || currentUser?.name,
      email: currentUser?.authentication?.email || currentUser?.email,
      userType: currentUser?.category || "INSPECTOR",
      phone: currentUser?.phone
    },
    attachments: normalizeAttachmentPayload(ticketData.attachments || ticketData.attachment),
    priority: ticketData.priority || 5,
    severity: ticketData.severity || "Medium"
  };

  if (projectId) {
    createPayload.project = { id: projectId };
  }

  if (ticketData.reportedTo) {
    createPayload.reportedTo = ticketData.reportedTo;
  }

  if (ticketData.assignTo) {
    createPayload.assignTo = ticketData.assignTo;
  }


  if (ticketData.startDate) {
    createPayload.startDate = ticketData.startDate;
  }
  if (ticketData.endDate) {
    createPayload.endDate = ticketData.endDate;
  }

  const response = await nipige.post('/servicerequest/ticket/create', createPayload);

  return response.data;
};

export const getTicketsAPI = async () => {
  const response = await nipige.get('/servicerequest/ticket/list');
  
  return response.data;
};

export const updateTicketAPI = async (ticketId, ticketData) => {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const currentUser = user?.response?.user;
  const projectId =
    ticketData.project?.id ||
    ticketData.project?._id ||
    (typeof ticketData.project === 'string' ? ticketData.project : '');
  
  const updatePayload = {
    _id: ticketId,
    category: ticketData.category?._id || ticketData.category,
    description: ticketData.description,
    subject: ticketData.subject,
    status: ticketData.status,
    priority: ticketData.priority,
    severity: ticketData.severity,
    escalated: ticketData.escalated ? "true" : "false",
    attachments: normalizeAttachmentPayload(ticketData.attachments || ticketData.attachment),
    ticketNo: ticketData.ticketNo,
    tenant: ticketData.tenant,
    scope: ticketData.scope,
    worknoteHistory: ticketData.worknoteHistory || [],
    changeHistory: ticketData.changeHistory || [],
    internalComments: ticketData.internalComments || [],
    reportedBy: ticketData.reportedBy,
    updatedBy: {
      name: currentUser?.authentication?.userName || currentUser?.name,
      email: currentUser?.authentication?.email || currentUser?.email,
      phone: currentUser?.phone
    },
    userCategory: currentUser?.category,
    agentId: currentUser?._id
  };

  if (projectId) {
    updatePayload.project = { id: projectId };
  }

  if (ticketData.assignTo) {
    updatePayload.assignTo = ticketData.assignTo;
  }


  if (ticketData.reportedTo) {
    updatePayload.reportedTo = ticketData.reportedTo;
  }


  if (ticketData.startDate) {
    updatePayload.startDate = ticketData.startDate;
  }
  if (ticketData.endDate) {
    updatePayload.endDate = ticketData.endDate;
  }
  console.log("====>",updatePayload);
  const response = await nipige.put(`/servicerequest/ticket/update/${ticketId}`, updatePayload);

  return response.data;
};

export const deleteTicketAPI = async (ticketId) => {
  const response = await nipige.delete(`servicerequest/ticket/delete/${ticketId}`);
  return response.data;
};

export const getCategoriesAPI = async () => {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await nipige.get('/servicerequest/category/list');

    return response.data;

  } catch (error) {
    console.error('Category List Error:', error.response?.data || error.message);
    throw error;
  }
};

export const postCommentAPI = async (ticketId, commentText) => {
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

  return response.data;
};

export const filterTicketsAPI = async (filters) => {
  // Get user info from localStorage for reportedBy filter
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const currentUser = user?.response?.user;

  const filterPayload = {
    status: filters.status || "",
    priority: filters.priority || null,
    category: filters.category || "",
    fromDate: filters.fromDate || "",
    toDate: filters.toDate || "",
    reportedBy: filters.reportedBy || currentUser?._id || "",
    assignTo: filters.assignTo || "",
    orderId: filters.orderId || ""
  };

  const response = await nipige.post('/servicerequest/ticket/filter', filterPayload);

  return response.data;
};

export const changePasswordAPI = async ({ currentPassword, newPassword }) => {
  const response = await nipige.post('/cap/users/admin/update-password', {
    currentPassword,
    newPassword,
  });
  return response.data;
};

export const getUsersAPI = async () => {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await api.get('/cap/users/admin/list?limit=50&page=1');


    return response.data;

  } catch (error) {
    console.error('User List Error:', error.response?.data || error.message);
    throw error;
  }
};


export const uploadImage = async (payload, onUploadProgress) => {


  const base64DataUrl = payload?.image;
  if (!base64DataUrl) {
    throw new Error('uploadImage: payload.image is required');
  }

  const cleanedBase64 = extractBase64Data(base64DataUrl);
  const requestBody = {
    image: cleanedBase64,
    key: payload?.key || String(Date.now()),
    isPublic: payload?.isPublic ?? true,
    replaceExisting: payload?.replaceExisting ?? false,
    basePath: payload?.basePath || ['user', 'attachment'],
  };

  const response = await nipige.post('/storage/image/upload', requestBody, {
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onUploadProgress(percent);
      }
    },
  });
  return response.data;
};

export default api;
