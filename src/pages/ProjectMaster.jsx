import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects, createProject, updateProject, deleteProject } from '../redux/projectSlice';
import { fetchUsers } from '../redux/userSlice';
import deleteIcon from '../assets/icons/delete.png';
import AlertModal from '../components/shared/AlertModal';
import DeleteConfirmModal from '../components/shared/DeleteConfirmModal';
import '../assets/Styles/ListView.css';

const getInitials = (name) => {
  return name
    .split(' ')
    .map((w) => w[0]?.toUpperCase())
    .join('')
    .slice(0, 2);
};

const statusStyles = {
  ACTIVE: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  'ON HOLD': 'bg-amber-50 text-amber-600 border border-amber-200',
};

const inputClass = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-900 focus:outline-none focus:border-blue-400 focus:bg-white transition-all placeholder:text-gray-400';
const selectClass = `${inputClass} appearance-none bg-[url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2364748B' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")] bg-no-repeat bg-[position:right_14px_center] bg-[length:12px_8px] pr-10`;
const labelClass = 'block text-sm font-semibold text-gray-800 mb-2';

const CreateProjectView = ({ onBack }) => {
  const dispatch = useDispatch();
  const { users, loading: usersLoading } = useSelector((state) => state.users);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'ACTIVE',
    startDate: '',
    endDate: '',
    client: '',
    category: 'Client delivery',
    projectLead: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
  });

  const openAlertModal = ({ type = 'info', title, message, onConfirm = null }) => {
    setAlertModal({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
    });
  };

  const closeAlertModal = () => {
    setAlertModal((prev) => ({ ...prev, isOpen: false, onConfirm: null }));
  };

  const handleAlertConfirm = () => {
    const nextAction = alertModal.onConfirm;
    closeAlertModal();
    if (nextAction) {
      nextAction();
    }
  };

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Project name is required';
    if (!formData.code.trim()) newErrors.code = 'Project code is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedUser = formData.projectLead
        ? (Array.isArray(users) && users.find((u) => (u._id || u.id) === formData.projectLead))
        : null;
      const owner = selectedUser
        ? {
            id: selectedUser._id || selectedUser.id,
            name: `${selectedUser.name?.first || ''} ${selectedUser.name?.last || ''}`.trim() || selectedUser.authentication?.userName || '',
            email: selectedUser.authentication?.email || selectedUser.email || '',
            phone: selectedUser.authentication?.phone || selectedUser.phone || '',
          }
        : undefined;

      const payload = {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        status: formData.status,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        category: formData.category,
        client: formData.client?.trim() || '',
        owner,
      };

      await dispatch(createProject(payload)).unwrap();
      dispatch(fetchProjects());
      openAlertModal({
        type: 'success',
        title: 'Project Created',
        message: 'Project created successfully.',
        onConfirm: onBack,
      });
    } catch (error) {
      console.error('Error creating project:', error);
      openAlertModal({
        type: 'error',
        title: 'Creation Failed',
        message: 'Failed to create project. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center cursor-pointer text-gray-400 hover:bg-gray-50 hover:text-gray-600 hover:border-gray-300 transition-all shrink-0"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
              <p className="text-sm text-gray-500 mt-0.5">Configure enterprise-grade project settings and governance</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="px-6 py-2.5 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Discard
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
             <svg xmlns="http://www.w3.org/2000/svg" className='w-4 h-4' viewBox="0 0 24 24" fill="#FFFFFF"><g fill="none" stroke="#FFFFFF" stroke-width="2"><path d="M16 21v-2c0-1.886 0-2.828-.586-3.414C14.828 15 13.886 15 12 15h-1c-1.886 0-2.828 0-3.414.586C7 16.172 7 17.114 7 19v2"/><path stroke-linecap="round" d="M7 8h5"/><path d="M3 9c0-2.828 0-4.243.879-5.121C4.757 3 6.172 3 9 3h7.172c.408 0 .613 0 .796.076c.184.076.329.22.618.51l2.828 2.828c.29.29.434.434.51.618c.076.183.076.388.076.796V15c0 2.828 0 4.243-.879 5.121C19.243 21 17.828 21 15 21H9c-2.828 0-4.243 0-5.121-.879C3 19.243 3 17.828 3 15z"/>
             </g>
             </svg>
              {isSubmitting ? 'Creating...' : 'Launch Project'}
            </button>
          </div>
        </div>
        <div className="h-px bg-gray-200 mt-5" />
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-8 pb-10">
        <div className="grid grid-cols-[1fr_380px] gap-6 mt-4 max-[1100px]:grid-cols-1">

          {/* Left Column - Project Identity */}
          <div className="bg-white border border-gray-200 rounded-2xl p-7">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-gray-800 tracking-wide uppercase">Project Identity</span>
            </div>
            <div className="h-px bg-gray-100 mt-4 mb-6" />

            <div className="mb-5">
              <label className={labelClass}>Project Name <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Next-Gen Mobile App Development" className={inputClass} />
              {errors.name && <span className="block text-red-500 text-xs mt-1">{errors.name}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5 max-[640px]:grid-cols-1">
              <div>
                <label className={labelClass}>Project Code <span className="text-red-500">*</span></label>
                <input type="text" name="code" value={formData.code} onChange={handleChange} placeholder="e.g. NPG-REVAMP" className={inputClass} />
                {errors.code && <span className="block text-red-500 text-xs mt-1">{errors.code}</span>}
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className={selectClass}>
                  <option value="Client delivery">Client delivery</option>
                  <option value="Internal">Internal</option>
                  <option value="Research">Research</option>
                  <option value="Support">Support</option>
                </select>
              </div>
            </div>

            <div className="mb-5">
              <label className={labelClass}>Client</label>
              <input type="text" name="client" value={formData.client} onChange={handleChange} placeholder="e.g. Acme Corp" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Define the primary goals and deliverables..."
                rows="6"
                className={`${inputClass} resize-y min-h-[160px]`}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">
            {/* Governance Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-1">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-bold text-gray-800 tracking-wide uppercase">Governance</span>
              </div>
              <div className="h-px bg-gray-100 mt-4 mb-6" />

              <div className="mb-5">
                <label className={labelClass}>Project Lead</label>
                <select name="projectLead" value={formData.projectLead} onChange={handleChange} disabled={usersLoading} className={selectClass}>
                  <option value="">{usersLoading ? 'Loading users...' : 'Select a lead'}</option>
                  {Array.isArray(users) && users.map((user) => {
                    const userId = user._id || user.id;
                    const userName = `${user.name?.first || ''} ${user.name?.last || ''}`.trim() || user.authentication?.userName || 'Unknown';
                    return (
                      <option key={userId} value={userId}>{userName}</option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className={labelClass}>Current Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className={selectClass}>
                  <option value="ACTIVE">Active</option>
                  <option value="ON HOLD">On Hold</option>
                  <option value="DRAFT">Draft</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            {/* Timeline Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-1">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="1.5" />
                  <line x1="16" y1="2" x2="16" y2="6" strokeWidth="1.5" />
                  <line x1="8" y1="2" x2="8" y2="6" strokeWidth="1.5" />
                  <line x1="3" y1="10" x2="21" y2="10" strokeWidth="1.5" />
                </svg>
                <span className="text-sm font-bold text-gray-800 tracking-wide uppercase">Timeline</span>
              </div>
              <div className="h-px bg-gray-100 mt-4 mb-6" />

              <div className="mb-5">
                <label className={labelClass}>Launch Date</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Estimated End Date</label>
                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertModal
        isOpen={alertModal.isOpen}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        onClose={closeAlertModal}
        onConfirm={handleAlertConfirm}
      />
    </div>
  );
};

const UpdateProjectView = ({ project, onBack }) => {
  const dispatch = useDispatch();
  const { users, loading: usersLoading } = useSelector((state) => state.users);

  const toDateInput = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    name: project.name || project.projectName || '',
    code: project.code || '',
    description: project.description || '',
    status: project.status || 'ACTIVE',
    startDate: toDateInput(project.startDate),
    endDate: toDateInput(project.endDate),
    client: project.client?.name || project.client || '',
    category: project.category || 'Client delivery',
    projectLead: project.owner?.id || project.owner?._id || project.lead?._id || project.lead?.id || project.projectLead?._id || project.projectLead?.id || (typeof project.projectLead === 'string' ? '' : ''),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
  });

  const openAlertModal = ({ type = 'info', title, message, onConfirm = null }) => {
    setAlertModal({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
    });
  };

  const closeAlertModal = () => {
    setAlertModal((prev) => ({ ...prev, isOpen: false, onConfirm: null }));
  };

  const handleAlertConfirm = () => {
    const nextAction = alertModal.onConfirm;
    closeAlertModal();
    if (nextAction) {
      nextAction();
    }
  };

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Project name is required';
    if (!formData.code.trim()) newErrors.code = 'Project code is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const projectId = project._id || project.id;
      const selectedUser = formData.projectLead
        ? (Array.isArray(users) && users.find((u) => (u._id || u.id) === formData.projectLead))
        : null;
      const owner = selectedUser
        ? {
            id: selectedUser._id || selectedUser.id,
            name: `${selectedUser.name?.first || ''} ${selectedUser.name?.last || ''}`.trim() || selectedUser.authentication?.userName || '',
            email: selectedUser.authentication?.email || selectedUser.email || '',
            phone: selectedUser.authentication?.phone || selectedUser.phone || '',
          }
        : undefined;

      const payload = {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        status: formData.status,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        category: formData.category,
        client: formData.client?.trim() || '',
        owner,
      };

      await dispatch(updateProject({ projectId, projectData: payload })).unwrap();
      dispatch(fetchProjects());
      openAlertModal({
        type: 'success',
        title: 'Project Updated',
        message: 'Project updated successfully.',
        onConfirm: onBack,
      });
    } catch (error) {
      console.error('Error updating project:', error);
      openAlertModal({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update project. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center cursor-pointer text-gray-400 hover:bg-gray-50 hover:text-gray-600 hover:border-gray-300 transition-all shrink-0"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Update Project</h1>
              <p className="text-sm text-gray-500 mt-0.5">Edit project settings and governance</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="px-6 py-2.5 border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Discard
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="#FFFFFF"><g fill="none" stroke="#FFFFFF" strokeWidth="2"><path d="M16 21v-2c0-1.886 0-2.828-.586-3.414C14.828 15 13.886 15 12 15h-1c-1.886 0-2.828 0-3.414.586C7 16.172 7 17.114 7 19v2"/><path strokeLinecap="round" d="M7 8h5"/><path d="M3 9c0-2.828 0-4.243.879-5.121C4.757 3 6.172 3 9 3h7.172c.408 0 .613 0 .796.076c.184.076.329.22.618.51l2.828 2.828c.29.29.434.434.51.618c.076.183.076.388.076.796V15c0 2.828 0 4.243-.879 5.121C19.243 21 17.828 21 15 21H9c-2.828 0-4.243 0-5.121-.879C3 19.243 3 17.828 3 15z"/></g></svg>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
        <div className="h-px bg-gray-200 mt-5" />
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-8 pb-10">
        <div className="grid grid-cols-[1fr_380px] gap-6 mt-4 max-[1100px]:grid-cols-1">

          {/* Left Column - Project Identity */}
          <div className="bg-white border border-gray-200 rounded-2xl p-7">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-gray-800 tracking-wide uppercase">Project Identity</span>
            </div>
            <div className="h-px bg-gray-100 mt-4 mb-6" />

            <div className="mb-5">
              <label className={labelClass}>Project Name <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Next-Gen Mobile App Development" className={inputClass} />
              {errors.name && <span className="block text-red-500 text-xs mt-1">{errors.name}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5 max-[640px]:grid-cols-1">
              <div>
                <label className={labelClass}>Project Code <span className="text-red-500">*</span></label>
                <input type="text" name="code" value={formData.code} onChange={handleChange} placeholder="e.g. NPG-REVAMP" className={inputClass} />
                {errors.code && <span className="block text-red-500 text-xs mt-1">{errors.code}</span>}
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className={selectClass}>
                  <option value="Client delivery">Client delivery</option>
                  <option value="Internal">Internal</option>
                  <option value="Research">Research</option>
                  <option value="Support">Support</option>
                </select>
              </div>
            </div>

            <div className="mb-5">
              <label className={labelClass}>Client</label>
              <input type="text" name="client" value={formData.client} onChange={handleChange} placeholder="e.g. Acme Corp" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Define the primary goals and deliverables..."
                rows="6"
                className={`${inputClass} resize-y min-h-[160px]`}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">
            {/* Governance Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-1">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-bold text-gray-800 tracking-wide uppercase">Governance</span>
              </div>
              <div className="h-px bg-gray-100 mt-4 mb-6" />

              <div className="mb-5">
                <label className={labelClass}>Project Lead</label>
                <select name="projectLead" value={formData.projectLead} onChange={handleChange} disabled={usersLoading} className={selectClass}>
                  <option value="">{usersLoading ? 'Loading users...' : 'Select a lead'}</option>
                  {Array.isArray(users) && users.map((user) => {
                    const userId = user._id || user.id;
                    const userName = `${user.name?.first || ''} ${user.name?.last || ''}`.trim() || user.authentication?.userName || 'Unknown';
                    return (
                      <option key={userId} value={userId}>{userName}</option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className={labelClass}>Current Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className={selectClass}>
                  <option value="ACTIVE">Active</option>
                  <option value="ON HOLD">On Hold</option>
                  <option value="DRAFT">Draft</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            {/* Timeline Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-1">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="1.5" />
                  <line x1="16" y1="2" x2="16" y2="6" strokeWidth="1.5" />
                  <line x1="8" y1="2" x2="8" y2="6" strokeWidth="1.5" />
                  <line x1="3" y1="10" x2="21" y2="10" strokeWidth="1.5" />
                </svg>
                <span className="text-sm font-bold text-gray-800 tracking-wide uppercase">Timeline</span>
              </div>
              <div className="h-px bg-gray-100 mt-4 mb-6" />

              <div className="mb-5">
                <label className={labelClass}>Launch Date</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Estimated End Date</label>
                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertModal
        isOpen={alertModal.isOpen}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        onClose={closeAlertModal}
        onConfirm={handleAlertConfirm}
      />
    </div>
  );
};

const ProjectMaster = ({ onOpenProject = () => {} }) => {
  const dispatch = useDispatch();
  const { projects, loading, error } = useSelector((state) => state.projects);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, projectId: null, projectName: '' });

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  if (showCreateProject) {
    return <CreateProjectView onBack={() => setShowCreateProject(false)} />;
  }

  if (editingProject) {
    return <UpdateProjectView project={editingProject} onBack={() => setEditingProject(null)} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between px-8 pt-6 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Master</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all internal and client-facing projects</p>
        </div>
        <button
          onClick={() => setShowCreateProject(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Project
        </button>
      </div>

      {/* Table Card */}
      <div className="mx-8 mb-8 bg-white rounded-2xl border border-gray-200 flex-1 flex flex-col overflow-hidden">
        {/* Search & Actions Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search projects..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-72 focus:outline-none focus:border-blue-400 bg-white"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
              Filters
            </button>
            <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <span className="text-sm text-gray-400">Loading projects...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-40">
              <span className="text-sm text-red-400">Failed to load projects: {error}</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <span className="text-sm text-gray-400">No projects found</span>
            </div>
          ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-gray-400 tracking-wider uppercase">Project Name</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-gray-400 tracking-wider uppercase">Client</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-gray-400 tracking-wider uppercase">Lead</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-gray-400 tracking-wider uppercase">Status</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-gray-400 tracking-wider uppercase">Timeline</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-gray-400 tracking-wider uppercase">Progress</th>
                <th className="text-center px-6 py-3.5 text-[11px] font-bold text-gray-400 tracking-wider uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const projectName = project.name || project.projectName || 'Untitled';
                const projectId = project._id || project.id || '';
                const clientName = project.client?.name || project.client || 'N/A';
                const leadName = project.owner?.name || project.lead?.name || project.lead || project.projectLead?.name || project.projectLead || 'N/A';
                const status = (project.status || 'ACTIVE').toUpperCase();
                const startDate = project.startDate ? new Date(project.startDate).toLocaleDateString('en-CA') : 'N/A';
                const endDate = project.endDate ? new Date(project.endDate).toLocaleDateString('en-CA') : 'N/A';
                const progress = project.progress || 0;
                const tasks = project.tasks || project.taskCount || 0;

                return (
                <tr
                  key={projectId}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => onOpenProject(project)}
                >
                  {/* Project Name */}
                  <td className="px-6 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{projectName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">ID: {projectId.slice(-6).toUpperCase()}</p>
                    </div>
                  </td>

                  {/* Client */}
                  <td className="px-6 py-3">
                    <span className="text-sm text-gray-600">{clientName}</span>
                  </td>

                  {/* Lead */}
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {getInitials(leadName)}
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{leadName}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status] || 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                      {status}
                    </span>
                  </td>

                  {/* Timeline */}
                  <td className="px-6 py-3">
                    <div className="text-sm text-gray-600">
                      <p>{startDate}</p>
                      <p className="text-gray-400">to {endDate}</p>
                    </div>
                  </td>

                  {/* Progress */}
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-800">{progress}%</span>
                      <span className="text-xs text-gray-400">{tasks} tasks</span>
                    </div>
                    <div className="w-24 bg-gray-100 rounded-full h-1.5 mt-2">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-3 text-center">
                    <div className="inline-flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProject(project);
                        }}
                        className="text-gray-400 hover:text-blue-500 transition-colors cursor-pointer p-0.5"
                        title="Edit project"
                        aria-label={`Edit ${projectName}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ open: true, projectId, projectName });
                        }}
                        className="list-delete-btn"
                        style={{ margin: 0, padding: '2px' }}
                        title="Delete project"
                        aria-label={`Delete ${projectName}`}
                      >
                        <img src={deleteIcon} alt="delete" style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          )}
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={deleteConfirm.open}
        title="Delete Project"
        message={(
          <>
            Are you sure you want to delete project <strong>{deleteConfirm.projectName}</strong>? This action cannot be undone.
          </>
        )}
        onCancel={() => setDeleteConfirm({ open: false, projectId: null, projectName: '' })}
        onConfirm={() => {
          dispatch(deleteProject(deleteConfirm.projectId));
          setDeleteConfirm({ open: false, projectId: null, projectName: '' });
        }}
      />
    </div>
  );
};

export default ProjectMaster;
