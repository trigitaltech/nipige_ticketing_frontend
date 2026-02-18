import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../redux/categorySlice';
import { fetchUsers } from '../redux/userSlice';
import { fetchProjects } from '../redux/projectSlice';
import { postCommentAPI, uploadImage } from '../services/api';
import { fileToBase64 } from '../function/function';
import AlertModal from '../components/shared/AlertModal';

const statusConfig = {
  OPEN: { label: 'Open', bg: 'bg-blue-100', text: 'text-blue-700' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-blue-100', text: 'text-blue-600' },
  RESOLVED: { label: 'Resolved', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  CLOSED: { label: 'Closed', bg: 'bg-gray-100', text: 'text-gray-500' },
};

const TicketDetailsPage = ({ ticket, onBack, onUpdate }) => {
  const dispatch = useDispatch();
  const { categories, loading: categoriesLoading } = useSelector((state) => state.categories);
  const { users, loading: usersLoading } = useSelector((state) => state.users);
  const { projects, loading: projectsLoading } = useSelector((state) => state.projects);

  const formatDateTimeLocal = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffset);
    const year = istDate.getUTCFullYear();
    const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istDate.getUTCDate()).padStart(2, '0');
    const hours = String(istDate.getUTCHours()).padStart(2, '0');
    const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' });
    const timePart = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
    return `${datePart} \u00B7 ${timePart}`;
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' });
  };

  const [formData, setFormData] = useState({
    subject: ticket.subject || ticket.title || '',
    description: ticket.description || '',
    priority: ticket.priority || 0,
    severity: ticket.severity || ticket.category?.severity || 'Low',
    assignTo: ticket.assignTo || null,
    reportedTo: ticket.reportedTo || null,
    status: ticket.status || 'OPEN',
    project: ticket.project?.id || ticket.project?._id || ticket.project || '',
    category: ticket.category?._id || ticket.category || '',
    scope: ticket.scope || '',
    startDate: formatDateTimeLocal(ticket.startDate),
    endDate: formatDateTimeLocal(ticket.endDate),
  });

  const [comment, setComment] = useState('');
  const [worknoteHistory, setWorknoteHistory] = useState(ticket.worknoteHistory || []);
  const [errors, setErrors] = useState({});
  const [isPostingComment, setIsPostingComment] = useState(false);
  // Stores newly uploaded attachment URLs (strings)
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });
  const fileInputRef = useRef(null);

  const openAlertModal = ({ type = 'info', title, message }) => {
    setAlertModal({
      isOpen: true,
      type,
      title,
      message,
    });
  };

  const closeAlertModal = () => {
    setAlertModal((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchUsers());
    dispatch(fetchProjects());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if ((name === 'startDate' || name === 'endDate') && value) {
      const year = value.split('-')[0];
      if (year && year.length > 4) return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    const selectedCategory = categories.find(cat => cat._id === categoryId);
    if (selectedCategory) {
      setFormData(prev => ({
        ...prev,
        category: categoryId,
        severity: selectedCategory.severity || 'Medium',
        scope: selectedCategory.scope || '',
      }));
    } else {
      setFormData(prev => ({ ...prev, category: categoryId }));
    }
    if (errors.category) setErrors(prev => ({ ...prev, category: '' }));
  };

  const handleProjectChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, project: value }));
    if (errors.project) {
      setErrors((prev) => ({ ...prev, project: '' }));
    }
  };

  const handleUserChange = (e, field) => {
    const userId = e.target.value;
    const selectedUser = users.find(user => user._id === userId);
    if (selectedUser) {
      const userObject = {
        id: selectedUser._id,
        name: `${selectedUser.name?.first || ''} ${selectedUser.name?.last || ''}`.trim() || selectedUser.authentication?.userName,
        email: selectedUser.authentication?.email,
        userType: selectedUser.category,
        phone: selectedUser.authentication?.phone,
      };
      setFormData(prev => ({ ...prev, [field]: userObject }));
    } else {
      setFormData(prev => ({ ...prev, [field]: null }));
    }
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.project) newErrors.project = 'Project is required';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Merge existing attachments with newly uploaded files.
    // For the API we only send URL strings.
    const existingAttachmentsRaw = ticket.attachments || [];
    const existingUrls = existingAttachmentsRaw.map((att) =>
      typeof att === 'string' ? att : att?.url
    ).filter(Boolean);

    const mergedAttachments = [...existingUrls, ...uploadedFiles];

    onUpdate({ ...ticket, ...formData, attachments: mergedAttachments });
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (const file of files) {
        const base64 = await fileToBase64(file);

        const payload = {
          image: base64,
        };

        const response = await uploadImage(payload, (percent) => {
          setUploadProgress(percent);
        });

        if (response) {
          // Response shape:
          // {
          //   status: 1,
          //   data: {
          //     base: "...",
          //     key: "...",
          //     fileUrl: "https://.../images/user/attachment/..."
          //   }
          // }
          const fileUrl = response?.data?.fileUrl || response?.fileUrl || '';
          if (fileUrl) {
            // Store only the URL (string), not an object
            setUploadedFiles(prev => [...prev, fileUrl]);
          }
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      openAlertModal({
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload file. Please try again.',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePostComment = async () => {
    if (!comment.trim()) {
      setErrors(prev => ({ ...prev, comment: 'Comment cannot be empty' }));
      return;
    }
    setIsPostingComment(true);
    try {
      const ticketId = ticket._id || ticket.id;
      await postCommentAPI(ticketId, comment);
      try {
        const userString = localStorage.getItem('user');
        const storedUser = userString ? JSON.parse(userString) : null;
        const currentUser = storedUser?.response?.user;
        const newWorknote = {
          updatedBy: {
            name: currentUser?.authentication?.userName || currentUser?.name || 'Unknown',
            email: currentUser?.authentication?.email || currentUser?.email || '',
            userType: currentUser?.category || 'TENANT',
            phone: currentUser?.phone || '',
          },
          description: comment,
          updatedAt: new Date().toISOString(),
        };
        setWorknoteHistory(prev => [...(prev || []), newWorknote]);
      } catch (e) {
        console.error('Error updating local worknote history:', e);
      }
      setComment('');
      setErrors(prev => ({ ...prev, comment: '' }));
      openAlertModal({
        type: 'success',
        title: 'Comment Posted',
        message: 'Comment posted successfully.',
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      openAlertModal({
        type: 'error',
        title: 'Post Failed',
        message: 'Failed to post comment. Please try again.',
      });
    } finally {
      setIsPostingComment(false);
    }
  };

  const ticketNo = ticket.ticketNo || 'N/A';
  const statusInfo = statusConfig[formData.status] || statusConfig.OPEN;
  const selectedProject = Array.isArray(projects)
    ? projects.find((project) => String(project._id || project.id) === String(formData.project))
    : null;
  const selectedProjectName =
    selectedProject?.name ||
    selectedProject?.projectName ||
    ticket.project?.name ||
    ticket.projectName ||
    'N/A';
  const assigneeName = ticket.assignTo?.name || 'Unassigned';
  const assigneeEmail = ticket.assignTo?.email || '';
  const reportedByName = ticket.reportedBy?.name || 'Unknown';
  const reportedToName = ticket.reportedTo?.name || 'N/A';
  const categoryName = ticket.category?.name || 'N/A';

  // Normalize attachments for display: support both URL strings and objects
  const attachments = (() => {
    const raw = ticket.attachments || [];
    return raw.map((att) => {
      if (typeof att === 'string') {
        return {
          name: att.split('/').pop() || 'Attachment',
          url: att,
          type: 'image/*',
          size: '',
        };
      }
      // Handle objects like { _id, url } or { _id, fileUrl }
      const url = att.url || att.fileUrl || '';
      return {
        ...att,
        name: att.name || url.split('/').pop() || 'Attachment',
        url,
        type: att.type || 'image/*',
        size: att.size || '',
      };
    });
  })();

  const inputClass = 'w-full px-3.5 py-2.5 border-[1.5px] border-slate-200 rounded-[10px] text-sm font-[inherit] bg-slate-50 text-slate-900 transition-all duration-150 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-[3px] focus:ring-blue-500/[0.08] box-border appearance-none bg-no-repeat bg-[length:12px_8px]';
  const selectClass = `${inputClass} pr-9 bg-[url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2364748B' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")] bg-[position:right_12px_center]`;
  const labelClass = 'block text-[13px] font-semibold text-slate-700 mb-1.5';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Two Column Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-[1fr_380px] flex-1 overflow-hidden max-[1100px]:grid-cols-1">
        {/* Left Column */}
        <div className="overflow-y-auto px-7 pt-6 pb-10 border-r border-[#EBECF0] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">

          {/* Back button + Ticket badge row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                title="Back to dashboard"
                className="w-9 h-9 rounded-[10px] border border-slate-200 bg-white flex items-center justify-center cursor-pointer text-slate-400 hover:bg-slate-50 hover:text-slate-600 hover:border-slate-300 transition-all shrink-0"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 text-[11px] font-bold px-2.5 py-0.5 rounded-md tracking-wide">#{ticketNo}</span>
                <span className="text-slate-400 text-[10px]">&bull;</span>
                <span className="text-[11px] font-semibold text-slate-500 tracking-wide uppercase">Project: {selectedProjectName}</span>
              </div>
            </div>
            <span className={`text-xs font-semibold px-4 py-1.5 rounded-full ${statusInfo.bg} ${statusInfo.text}`}>
              {statusInfo.label}
            </span>
          </div>

          {/* Ticket Title */}
          <h1 className="text-[22px] font-bold text-slate-900 leading-tight mb-6">{formData.subject || 'Untitled Ticket'}</h1>

          {/* BASIC INFORMATION */}
          <div className="mb-7">
            <div className="flex items-center gap-2 mb-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B778C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span className="text-xs font-bold text-slate-700 tracking-[0.8px] uppercase">BASIC INFORMATION</span>
            </div>
            <div className="h-px bg-slate-200 mt-2.5 mb-5" />

            <div className="mb-4">
              <label className={labelClass}>Project <span className="text-red-500">*</span></label>
              <select
                name="project"
                value={formData.project}
                onChange={handleProjectChange}
                disabled={projectsLoading}
                className={selectClass}
              >
                <option value="">{projectsLoading ? 'Loading projects...' : 'Select a project'}</option>
                {Array.isArray(projects) && projects.map((project) => {
                  const projectId = project._id || project.id;
                  const projectName = project.name || project.projectName || 'Untitled Project';
                  return (
                    <option key={projectId} value={projectId}>
                      {projectName}
                    </option>
                  );
                })}
              </select>
              {errors.project && <span className="block text-red-500 text-xs mt-1">{errors.project}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
              <div className="mb-0">
                <label className={labelClass}>Category</label>
                <select name="category" value={formData.category} onChange={handleCategoryChange} disabled={categoriesLoading} className={selectClass}>
                  <option value="">{categoriesLoading ? 'Loading...' : 'Select a category'}</option>
                  {Array.isArray(categories) && categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className={labelClass}>Subject</label>
                <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="Enter ticket subject" className={inputClass} />
                {errors.subject && <span className="block text-red-500 text-xs mt-1">{errors.subject}</span>}
              </div>
            </div>

            <div className="mb-4">
              <label className={labelClass}>Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Enter description" className={`${inputClass} resize-y min-h-[120px] overflow-hidden`} style={{ height: 'auto' }} ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }} />
            </div>
          </div>

          {/* ATTACHMENTS */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B778C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.49" />
              </svg>
              <span className="text-xs font-bold text-slate-700 tracking-[0.8px] uppercase">Attachments ({attachments.length + uploadedFiles.length})</span>
            </div>
            <div className="h-px bg-slate-200 mt-2.5 mb-5" />

            <div className="grid grid-cols-3 gap-3.5 max-[1100px]:grid-cols-2 max-[640px]:grid-cols-1">
              {attachments.map((att, idx) => (
                <div key={`existing-${idx}`} className="border-[1.5px] border-slate-200 rounded-xl overflow-hidden bg-white group/card">
                  <div className="h-[120px] bg-slate-100 flex items-center justify-center overflow-hidden relative">
                    {att.type?.startsWith('image') ? (
                      <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    )}
                    {/* Hover overlay with view */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setViewingImage(att.url)}
                        title="View"
                        className="w-9 h-9 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center cursor-pointer border-none transition-all"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="px-3 py-2.5 flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-slate-700 truncate">{att.name || `File ${idx + 1}`}</span>
                    {att.size && <span className="text-[11px] text-slate-400">{att.size}</span>}
                  </div>
                </div>
              ))}

              {uploadedFiles.map((url, idx) => (
                <div key={`uploaded-${idx}`} className="border-[1.5px] border-emerald-200 rounded-xl overflow-hidden bg-white group/card">
                  <div className="h-[120px] bg-slate-100 flex items-center justify-center overflow-hidden relative">
                    {url ? (
                      <img src={url} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    )}
                    {/* Hover overlay with view */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setViewingImage(url)}
                        title="View"
                        className="w-9 h-9 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center cursor-pointer border-none transition-all"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="px-3 py-2.5 flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-slate-700 truncate">
                      {url.split('/').pop() || `File ${idx + 1}`}
                    </span>
                  </div>
                </div>
              ))}

              {/* Upload zone */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,video/*,.pdf"
                multiple
                className="hidden"
              />
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 p-5 transition-all min-h-[120px] ${isUploading ? 'border-blue-300 bg-blue-50/30 cursor-wait' : 'border-slate-300 cursor-pointer hover:border-blue-500 hover:bg-blue-50/30'}`}
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    <span className="text-[13px] font-semibold text-blue-500">Uploading... {uploadProgress}%</span>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                      <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress || 0}%` }} />
                    </div>
                  </>
                ) : (
                  <>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.49" />
                    </svg>
                    <span className="text-[13px] font-semibold text-slate-500">Click to upload</span>
                    <span className="text-[11px] text-slate-400">Image, Video, or PDF</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* STATUS & SCOPE */}
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B778C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-xs font-bold text-slate-700 tracking-[0.8px] uppercase">STATUS & SCOPE</span>
            </div>
            <div className="h-px bg-slate-200 mt-2.5 mb-3" />

            <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
              <div className="mb-4">
                <label className={labelClass}>Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className={selectClass}>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div className="mb-4">
                <label className={labelClass}>Scope</label>
                <select name="scope" value={formData.scope} onChange={handleChange} className={selectClass}>
                  <option value="">Select scope</option>
                  <option value="Customer">Customer</option>
                  <option value="Internal">Internal</option>
                  <option value="Vendor">Vendor</option>
                </select>
              </div>
            </div>
          </div>

          {/* SEVERITY & PRIORITY */}
          <div className="mb-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold text-[#6B778C] leading-none">#</span>
              <span className="text-xs font-bold text-slate-700 tracking-[0.8px] uppercase">SEVERITY & PRIORITY</span>
            </div>
            <div className="h-px bg-slate-200 mt-2.5 mb-5" />

            <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
              <div className="mb-4">
                <label className={labelClass}>Severity</label>
                <select name="severity" value={formData.severity} onChange={handleChange} className={selectClass}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div className="mb-4">
                <label className={labelClass}>Priority Score (0-10)</label>
                <input type="number" name="priority" min="0" max="10" value={formData.priority} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>

          {/* ASSIGN TO / REPORTED TO */}
          <div className="mb-0">
            <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
              <div className="mb-4">
                <label className={labelClass}>Assign To</label>
                <select name="assignTo" value={formData.assignTo?.id || ''} onChange={(e) => handleUserChange(e, 'assignTo')} disabled={usersLoading} className={selectClass}>
                  <option value="">{usersLoading ? 'Loading...' : 'Select a user'}</option>
                  {Array.isArray(users) && users.map(user => (
                    <option key={user._id} value={user._id}>
                      {`${user.name?.first || ''} ${user.name?.last || ''}`.trim() || user.authentication?.userName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className={labelClass}>Reported To</label>
                <select name="reportedTo" value={formData.reportedTo?.id || ''} onChange={(e) => handleUserChange(e, 'reportedTo')} disabled={usersLoading} className={selectClass}>
                  <option value="">{usersLoading ? 'Loading...' : 'Select a user'}</option>
                  {Array.isArray(users) && users.map(user => (
                    <option key={user._id} value={user._id}>
                      {`${user.name?.first || ''} ${user.name?.last || ''}`.trim() || user.authentication?.userName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* TIMELINE */}
          <div className="mb-0">
            <div className="flex items-center gap-2 mb-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B778C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="text-xs font-bold text-slate-700 tracking-[0.8px] uppercase">TIMELINE</span>
            </div>
            <div className="h-px bg-slate-200 mt-2.5 mb-5" />

            <div className="grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
              <div className="mb-4">
                <label className={labelClass}>Start Date & Time</label>
                <input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange} min="1900-01-01T00:00" max="9999-12-31T23:59" className={inputClass} />
              </div>
              <div className="mb-4">
                <label className={labelClass}>End Date & Time</label>
                <input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} min="1900-01-01T00:00" max="9999-12-31T23:59" className={inputClass} />
              </div>
            </div>
          </div>

          {/* DISCUSSION */}
          <div className="mb-7">
            <div className="flex items-center gap-2 mb-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B778C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              <span className="text-xs font-bold text-slate-700 tracking-[0.8px] uppercase">DISCUSSION</span>
            </div>
            <div className="h-px bg-slate-200 mt-2.5 mb-5" />

            <div className="mb-4">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter update or comment..."
                rows="4"
                className={`${inputClass} resize-y min-h-[80px]`}
              />
              {errors.comment && <span className="block text-red-500 text-xs mt-1">{errors.comment}</span>}
            </div>
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={handlePostComment}
                disabled={isPostingComment || !comment.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-[10px] text-sm font-semibold cursor-pointer hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                {isPostingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-200 mt-2">
            <button type="button" onClick={onBack} className="px-7 py-2.5 rounded-[10px] border-[1.5px] border-slate-200 bg-white text-slate-700 text-sm font-semibold cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-all">
              Cancel
            </button>
            <button type="submit" className="px-7 py-2.5 rounded-[10px] border-none bg-blue-500 text-white text-sm font-semibold cursor-pointer hover:bg-blue-600 transition-all">
              Update Ticket
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="overflow-y-auto px-6 pt-6 pb-10 bg-[#FAFBFC] flex flex-col gap-5 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent max-[1100px]:px-7">

          {/* Ticket Information */}
          <div className="bg-white border-[1.5px] border-slate-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-base font-bold text-slate-900">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>Ticket Information</span>
            </div>
            <div className="h-px bg-slate-200 my-3.5" />

            <div className="flex flex-col">
              {[
                { label: 'TICKET NO', value: `#${ticketNo}` },
                { label: 'PROJECT NAME', value: selectedProjectName, highlight: true },
                { label: 'CATEGORY', value: categoryName },
                { label: 'ASSIGNEE', value: assigneeName },
                { label: 'ASSIGNEE EMAIL', value: assigneeEmail || 'N/A' },
                { label: 'REPORTED BY', value: reportedByName },
                { label: 'REPORTED TO', value: reportedToName },
                { label: 'ESCALATED', value: ticket.escalated ? 'Yes' : 'No' },
                { label: 'SCOPE', value: ticket.scope || 'N/A' },
                { label: 'SEVERITY', value: ticket.severity || 'N/A' },
                { label: 'START DATE', value: formatDateDisplay(ticket.startDate), labelColor: 'text-blue-500' },
                { label: 'END DATE', value: formatDateDisplay(ticket.endDate), labelColor: 'text-red-500' },
                { label: 'CREATED DATE', value: formatShortDate(ticket.createdAt) },
              ].map((item, idx) => (
                <div key={idx} className="py-2.5 border-b border-dashed border-slate-100 last:border-b-0 flex flex-col gap-0.5">
                  <span className={`text-[10px] font-bold tracking-[0.8px] uppercase ${item.labelColor || 'text-slate-400'}`}>{item.label}</span>
                  <span className={`text-sm font-semibold text-slate-900 break-words ${item.highlight ? 'text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md inline-block' : ''}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Attachments Preview */}
          {(attachments.length > 0 || uploadedFiles.length > 0) && (
            <div className="bg-white border-[1.5px] border-slate-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.49" />
                </svg>
                <span>Attachments ({attachments.length + uploadedFiles.length})</span>
              </div>
              <div className="h-px bg-slate-200 my-3.5" />

              <div className="flex flex-col gap-3">
                {attachments.map((att, idx) => (
                  <div
                    key={`att-${idx}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      {att.type?.startsWith('image') ? (
                        <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="text-[13px] font-semibold text-slate-700 truncate">{att.name || `File ${idx + 1}`}</span>
                      {att.size && <span className="text-[11px] text-slate-400">{att.size}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewingImage(att.url)}
                      title="View"
                      className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 flex items-center justify-center cursor-pointer transition-all shrink-0"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </div>
                ))}

                {uploadedFiles.map((url, idx) => (
                  <div
                    key={`uploaded-side-${idx}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      <img src={url} alt={`New attachment ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="text-[13px] font-semibold text-slate-700 truncate">{url.split('/').pop() || `File ${idx + 1}`}</span>
                      <span className="text-[10px] font-medium text-emerald-500">New</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewingImage(url)}
                      title="View"
                      className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 flex items-center justify-center cursor-pointer transition-all shrink-0"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Priority Detail */}
          <div className="bg-amber-50 border-[1.5px] border-amber-200 rounded-2xl px-5 py-4">
            <span className="text-[11px] font-bold text-amber-800 tracking-[0.8px] uppercase">PRIORITY DETAIL</span>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-[13px] font-semibold text-red-600">{formData.severity} Severity</span>
              <span className="text-[13px] font-bold text-amber-800 bg-amber-100 px-3.5 py-1 rounded-lg border border-amber-200">Score: {formData.priority}/10</span>
            </div>
          </div>

          {/* Change History */}
          <div className="bg-white border-[1.5px] border-slate-200 rounded-2xl p-5">
            <span className="text-[11px] font-bold text-blue-500 tracking-[0.8px] uppercase">CHANGE HISTORY</span>
            <div className="mt-4 flex flex-col">
              {(!ticket.changeHistory || ticket.changeHistory.length === 0) && (
                <p className="text-[13px] text-slate-400 my-2">No changes yet</p>
              )}
              {(ticket.changeHistory || []).map((change, idx) => (
                <div key={change._id || idx} className="py-2.5 border-b border-dashed border-slate-100 last:border-b-0">
                  <span className="text-[13px] font-semibold text-slate-900">{change.action || 'Updated'}</span>
                  {change.description && <p className="text-[12px] text-slate-500 mt-0.5">{change.description}</p>}
                  <span className="text-[11px] text-slate-400">by {change.updatedBy?.name || 'Unknown'} &middot; {formatDateDisplay(change.updatedAt)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Comment History */}
          <div className="bg-white border-[1.5px] border-slate-200 rounded-2xl p-5">
            <span className="text-[11px] font-bold text-emerald-500 tracking-[0.8px] uppercase">COMMENT HISTORY</span>
            <div className="mt-4 flex flex-col">
              {(!worknoteHistory || worknoteHistory.length === 0) && (
                <p className="text-[13px] text-slate-400 my-2">No comments yet</p>
              )}
              {(worknoteHistory || []).map((wn, idx) => (
                <div key={wn._id || idx} className="py-2.5 border-b border-dashed border-slate-100 last:border-b-0">
                  <span className="text-[13px] font-semibold text-slate-900">{wn.description}</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">by {wn.updatedBy?.name || 'Unknown'} &middot; {formatDateDisplay(wn.updatedAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </form>

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-6"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <div className="flex justify-end w-full mb-3">
              <button
                type="button"
                onClick={() => setViewingImage(null)}
                className="w-9 h-9 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center cursor-pointer border-none transition-all"
                title="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <img
              src={viewingImage}
              alt="Attachment preview"
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

      <AlertModal
        isOpen={alertModal.isOpen}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        onClose={closeAlertModal}
      />
    </div>
  );
};

export default TicketDetailsPage;
