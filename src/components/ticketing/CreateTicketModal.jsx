import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../../redux/categorySlice';
import { fetchUsers } from '../../redux/userSlice';
import { fetchProjects } from '../../redux/projectSlice';
import { getProjectMembersAPI } from '../../services/projectApi';
import { uploadImage } from '../../services/api';
import { fileToBase64 } from '../../function/function';
import '../../assets/Styles/Modal.css';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import EstimateTimePicker from '../shared/EstimateTimePicker';
import { getAvatarColor, getInitials } from '../../utils/avatar';

const severityConfig = {
  Low:      { label: 'Low',      bg: 'bg-sky-50',    text: 'text-sky-700',    ring: 'ring-sky-200',    flag: 'text-sky-500' },
  Medium:   { label: 'Medium',   bg: 'bg-amber-50',  text: 'text-amber-700',  ring: 'ring-amber-200',  flag: 'text-amber-500' },
  High:     { label: 'High',     bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', flag: 'text-orange-500' },
  Critical: { label: 'Critical', bg: 'bg-red-50',    text: 'text-red-700',    ring: 'ring-red-200',    flag: 'text-red-500' },
};

const Avatar = ({ name, email }) => {
  const label = name || email || '';
  if (!label) {
    return (
      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold shrink-0 border border-dashed border-slate-300">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
    );
  }
  return (
    <div
      className="w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold shrink-0"
      style={{ backgroundColor: getAvatarColor(label) }}
      title={label}
    >
      {getInitials(label)}
    </div>
  );
};

const PropertyRow = ({ icon, label, children }) => (
  <div className="flex items-start gap-3 py-2 min-h-[40px] border-b border-dashed border-slate-100 last:border-b-0">
    <div className="flex items-center gap-2 w-[130px] shrink-0 text-slate-500 pt-1.5 max-[640px]:w-[110px]">
      {icon}
      <span className="text-[12px] font-semibold">{label}</span>
    </div>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

const iconUser     = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const iconCalendar = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const iconFlag     = <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 2v20h2v-8h12l-2-4 2-4H6V2H4z"/></svg>;
const iconPriority = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>;
const iconTag      = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
const iconFolder   = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const iconGlobe    = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const iconClock    = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>;

const chipTriggerClass = 'w-full border-transparent bg-transparent text-slate-800 font-semibold text-[13px] hover:bg-slate-50 hover:border-slate-200 focus-visible:bg-white focus-visible:border-blue-400 focus-visible:ring-blue-100 transition-all shadow-none';

const CreateTicketModal = ({ onClose, onCreate, initialData }) => {
  const dispatch = useDispatch();
  const { categories, loading: categoriesLoading } = useSelector((state) => state.categories);
  const { users, loading: usersLoading } = useSelector((state) => state.users);
  const { projects, loading: projectsLoading } = useSelector((state) => state.projects);

  const [formData, setFormData] = useState({
    project: '',
    subject: '',
    description: '',
    priority: 5,
    severity: 'Medium',
    assignTo: null,
    reportedTo: null,
    category: '',
    scope: '',
    startDate: '',
    endDate: '',
    timeEstimateMs: 0,
    status: '',
    ...(initialData || {}),
  });

  const [errors, setErrors] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);
  const [projectMembersLoading, setProjectMembersLoading] = useState(false);
  const fileInputRef = useRef(null);
  const submittingRef = useRef(false);

  const sevInfo = severityConfig[formData.severity] || severityConfig.Medium;

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchUsers());
    dispatch(fetchProjects());
  }, [dispatch]);

  // Hydrate scope/severity from a prefilled category once categories load
  const categoryHydratedRef = useRef(false);
  useEffect(() => {
    if (categoryHydratedRef.current) return;
    if (!formData.category || !Array.isArray(categories) || categories.length === 0) return;
    const match = categories.find((c) => c._id === formData.category);
    if (!match) return;
    categoryHydratedRef.current = true;
    setFormData((prev) => ({
      ...prev,
      severity: match.severity || prev.severity || 'Medium',
      scope: match.scope || prev.scope || '',
    }));
  }, [categories, formData.category]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validate datetime-local inputs to ensure 4-digit year
    if ((name === 'startDate' || name === 'endDate') && value) {
      const year = value.split('-')[0];
      if (year && year.length > 4) {
        return; // Don't update if year exceeds 4 digits
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
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
      setFormData(prev => ({
        ...prev,
        category: categoryId,
      }));
    }

    if (errors.category) {
      setErrors(prev => ({ ...prev, category: '' }));
    }
  };

  const handleProjectChange = async (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, project: value, assignTo: null, reportedTo: null }));
    if (errors.project) setErrors((prev) => ({ ...prev, project: '' }));

    if (!value) { setProjectMembers([]); return; }
    setProjectMembersLoading(true);
    try {
      const res = await getProjectMembersAPI(value);
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

  const handleUserChange = (e, field) => {
    const userId = e.target.value;

    // Try project members first (flat shape), then fall back to redux users
    const member = projectMembers.find((m) => m.id === userId);
    if (member) {
      setFormData((prev) => ({
        ...prev,
        [field]: { id: member.id, name: member.name, email: member.email, phone: member.phone },
      }));
      return;
    }

    const selectedUser = users.find(user => user._id === userId);
    if (selectedUser) {
      const userObject = {
        id: selectedUser._id,
        name: `${selectedUser.name?.first || ''} ${selectedUser.name?.last || ''}`.trim() || selectedUser.authentication?.userName,
        email: selectedUser.authentication?.email,
        userType: selectedUser.category,
        phone: selectedUser.authentication?.phone
      };

      setFormData(prev => ({
        ...prev,
        [field]: userObject
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: null
      }));
    }

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.assignTo) {
      newErrors.assignTo = 'Assignee is required';
    }
    if (!formData.reportedTo) {
      newErrors.reportedTo = 'Reported to is required';
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    return newErrors;
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (errors.attachments) {
      setErrors((prev) => ({ ...prev, attachments: '' }));
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (const file of files) {
        const base64 = await fileToBase64(file);
        const payload = { image: base64 };

        const response = await uploadImage(payload, (percent) => {
          setUploadProgress(percent);
        });

        const fileUrl = response?.data?.fileUrl || response?.fileUrl || '';
        if (fileUrl) {
          setUploadedFiles((prev) => [...prev, fileUrl]);
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setErrors((prev) => ({ ...prev, attachments: 'Failed to upload file. Please try again.' }));
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (indexToRemove) => {
    setUploadedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isUploading) {
      setErrors((prev) => ({ ...prev, attachments: 'Please wait for uploads to finish.' }));
      return;
    }
    if (submittingRef.current) return;

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    submittingRef.current = true;
    setIsSubmitting(true);
    onCreate({ ...formData, attachments: uploadedFiles });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-create" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Task</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6">
          {/* Title */}
          <Input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Enter task title"
            autoFocus
            className="!h-auto !border-0 !bg-transparent !px-2 -mx-2 py-1 !text-[20px] font-medium text-slate-900 !rounded-lg hover:!bg-slate-50 focus-visible:!bg-slate-50 focus-visible:!ring-0 mb-4"
          />
          {errors.subject && <span className="error -mt-3 mb-2">{errors.subject}</span>}

          {/* Properties grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-0 mb-5 max-[720px]:grid-cols-1 max-[720px]:gap-x-0 border-t border-slate-100">
            <PropertyRow icon={iconCalendar} label="Start Date">
              <input
                type="datetime-local"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                min="1900-01-01T00:00"
                max="9999-12-31T23:59"
                className="w-full px-2 py-1.5 text-[13px] font-semibold rounded-md border border-transparent bg-transparent text-slate-800 hover:bg-slate-50 hover:border-slate-200 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </PropertyRow>

            <PropertyRow icon={iconCalendar} label="End Date">
              <input
                type="datetime-local"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min="1900-01-01T00:00"
                max="9999-12-31T23:59"
                className="w-full px-2 py-1.5 text-[13px] font-semibold rounded-md border border-transparent bg-transparent text-slate-800 hover:bg-slate-50 hover:border-slate-200 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </PropertyRow>

            <PropertyRow icon={iconFolder} label="Project">
              <Select
                value={formData.project || undefined}
                onValueChange={(value) => handleProjectChange({ target: { value } })}
                disabled={projectsLoading}
              >
                <SelectTrigger size="sm" className={chipTriggerClass}>
                  <SelectValue placeholder={projectsLoading ? 'Loading projects...' : 'Select project'} />
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

            <PropertyRow icon={iconUser} label={<span>Assignee <span className="text-red-500">*</span></span>}>
              <div className="flex items-center gap-2">
                <Avatar name={formData.assignTo?.name} email={formData.assignTo?.email} />
                <Select
                  value={formData.assignTo?.id || undefined}
                  onValueChange={(value) => handleUserChange({ target: { value } }, 'assignTo')}
                  disabled={projectMembersLoading || (!formData.project && usersLoading)}
                >
                  <SelectTrigger size="sm" className={`${chipTriggerClass} flex-1 min-w-0`}>
                    <SelectValue placeholder={!formData.project ? 'Select a project first' : 'Select assignee'} />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.project
                      ? projectMembers.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))
                      : Array.isArray(users) && users.map((user) => (
                          <SelectItem key={user._id} value={user._id}>
                            {`${user.name?.first || ''} ${user.name?.last || ''}`.trim() || user.authentication?.userName}
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              </div>
              {errors.assignTo && <span className="block text-red-500 text-xs mt-1 px-2">{errors.assignTo}</span>}
            </PropertyRow>

            <PropertyRow icon={iconTag} label="Category">
              <Select
                value={formData.category || undefined}
                onValueChange={(value) => handleCategoryChange({ target: { value } })}
                disabled={categoriesLoading}
              >
                <SelectTrigger size="sm" className={chipTriggerClass}>
                  <SelectValue placeholder={categoriesLoading ? 'Loading...' : 'Select category'} />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(categories) && categories.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <span className="block text-red-500 text-xs mt-1 px-2">{errors.category}</span>}
            </PropertyRow>

            <PropertyRow icon={iconUser} label={<span>Reported To <span className="text-red-500">*</span></span>}>
              <div className="flex items-center gap-2">
                <Avatar name={formData.reportedTo?.name} email={formData.reportedTo?.email} />
                <Select
                  value={formData.reportedTo?.id || undefined}
                  onValueChange={(value) => handleUserChange({ target: { value } }, 'reportedTo')}
                  disabled={projectMembersLoading || (!formData.project && usersLoading)}
                >
                  <SelectTrigger size="sm" className={`${chipTriggerClass} flex-1 min-w-0`}>
                    <SelectValue placeholder={!formData.project ? 'Select a project first' : 'Select reporter'} />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.project
                      ? projectMembers.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))
                      : Array.isArray(users) && users.map((user) => (
                          <SelectItem key={user._id} value={user._id}>
                            {`${user.name?.first || ''} ${user.name?.last || ''}`.trim() || user.authentication?.userName}
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              </div>
              {errors.reportedTo && <span className="block text-red-500 text-xs mt-1 px-2">{errors.reportedTo}</span>}
            </PropertyRow>

            <PropertyRow icon={iconGlobe} label="Scope">
              <Input
                type="text"
                name="scope"
                value={formData.scope}
                onChange={handleChange}
                placeholder="Auto-filled from category"
                readOnly
                className="!h-auto !border-0 !bg-transparent px-2 py-1.5 !rounded-md hover:!bg-slate-50 text-[13px] font-semibold"
              />
            </PropertyRow>

            <PropertyRow icon={iconPriority} label="Priority">
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

            <PropertyRow icon={iconClock} label="Time Estimate">
              <EstimateTimePicker
                valueMs={formData.timeEstimateMs}
                onChange={(ms) => setFormData((prev) => ({ ...prev, timeEstimateMs: ms }))}
              />
            </PropertyRow>

          </div>

          {/* Description */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2 text-slate-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>
              <span className="text-[12px] font-bold uppercase tracking-wide">Description <span className="text-red-500">*</span></span>
            </div>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add a description..."
              className="min-h-[100px]"
            />
            {errors.description && <span className="error mt-1">{errors.description}</span>}
          </div>

          {/* Attachments */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2 text-slate-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.49"/></svg>
              <span className="text-[12px] font-bold uppercase tracking-wide">
                Attachments <span className="text-slate-400 font-semibold normal-case">({uploadedFiles.length})</span>
              </span>
            </div>
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,video/*,.pdf"
              multiple
              disabled={isUploading}
              className="file:mr-3 file:rounded-md file:bg-slate-100 file:px-3 file:text-slate-700 file:font-medium"
            />
            {isUploading && (
              <span className="upload-progress">Uploading... {uploadProgress || 0}%</span>
            )}
            {errors.attachments && <span className="error">{errors.attachments}</span>}

            {uploadedFiles.length > 0 && (
              <div className="attachment-list">
                {uploadedFiles.map((url, index) => (
                  <div key={`${url}-${index}`} className="attachment-item">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="attachment-link"
                    >
                      {url.split('/').pop() || `Attachment ${index + 1}`}
                    </a>
                    <button
                      type="button"
                      className="attachment-remove-btn"
                      onClick={() => handleRemoveAttachment(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading || isSubmitting}
              className="!bg-[#5449D6] text-white border-transparent hover:!bg-[#5449D6] hover:text-white hover:brightness-110 focus-visible:ring-[#5449D6]/30"
            >
              {(isUploading || isSubmitting) && <Spinner className="size-4" />}
              {isUploading ? 'Uploading...' : isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketModal;   
