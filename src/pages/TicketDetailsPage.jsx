import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../redux/categorySlice';
import { fetchUsers } from '../redux/userSlice';
import { fetchProjects } from '../redux/projectSlice';
import { postCommentAPI, uploadImage } from '../services/api';
import { getProjectMembersAPI } from '../services/projectApi';
import { deleteTicket, updateTicket } from '../redux/ticketSlice';
import { fileToBase64 } from '../function/function';
import AlertModal from '../components/shared/AlertModal';
import DeleteConfirmModal from '../components/shared/DeleteConfirmModal';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EstimateTimePicker from '../components/shared/EstimateTimePicker';
import { getAvatarColor, getInitials } from '../utils/avatar';

const statusConfig = {
  OPEN:        { label: 'Open',        bg: 'bg-[#EEF5FF]',   text: 'text-[#0880EA]',   dot: 'bg-[#0880EA]',   solid: 'bg-[#0880EA] text-white' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-[#FFF9EC]',   text: 'text-[#f59e0b]',   dot: 'bg-[#f59e0b]',   solid: 'bg-[#f59e0b] text-white' },
  RESOLVED:    { label: 'Resolved',    bg: 'bg-[#EDFAF4]',   text: 'text-[#299764]',   dot: 'bg-[#299764]',   solid: 'bg-[#299764] text-white' },
  BACKLOG:     { label: 'Backlog',     bg: 'bg-[#F5EFEC]',   text: 'text-[#a18072]',   dot: 'bg-[#a18072]',   solid: 'bg-[#a18072] text-white' },
  CLOSED:      { label: 'Closed',      bg: 'bg-[#F3F4F6]',   text: 'text-[#656F7D]',   dot: 'bg-[#656F7D]',   solid: 'bg-[#656F7D] text-white' },
};

const severityConfig = {
  Low:      { label: 'Low',      bg: 'bg-sky-50',    text: 'text-sky-700',    ring: 'ring-sky-200',    flag: 'text-sky-500',    fill: 'bg-sky-500' },
  Medium:   { label: 'Medium',   bg: 'bg-amber-50',  text: 'text-amber-700',  ring: 'ring-amber-200',  flag: 'text-amber-500',  fill: 'bg-amber-500' },
  High:     { label: 'High',     bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', flag: 'text-orange-500', fill: 'bg-orange-500' },
  Critical: { label: 'Critical', bg: 'bg-red-50',    text: 'text-red-700',    ring: 'ring-red-200',    flag: 'text-red-500',    fill: 'bg-red-500' },
};

const Avatar = ({ name, email, size = 'md', ring = false }) => {
  const sizeCls = size === 'xs' ? 'w-5 h-5 text-[9px]' : size === 'sm' ? 'w-6 h-6 text-[10px]' : size === 'lg' ? 'w-10 h-10 text-sm' : 'w-7 h-7 text-[11px]';
  const label = name || email || '';
  const ringCls = ring ? 'ring-2 ring-white' : '';
  if (!label) {
    return (
      <div className={`${sizeCls} rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold shrink-0 border border-dashed border-slate-300 ${ringCls}`} title="Unassigned">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
    );
  }
  return (
    <div
      className={`${sizeCls} rounded-full text-white flex items-center justify-center font-bold shrink-0 ${ringCls}`}
      style={{ backgroundColor: getAvatarColor(label) }}
      title={label}
    >
      {getInitials(label)}
    </div>
  );
};

const getDueDateInfo = (endDate) => {
  if (!endDate) return null;
  const end = new Date(endDate).getTime();
  if (Number.isNaN(end)) return null;
  const diffDays = Math.round((end - Date.now()) / (24 * 60 * 60 * 1000));
  if (diffDays < 0) {
    const n = Math.abs(diffDays);
    return { text: `Overdue ${n}d`, tone: 'text-red-600', pill: 'bg-red-50 ring-red-200 text-red-700' };
  }
  if (diffDays === 0) return { text: 'Due today', tone: 'text-amber-600', pill: 'bg-amber-50 ring-amber-200 text-amber-700' };
  if (diffDays <= 3) return { text: `${diffDays}d left`, tone: 'text-amber-600', pill: 'bg-amber-50 ring-amber-200 text-amber-700' };
  return { text: `${diffDays}d left`, tone: 'text-slate-500', pill: 'bg-slate-50 ring-slate-200 text-slate-600' };
};

const PropertyRow = ({ icon, label, children }) => (
  <div className="flex items-start gap-2 sm:gap-3 py-2 min-h-[40px] border-b border-dashed border-slate-100 last:border-b-0">
    <div className="flex items-center gap-2 w-[130px] shrink-0 text-slate-500 pt-1.5 max-[640px]:w-[110px]">
      {icon}
      <span className="text-[12px] font-semibold">{label}</span>
    </div>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

const normalizeAttachmentUrls = (attachmentsInput) => {
  const attachments = Array.isArray(attachmentsInput)
    ? attachmentsInput
    : attachmentsInput
      ? [attachmentsInput]
      : [];

  return attachments
    .map((attachment) => {
      if (typeof attachment === 'string') return attachment.trim();
      if (attachment && typeof attachment === 'object') return (attachment.url || attachment.fileUrl || '').trim();
      return '';
    })
    .filter(Boolean);
};

const TicketDetailsPage = ({ ticket, onBack, onUpdate }) => {
  const dispatch = useDispatch();
  const { categories, loading: categoriesLoading } = useSelector((state) => state.categories);
  const { users } = useSelector((state) => state.users);
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

  const parseDurationToMs = (value) => {
    if (value == null) return 0;
    if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value);
    const str = String(value).trim();
    if (!str) return 0;
    const hoursMatch = str.match(/(\d+)\s*h/i);
    const minutesMatch = str.match(/(\d+)\s*m/i);
    if (!hoursMatch && !minutesMatch) return 0;
    const h = hoursMatch ? Number(hoursMatch[1]) : 0;
    const m = minutesMatch ? Number(minutesMatch[1]) : 0;
    return (h * 60 + m) * 60 * 1000;
  };

  const initialFormData = {
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
    timeEstimateMs: Number(ticket.timeEstimateMs) || parseDurationToMs(ticket.estimateTime) || 0,
  };
  const [formData, setFormData] = useState(initialFormData);
  const initialSnapshotRef = useRef(JSON.stringify(initialFormData));

  const timerStorageKey = `ticket-timer-${ticket._id || ticket.id || ticket.ticketNo}`;
  const timerBackendMs =
    Number(ticket.trackedTimeMs) ||
    Number(ticket.timeTracked) ||
    parseDurationToMs(ticket.trackTime) ||
    parseDurationToMs(ticket.trackedTime) ||
    0;

  const [trackedTimeMs, setTrackedTimeMs] = useState(() => {
    try {
      const raw = localStorage.getItem(timerStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.trackedTimeMs === 'number') return parsed.trackedTimeMs;
      }
    } catch { /* ignore */ }
    return timerBackendMs;
  });
  const [timerStartAt, setTimerStartAt] = useState(() => {
    try {
      const raw = localStorage.getItem(timerStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.timerStartAt === 'number') return parsed.timerStartAt;
      }
    } catch { /* ignore */ }
    return null;
  });
  const [, setTimerNow] = useState(Date.now());

  useEffect(() => {
    try {
      localStorage.setItem(
        timerStorageKey,
        JSON.stringify({ trackedTimeMs, timerStartAt })
      );
    } catch { /* ignore quota errors */ }
  }, [timerStorageKey, trackedTimeMs, timerStartAt]);

  const [projectMembers, setProjectMembers] = useState([]);
  const [projectMembersLoading, setProjectMembersLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [worknoteHistory, setWorknoteHistory] = useState(ticket.worknoteHistory || []);
  const [errors, setErrors] = useState({});
  const [isPostingComment, setIsPostingComment] = useState(false);
  // Stores newly uploaded attachment URLs (strings)
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activityTab, setActivityTab] = useState('all');
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descModalOpen, setDescModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const fetchProjectMembers = async (projectId) => {
    if (!projectId) { setProjectMembers([]); return; }
    setProjectMembersLoading(true);
    try {
      const res = await getProjectMembersAPI(projectId);
      const { owner, members = [] } = res?.data || {};
      const all = [];
      if (owner) all.push({ id: owner.id, name: owner.name, email: owner.email, phone: owner.phone });
      members.forEach((m) => all.push({ id: m.id, name: m.name, email: m.email, phone: m.phone }));
      setProjectMembers(all);
    } catch {
      setProjectMembers([]);
    } finally {
      setProjectMembersLoading(false);
    }
  };

  useEffect(() => {
    const initialProjectId = ticket.project?.id || ticket.project?._id || ticket.project || '';
    if (initialProjectId) fetchProjectMembers(initialProjectId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!timerStartAt) return undefined;
    const id = setInterval(() => setTimerNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timerStartAt]);

  const toggleTimer = () => {
    if (timerStartAt) {
      const newTrackedMs = trackedTimeMs + (Date.now() - timerStartAt);
      setTrackedTimeMs(newTrackedMs);
      setTimerStartAt(null);
      const ticketId = ticket._id || ticket.id;
      if (ticketId) {
        dispatch(updateTicket({
          ticketId,
          ticketData: { trackedTimeMs: newTrackedMs },
        }));
      }
    } else {
      setTimerStartAt(Date.now());
    }
  };

  const formatDuration = (ms) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const currentTrackedMs = trackedTimeMs + (timerStartAt ? Date.now() - timerStartAt : 0);
  const timerRunning = !!timerStartAt;

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
    setFormData((prev) => ({ ...prev, project: value, assignTo: null, reportedTo: null }));
    if (errors.project) setErrors((prev) => ({ ...prev, project: '' }));
    fetchProjectMembers(value);
  };

  const handleUserChange = (e, field) => {
    const userId = e.target.value;
    const member = projectMembers.find((m) => m.id === userId);
    if (member) {
      setFormData(prev => ({ ...prev, [field]: { id: member.id, name: member.name, email: member.email, phone: member.phone } }));
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
      return;
    }
    const selectedUser = users.find(user => user._id === userId);
    if (selectedUser) {
      setFormData(prev => ({
        ...prev,
        [field]: {
          id: selectedUser._id,
          name: `${selectedUser.name?.first || ''} ${selectedUser.name?.last || ''}`.trim() || selectedUser.authentication?.userName,
          email: selectedUser.authentication?.email,
          userType: selectedUser.category,
          phone: selectedUser.authentication?.phone,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: null }));
    }
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
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
    const existingUrls = normalizeAttachmentUrls(ticket.attachments || []);
    const mergedAttachments = [...existingUrls, ...uploadedFiles];

    const totalTrackedMs = trackedTimeMs + (timerStartAt ? Date.now() - timerStartAt : 0);
    setIsSubmitting(true);
    try {
      const updatedFields = {};
      const setIfChanged = (key, nextValue, currentValue) => {
        if (JSON.stringify(nextValue) !== JSON.stringify(currentValue)) {
          updatedFields[key] = nextValue;
        }
      };

      setIfChanged('subject', formData.subject, initialFormData.subject);
      setIfChanged('description', formData.description, initialFormData.description);
      setIfChanged('priority', Number(formData.priority), Number(initialFormData.priority));
      setIfChanged('severity', formData.severity, initialFormData.severity);
      setIfChanged('assignTo', formData.assignTo, initialFormData.assignTo);
      setIfChanged('reportedTo', formData.reportedTo, initialFormData.reportedTo);
      setIfChanged('status', formData.status, initialFormData.status);
      setIfChanged('project', formData.project, initialFormData.project);
      setIfChanged('category', formData.category, initialFormData.category);
      setIfChanged('scope', formData.scope, initialFormData.scope);
      setIfChanged('startDate', formData.startDate || null, initialFormData.startDate || null);
      setIfChanged('endDate', formData.endDate || null, initialFormData.endDate || null);
      setIfChanged('timeEstimateMs', Number(formData.timeEstimateMs) || 0, Number(initialFormData.timeEstimateMs) || 0);
      setIfChanged('attachments', mergedAttachments, existingUrls);
      setIfChanged('trackedTimeMs', totalTrackedMs, initialTrackedMs);

      if (Object.keys(updatedFields).length === 0) {
        setIsSubmitting(false);
        return;
      }

      await onUpdate({
        _id: ticket._id || ticket.id,
        ...updatedFields,
      });
      localStorage.removeItem(timerStorageKey);
      initialSnapshotRef.current = JSON.stringify(formData);
      setUploadedFiles([]);
    } finally {
      setIsSubmitting(false);
    }
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

  const handleDeleteTicket = async () => {
    const ticketId = ticket._id || ticket.id;
    if (!ticketId) return;
    setIsDeleting(true);
    try {
      const result = await dispatch(deleteTicket(ticketId));
      if (deleteTicket.fulfilled.match(result)) {
        setDeleteConfirmOpen(false);
        onBack?.();
      } else {
        openAlertModal({
          type: 'error',
          title: 'Delete Failed',
          message: result.payload || 'Failed to delete ticket.',
        });
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      openAlertModal({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete ticket. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const ticketNo = ticket.ticketNo || 'N/A';
  const initialTrackedMs =
    Number(ticket.trackedTimeMs) ||
    Number(ticket.timeTracked) ||
    parseDurationToMs(ticket.trackTime) ||
    parseDurationToMs(ticket.trackedTime) ||
    0;
  const isDirty =
    JSON.stringify(formData) !== initialSnapshotRef.current ||
    uploadedFiles.length > 0 ||
    trackedTimeMs !== initialTrackedMs ||
    timerRunning;
  const statusInfo = statusConfig[formData.status] || statusConfig.OPEN;

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

  const inputClass = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] font-[inherit] bg-white text-slate-900 transition-all duration-150 focus:outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/[0.08] box-border appearance-none bg-no-repeat bg-[length:12px_8px]';
  const chipInputClass = 'w-full px-2 py-1.5 text-[13px] font-semibold rounded-md border border-transparent bg-transparent text-slate-800 hover:bg-slate-50 hover:border-slate-200 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all box-border';
  const chipTriggerClass = 'w-full border-transparent bg-transparent text-slate-800 font-semibold text-[13px] hover:bg-slate-50 hover:border-slate-200 focus-visible:bg-white focus-visible:border-blue-400 focus-visible:ring-blue-100 transition-all shadow-none';

  const sevInfo = severityConfig[formData.severity] || severityConfig.Medium;
  const due = getDueDateInfo(ticket.endDate);

  // Combined activity feed (changes + comments)
  const activityEvents = (() => {
    const events = [];
    (ticket.changeHistory || []).forEach((c, i) => events.push({
      kind: 'change', id: c._id || `c${i}`,
      by: c.updatedBy, at: c.updatedAt,
      text: c.description || c.action || 'Updated',
      action: c.action,
    }));
    (worknoteHistory || []).forEach((w, i) => events.push({
      kind: 'comment', id: w._id || `w${i}`,
      by: w.updatedBy, at: w.updatedAt,
      text: w.description,
    }));
    events.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
    return events;
  })();
  const visibleEvents = activityTab === 'all'
    ? activityEvents
    : activityEvents.filter((e) => (activityTab === 'comments' ? e.kind === 'comment' : e.kind === 'change'));

  // Icons reused in property rows
  const iconStatus     = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  const iconUser       = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
  const iconCalendar   = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
  const iconFlag       = <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 2v20h2v-8h12l-2-4 2-4H6V2H4z"/></svg>;
  const iconTag        = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
  const iconFolder     = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
  const iconGlobe      = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;

  return (
    <div className="h-svh flex flex-col overflow-hidden">
      <form onSubmit={handleSubmit} className="relative flex flex-1 overflow-hidden">

        {/* ===== LEFT: Main content ===== */}
        <div className="flex-1 overflow-y-auto min-w-0 scroll-hover">

          {/* Sticky mini top bar */}
          <div className="sticky top-0 z-20 flex items-center justify-between gap-2 px-5 py-2.5 bg-white/90 backdrop-blur border-b border-slate-200 max-[640px]:px-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                type="button"
                onClick={onBack}
                title="Back"
                className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-slate-500 hover:bg-slate-100 transition-all shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div className="flex items-center px-2 py-1 rounded-md">
                <span className="text-[12px] font-semibold text-slate-700">Task</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(`#${ticketNo}`);
                  openAlertModal({ type: 'success', title: 'Copied', message: 'Ticket ID copied to clipboard.' });
                }}
                title="Copy ID"
                className="font-mono text-[12px] text-slate-500 px-2 py-0.5 rounded hover:bg-slate-100 cursor-pointer transition-all max-[480px]:hidden"
              >
                #{ticketNo}
              </button>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" title="More" className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-slate-500 hover:bg-slate-100 transition-all">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    onSelect={() => setDeleteConfirmOpen(true)}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
                    Delete task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="w-px h-5 bg-slate-200 mx-1 min-[1101px]:hidden" />
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                title="Activity"
                className="min-[1101px]:hidden relative flex items-center gap-1 px-2 h-7 rounded-md cursor-pointer text-slate-600 hover:bg-slate-100 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <span className="text-[12px] font-semibold">Activity</span>
                {activityEvents.length > 0 && <span className="text-[10px] font-bold bg-blue-500 text-white rounded-full px-1.5 min-w-[16px] text-center">{activityEvents.length}</span>}
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 pt-5 pb-8 max-w-[960px] max-[640px]:px-4">
            {/* Title (editable) */}
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Untitled Ticket"
              aria-label="Ticket title"
              className={`w-full text-[28px] font-bold text-slate-900 px-2 -mx-2 py-1 mb-1 bg-transparent border border-transparent rounded-md outline-none hover:bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all max-[640px]:text-[22px] ${errors.subject ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''}`}
            />
            {errors.subject && (
              <div className="text-red-500 text-xs px-2 -mx-2 mb-2">{errors.subject}</div>
            )}
            <div className="mb-3" />

            {/* Hero quick chips */}
            <div className="flex items-center flex-wrap gap-2 mb-6">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md ${statusInfo.solid}`}>
                {statusInfo.label}
              </span>
              {due && (
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md ring-1 ${due.pill}`}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {due.text}
                </span>
              )}
              <span className="text-[11px] text-slate-400 font-medium">Created {formatShortDate(ticket.createdAt)}</span>
            </div>

            {/* Properties grid — ClickUp-style */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-0 mb-6 max-[720px]:grid-cols-1 max-[720px]:gap-x-0 border-t border-slate-100">
              <PropertyRow icon={iconCalendar} label="Start Date">
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  min="1900-01-01T00:00"
                  max="9999-12-31T23:59"
                  className={chipInputClass}
                />
              </PropertyRow>

              <PropertyRow icon={iconCalendar} label="End Date">
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min="1900-01-01T00:00"
                  max="9999-12-31T23:59"
                  className={chipInputClass}
                />
              </PropertyRow>

              <PropertyRow
                icon={iconFolder}
                label={<span>Project <span className="text-red-500">*</span></span>}
              >
                <Select
                  value={formData.project || undefined}
                  onValueChange={(value) => handleProjectChange({ target: { value } })}
                  disabled={projectsLoading}
                >
                  <SelectTrigger size="sm" className={chipTriggerClass}>
                    <SelectValue placeholder={projectsLoading ? 'Loading projects...' : 'Empty'} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(projects) && projects.map((project) => {
                      const projectId = project._id || project.id;
                      const projectName = project.name || project.projectName || 'Untitled Project';
                      return (
                        <SelectItem key={projectId} value={projectId}>{projectName}</SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {errors.project && <span className="block text-red-500 text-xs mt-1 px-2">{errors.project}</span>}
              </PropertyRow>

              <PropertyRow icon={iconUser} label="Assignee">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar name={formData.assignTo?.name} email={formData.assignTo?.email} size="sm" />
                  <div className="flex-1 min-w-0">
                    <Select
                      value={formData.assignTo?.id || undefined}
                      onValueChange={(value) => handleUserChange({ target: { value } }, 'assignTo')}
                      disabled={projectMembersLoading}
                    >
                      <SelectTrigger size="sm" className={chipTriggerClass}>
                        <SelectValue placeholder="Empty" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectMembers.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PropertyRow>

              <PropertyRow icon={iconStatus} label="Status">
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange({ target: { name: 'status', value } })}
                >
                  <SelectTrigger size="sm" className={chipTriggerClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="BACKLOG">Backlog</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </PropertyRow>

              <PropertyRow icon={iconUser} label="Reported To">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar name={formData.reportedTo?.name} email={formData.reportedTo?.email} size="sm" />
                  <div className="flex-1 min-w-0">
                    <Select
                      value={formData.reportedTo?.id || undefined}
                      onValueChange={(value) => handleUserChange({ target: { value } }, 'reportedTo')}
                      disabled={projectMembersLoading}
                    >
                      <SelectTrigger size="sm" className={chipTriggerClass}>
                        <SelectValue placeholder="Empty" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectMembers.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PropertyRow>

              <PropertyRow icon={iconTag} label="Category">
                <Select
                  value={formData.category || undefined}
                  onValueChange={(value) => handleCategoryChange({ target: { value } })}
                  disabled={categoriesLoading}
                >
                  <SelectTrigger size="sm" className={chipTriggerClass}>
                    <SelectValue placeholder={categoriesLoading ? 'Loading...' : 'Empty'} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(categories) && categories.map(cat => (
                      <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PropertyRow>

              <PropertyRow
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>}
                label="Priority"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    name="priority"
                    min="0"
                    max="10"
                    value={formData.priority}
                    onChange={handleChange}
                    className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex items-baseline">
                    <input
                      type="number"
                      name="priority"
                      min="0"
                      max="10"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-6 p-0 text-[12px] font-bold text-slate-700 bg-transparent border-0 outline-none appearance-none text-right [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                    />
                    <span className="text-[12px] font-bold text-slate-400">/10</span>
                  </div>
                </div>
              </PropertyRow>

              <PropertyRow icon={iconGlobe} label="Scope">
                <Select
                  value={formData.scope || undefined}
                  onValueChange={(value) => handleChange({ target: { name: 'scope', value } })}
                >
                  <SelectTrigger size="sm" className={chipTriggerClass}>
                    <SelectValue placeholder="Empty" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const presets = ['CUSTOMER', 'INTERNAL', 'VENDOR'];
                      const current = formData.scope;
                      const options = current && !presets.some((p) => p.toLowerCase() === String(current).toLowerCase())
                        ? [current, ...presets]
                        : presets;
                      return options.map((scope) => (
                        <SelectItem key={scope} value={scope}>
                          {scope.charAt(0).toUpperCase() + scope.slice(1).toLowerCase()}
                        </SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
              </PropertyRow>

              <PropertyRow icon={iconFlag} label="Severity">
                <Select
                  value={formData.severity}
                  onValueChange={(value) => handleChange({ target: { name: 'severity', value } })}
                >
                  <SelectTrigger
                    size="sm"
                    className={`${sevInfo.bg} ${sevInfo.text} ring-1 ${sevInfo.ring} border-0 shadow-none rounded-md font-bold h-auto py-1 pl-2 pr-2 w-auto min-w-[120px] gap-1.5 data-[placeholder]:text-current [&_svg:not([class*='text-'])]:text-current`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Critical', 'High', 'Medium', 'Low'].map((key) => {
                      const cfg = severityConfig[key];
                      return (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className={cfg.flag}><path d="M4 2v20h2v-8h12l-2-4 2-4H6V2H4z"/></svg>
                            <span className="font-semibold">{key}</span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </PropertyRow>

              <PropertyRow
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                label="Track Time"
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleTimer}
                    title={timerRunning ? 'Stop timer' : 'Start timer'}
                    className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all shrink-0 ${timerRunning ? 'bg-red-500 text-white hover:bg-red-600 ring-2 ring-red-200 animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-blue-500 hover:text-white'}`}
                  >
                    {timerRunning ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>
                    )}
                  </button>
                  {timerRunning ? (
                    <span className="text-[13px] font-bold tabular-nums text-red-600">
                      {formatDuration(currentTrackedMs)}
                    </span>
                  ) : (
                    <EstimateTimePicker
                      valueMs={trackedTimeMs}
                      onChange={(ms) => setTrackedTimeMs(ms)}
                      placeholder="Set track time"
                      label="Track time"
                      showIcon={false}
                    />
                  )}
                  {currentTrackedMs >= 60000 && !timerRunning && (
                    <button
                      type="button"
                      onClick={() => setTrackedTimeMs(0)}
                      title="Reset"
                      className="text-[11px] text-slate-400 hover:text-red-500 px-1 cursor-pointer transition-all"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </PropertyRow>

              <PropertyRow
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/><path d="M16 2l4 4"/><path d="M8 2L4 6"/></svg>}
                label="Time Estimate"
              >
                <EstimateTimePicker
                  valueMs={formData.timeEstimateMs}
                  onChange={(ms) => setFormData((prev) => ({ ...prev, timeEstimateMs: ms }))}
                />
              </PropertyRow>
            </div>

            {/* Description */}
            <div className="mb-7 group/descsection">
              <div className="flex items-center gap-2 mb-2 text-slate-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>
                <span className="text-[12px] font-bold uppercase tracking-wide">Description</span>
                <button
                  type="button"
                  onClick={() => setDescModalOpen(true)}
                  className="ml-auto w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors opacity-0 group-hover/descsection:opacity-100 max-[640px]:opacity-100"
                  title="Full screen"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                </button>
              </div>
              {editingDesc ? (
                <div>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    autoFocus
                    placeholder="Add a description..."
                    className={`${inputClass} resize-y min-h-[100px] border-transparent bg-slate-50/60 hover:bg-slate-50 focus:bg-white focus:border-blue-500`}
                  />
                  <button
                    type="button"
                    onClick={() => setEditingDesc(false)}
                    className="mt-1 text-[12px] text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div
                  className="border border-slate-200 rounded-lg bg-slate-50/60 hover:bg-slate-50 cursor-text transition-colors"
                  onClick={() => setEditingDesc(true)}
                >
                  {formData.description ? (
                    <>
                      <p className={`px-3 pt-3 text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed ${!showFullDesc ? 'line-clamp-[8]' : ''}`}>
                        {formData.description}
                      </p>
                      {formData.description.split('\n').length > 8 || formData.description.length > 480 ? (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setShowFullDesc(v => !v); }}
                          className="w-full py-2 text-[12px] text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1 cursor-pointer mt-2"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showFullDesc ? 'rotate-180' : ''}`}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                          {showFullDesc ? 'Show less' : 'Show more'}
                        </button>
                      ) : <div className="pb-2" />}
                    </>
                  ) : (
                    <p className="px-3 py-3 text-[13px] text-slate-400 italic">Add a description...</p>
                  )}
                </div>
              )}
            </div>

            {/* Description dialog */}
            {descModalOpen && createPortal(
              <div className="fixed inset-0 z-[9999] flex flex-col bg-white">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDescModalOpen(false)}
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Back to task
                  </button>
                  <button type="button" onClick={() => setDescModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-3xl mx-auto px-5 sm:px-6 py-8">
                    <h2 className="text-[22px] font-bold text-slate-900 mb-6">{formData.subject || ticket.subject || ''}</h2>
                    <p className="text-[14px] text-slate-700 whitespace-pre-wrap leading-7">
                      {formData.description || <span className="text-slate-400 italic">No description provided.</span>}
                    </p>
                  </div>
                </div>
              </div>,
              document.body
            )}

            {/* Attachments */}
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-2 text-slate-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.49"/></svg>
                <span className="text-[12px] font-bold uppercase tracking-wide">
                  Attachments <span className="text-slate-400 font-semibold normal-case">({attachments.length + uploadedFiles.length})</span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 max-[720px]:grid-cols-2 max-[420px]:grid-cols-1">
                {attachments.map((att, idx) => (
                  <div key={`existing-${idx}`} className="border border-slate-200 rounded-lg overflow-hidden bg-white group/card hover:border-blue-300 transition-all">
                    <div className="h-[100px] bg-slate-100 flex items-center justify-center overflow-hidden relative">
                      {att.type?.startsWith('image') ? (
                        <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setViewingImage(att.url)}
                          title="View"
                          className="w-8 h-8 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center cursor-pointer border-none transition-all"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      </div>
                    </div>
                    <div className="px-2.5 py-1.5">
                      <span className="text-[11px] font-semibold text-slate-700 truncate block">{att.name || `File ${idx + 1}`}</span>
                    </div>
                  </div>
                ))}

                {uploadedFiles.map((url, idx) => (
                  <div key={`uploaded-${idx}`} className="border border-emerald-200 rounded-lg overflow-hidden bg-white group/card">
                    <div className="h-[100px] bg-slate-100 flex items-center justify-center overflow-hidden relative">
                      <img src={url} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setViewingImage(url)}
                          title="View"
                          className="w-8 h-8 rounded-lg bg-white/90 hover:bg-white flex items-center justify-center cursor-pointer border-none transition-all"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      </div>
                      <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded">NEW</span>
                    </div>
                    <div className="px-2.5 py-1.5">
                      <span className="text-[11px] font-semibold text-slate-700 truncate block">{url.split('/').pop() || `File ${idx + 1}`}</span>
                    </div>
                  </div>
                ))}

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
                  className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 p-3 transition-all min-h-[100px] ${isUploading ? 'border-blue-300 bg-blue-50/30 cursor-wait' : 'border-slate-300 cursor-pointer hover:border-blue-500 hover:bg-blue-50/30'}`}
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      <span className="text-[11px] font-semibold text-blue-500">{uploadProgress}%</span>
                      <div className="w-full bg-slate-200 rounded-full h-1 mt-0.5">
                        <div className="bg-blue-500 h-1 rounded-full transition-all" style={{ width: `${uploadProgress || 0}%` }} />
                      </div>
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.49"/></svg>
                      <span className="text-[11px] font-semibold text-slate-500">Upload</span>
                      <span className="text-[10px] text-slate-400">Image, Video, PDF</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end items-center gap-3 pt-5 border-t border-slate-200 flex-wrap">
              <Button type="button" variant="outline" onClick={onBack}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isDirty || isSubmitting}
                className="!bg-[#5449D6] text-white border-transparent hover:!bg-[#5449D6] hover:text-white hover:brightness-110 focus-visible:ring-[#5449D6]/30 inline-flex items-center gap-2"
              >
                {isSubmitting && <Spinner className="size-4" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        {/* ===== RIGHT: Activity sidebar (desktop inline, mobile drawer) ===== */}
        <aside
          className={`bg-white flex flex-col w-[400px] shrink-0 border-l border-slate-200 max-[1100px]:fixed max-[1100px]:inset-y-0 max-[1100px]:right-0 max-[1100px]:w-[min(400px,100vw)] max-[1100px]:shadow-2xl max-[1100px]:z-50 transition-transform duration-300 ${sidebarOpen ? '' : 'max-[1100px]:translate-x-full'}`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <h2 className="text-[14px] font-bold text-slate-900">Activity</h2>
              {activityEvents.length > 0 && <span className="text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">{activityEvents.length}</span>}
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              title="Close"
              className="min-[1101px]:hidden w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-slate-500 hover:bg-slate-100 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div className="flex gap-1 px-3 py-2 border-b border-slate-200 shrink-0">
            {[
              { id: 'all', label: 'All' },
              { id: 'comments', label: 'Comments' },
              { id: 'history', label: 'History' },
            ].map(t => (
              <button
                type="button"
                key={t.id}
                onClick={() => setActivityTab(t.id)}
                className={`px-3 py-1 rounded-md text-[12px] font-semibold transition-all ${
                  activityTab === t.id ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 scroll-hover">
            {visibleEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-10">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-50"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg>
                <p className="text-[13px] font-medium">No activity yet</p>
                <p className="text-[11px] mt-1">Changes and comments will show here.</p>
              </div>
            ) : (
              <div className="relative pl-5">
                <div className="absolute left-[9px] top-1 bottom-1 w-px bg-slate-200" />
                {visibleEvents.map((e) => (
                  <div key={`${e.kind}-${e.id}`} className="relative pb-4 last:pb-0">
                    <span className={`absolute -left-[16px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white ${e.kind === 'comment' ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                      {e.kind === 'comment' ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </span>
                    <div className="flex items-start gap-2">
                      <Avatar name={e.by?.name} email={e.by?.email} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[12px] font-semibold text-slate-800">{e.by?.name || 'Unknown'}</span>
                          <span className="text-[11px] text-slate-400">{e.kind === 'comment' ? 'commented' : (e.action || 'updated')}</span>
                          <span className="text-slate-300 text-[11px]">&middot;</span>
                          <span className="text-[11px] text-slate-400">{formatDateDisplay(e.at)}</span>
                        </div>
                        {e.text && (
                          <div className={`mt-1 text-[13px] text-slate-700 break-words whitespace-pre-wrap ${e.kind === 'comment' ? 'bg-slate-50 rounded-lg px-2.5 py-1.5' : ''}`}>
                            {e.text}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 p-3 shrink-0 bg-white">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a comment..."
              rows="2"
              className={`${inputClass} resize-y min-h-[44px] text-[13px]`}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  if (comment.trim() && !isPostingComment) handlePostComment();
                }
              }}
            />
            {errors.comment && <span className="block text-red-500 text-xs mt-1">{errors.comment}</span>}
            <div className="flex justify-between items-center mt-2">
              <span className="text-[10px] text-slate-400 font-medium">&#8984; + Enter to send</span>
              <Button
                type="button"
                size="sm"
                onClick={handlePostComment}
                disabled={isPostingComment || !comment.trim()}
                className="!bg-[#5449D6] text-white border-transparent hover:!bg-[#5449D6] hover:text-white hover:brightness-110 focus-visible:ring-[#5449D6]/30"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                {isPostingComment ? 'Posting...' : 'Send'}
              </Button>
            </div>
          </div>
        </aside>

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="min-[1101px]:hidden fixed inset-0 bg-black/30 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
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

      <DeleteConfirmModal
        isOpen={deleteConfirmOpen}
        title="Delete task?"
        message={`Are you sure you want to delete "${formData.subject || `#${ticketNo}`}"? This action cannot be undone.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        onCancel={() => !isDeleting && setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteTicket}
      />

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
