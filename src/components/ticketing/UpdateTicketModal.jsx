import { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../../redux/categorySlice';
import { fetchUsers } from '../../redux/userSlice';
import { fetchProjects } from '../../redux/projectSlice';
import { postCommentAPI } from '../../services/api';
import TicketInfoPanel from './TicketInfoPanel';
import AlertModal from '../shared/AlertModal';

const UpdateTicketModal = ({ ticket, onClose, onUpdate }) => {
  const dispatch = useDispatch();
  const { categories, loading: categoriesLoading } = useSelector((state) => state.categories);
  const { users, loading: usersLoading } = useSelector((state) => state.users);
  const { projects, loading: projectsLoading } = useSelector((state) => state.projects);

  // Helper function to convert UTC date to IST for datetime-local input
  // Input: "2026-01-24T00:00:00.000Z" (UTC)
  // Output: "2026-01-24T05:30" (IST in datetime-local format)
  const formatDateTimeLocal = (dateString) => {
    if (!dateString) return '';

    // Parse the UTC date
    const date = new Date(dateString);

    // Convert to IST by getting the ISO string and adjusting for IST offset
    // IST is UTC+5:30
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istDate = new Date(date.getTime() + istOffset);

    // Format as YYYY-MM-DDTHH:mm for datetime-local input
    const year = istDate.getUTCFullYear();
    const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istDate.getUTCDate()).padStart(2, '0');
    const hours = String(istDate.getUTCHours()).padStart(2, '0');
    const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

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

  const handleProjectChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      project: value,
    }));
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
    if (!formData.project) {
      newErrors.project = 'Project is required';
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setIsSubmitting(true);
    onUpdate({
      ...ticket,
      ...formData,
    });
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

      // Optimistically update local comment history so UI reflects immediately
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

        setWorknoteHistory((prev) => [...(prev || []), newWorknote]);
      } catch (e) {
        console.error('Error updating local worknote history:', e);
      }

      // Clear comment after successful post
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

  return (
    <div className="fixed inset-0 bg-[rgba(9,30,66,0.54)] flex justify-center items-center z-[1000]" onClick={onClose}>
      <div className="bg-white rounded w-[90%] max-w-[1100px] max-h-[90vh] flex flex-col shadow-[0_8px_16px_rgba(9,30,66,0.25)]" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[#DFE1E6] flex justify-between items-center shrink-0">
          <h2 className="text-[20px] text-[#172B4D] m-0 font-medium">Ticket Details #{ticket.ticketNo || ticket.id || 'N/A'}</h2>
          <button className="bg-transparent border-none text-[24px] text-[#6B778C] cursor-pointer p-0 w-7 h-7 leading-none hover:text-[#172B4D] transition-colors" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="grid grid-cols-2 gap-5 flex-1 overflow-hidden px-5 py-4">
            {/* Left Section - Form Fields */}
            <div className="min-w-0 flex flex-col overflow-y-auto pr-2 max-h-[calc(90vh-80px)] scroll-hover">
              <div className="mb-2">
                <label htmlFor="project" className="block mb-[3px] text-[#172B4D] font-semibold text-[11px] uppercase tracking-[0.3px]">Project *</label>
                <select
                  id="project"
                  name="project"
                  value={formData.project}
                  onChange={handleProjectChange}
                  disabled={projectsLoading}
                  className="w-full px-2 py-1.5 border-2 border-[#DFE1E6] rounded text-[13px] bg-[#FAFBFC] text-[#172B4D] focus:outline-none focus:border-[#0052CC] focus:bg-white transition-colors"
                >
                  <option value="">
                    {projectsLoading ? 'Loading projects...' : 'Select a project'}
                  </option>
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
                {errors.project && <span className="block text-[#DE350B] text-[12px] mt-1">{errors.project}</span>}
              </div>

              <div className="mb-2">
                <label htmlFor="category" className="block mb-[3px] text-[#172B4D] font-semibold text-[11px] uppercase tracking-[0.3px]">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleCategoryChange}
                  disabled={categoriesLoading}
                  className="w-full px-2 py-1.5 border-2 border-[#DFE1E6] rounded text-[13px] bg-[#FAFBFC] text-[#172B4D] focus:outline-none focus:border-[#0052CC] focus:bg-white transition-colors"
                >
                  <option value="">
                    {categoriesLoading ? 'Loading categories...' : 'Select a category'}
                  </option>
                  {Array.isArray(categories) && categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-2">
                <label htmlFor="subject" className="block mb-[3px] text-[#172B4D] font-semibold text-[11px] uppercase tracking-[0.3px]">Subject *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Enter task subject"
                  className="w-full px-2 py-1.5 border-2 border-[#DFE1E6] rounded text-[13px] bg-[#FAFBFC] text-[#172B4D] focus:outline-none focus:border-[#0052CC] focus:bg-white placeholder-[#8993A4] transition-colors"
                />
                {errors.subject && <span className="block text-[#DE350B] text-[12px] mt-1">{errors.subject}</span>}
              </div>

              <div className="mb-2">
                <label htmlFor="initialDescription" className="block mb-[3px] text-[#172B4D] font-semibold text-[11px] uppercase tracking-[0.3px]">Description</label>
                <textarea
                  id="initialDescription"
                  name="description"
                  value={formData.description || ticket.description || ''}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Enter initial description"
                  style={{ minHeight: '32px' }}
                  className="w-full px-2 py-1.5 border-2 border-[#DFE1E6] rounded text-[13px] bg-[#FAFBFC] text-[#172B4D] focus:outline-none focus:border-[#0052CC] focus:bg-white placeholder-[#8993A4] transition-colors resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="mb-2">
                  <label htmlFor="status" className="block mb-[3px] text-[#172B4D] font-semibold text-[11px] uppercase tracking-[0.3px]">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 border-2 border-[#DFE1E6] rounded text-[13px] bg-[#FAFBFC] text-[#172B4D] focus:outline-none focus:border-[#0052CC] focus:bg-white transition-colors"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="BACKLOG">Backlog</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div className="mb-2">
                  <label htmlFor="scope" className="block mb-[3px] text-[#172B4D] font-semibold text-[11px] uppercase tracking-[0.3px]">Scope</label>
                  <input
                    type="text"
                    id="scope"
                    name="scope"
                    value={formData.scope}
                    onChange={handleChange}
                    placeholder="Scope (auto-filled)"
                    readOnly
                    className="w-full px-2 py-1.5 border-2 border-[#DFE1E6] rounded text-[13px] bg-[#FAFBFC] text-[#172B4D] focus:outline-none focus:border-[#0052CC] focus:bg-white placeholder-[#8993A4] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="mb-2">
                  <label htmlFor="severity" className="block mb-[3px] text-[#172B4D] font-semibold text-[11px] uppercase tracking-[0.3px]">Severity</label>
                  <select
                    id="severity"
                    name="severity"
                    value={formData.severity}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 border-2 border-[#DFE1E6] rounded text-[13px] bg-[#FAFBFC] text-[#172B4D] focus:outline-none focus:border-[#0052CC] focus:bg-white transition-colors"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="mb-2">
                  <label htmlFor="priority" className="block mb-[3px] text-[#172B4D] font-semibold text-[11px] uppercase tracking-[0.3px]">Priority (0-10)</label>
                  <input
                    type="number"
                    id="priority"
                    name="priority"
                    min="0"
                    max="10"
                    value={formData.priority}
                    onChange={handleChange}
                    placeholder="Priority level"
                    className="w-full px-2 py-1.5 border-2 border-[#DFE1E6] rounded text-[13px] bg-[#FAFBFC] text-[#172B4D] focus:outline-none focus:border-[#0052CC] focus:bg-white placeholder-[#8993A4] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="mb-2">
                  <label htmlFor="assignTo" className="block mb-[3px] text-[#172B4D] font-semibold text-[11px] uppercase tracking-[0.3px]">Assign To</label>
                  <select
                    id="assignTo"
                    name="assignTo"
                    value={formData.assignTo?.id || ''}
                    onChange={(e) => handleUserChange(e, 'assignTo')}
                    disabled={usersLoading}
                    className="w-full px-2 py-1.5 border-2 border-[#DFE1E6] rounded text-[13px] bg-[#FAFBFC] text-[#172B4D] focus:outline-none focus:border-[#0052CC] focus:bg-white transition-colors"
                  >
                    <option value="">
                      {usersLoading ? 'Loading users...' : 'Select a user'}
                    </option>
                    {Array.isArray(users) && users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {`${user.name?.first || ''} ${user.name?.last || ''}`.trim() || user.authentication?.userName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-2">
                  <label htmlFor="reportedTo" className="block mb-[3px] text-[#172B4D] font-semibold text-[11px] uppercase tracking-[0.3px]">Reported To</label>
                  <select
                    id="reportedTo"
                    name="reportedTo"
                    value={formData.reportedTo?.id || ''}
                    onChange={(e) => handleUserChange(e, 'reportedTo')}
                    disabled={usersLoading}
                    className="w-full px-2 py-1.5 border-2 border-[#DFE1E6] rounded text-[13px] bg-[#FAFBFC] text-[#172B4D] focus:outline-none focus:border-[#0052CC] focus:bg-white transition-colors"
                  >
                    <option value="">
                      {usersLoading ? 'Loading users...' : 'Select a user'}
                    </option>
                    {Array.isArray(users) && users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {`${user.name?.first || ''} ${user.name?.last || ''}`.trim() || user.authentication?.userName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="mb-2">
                  <label htmlFor="startDate" className="block mb-[3px] text-[#172B4D] font-semibold text-[11px] uppercase tracking-[0.3px]">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    min="1900-01-01T00:00"
                    max="9999-12-31T23:59"
                    className="w-full px-2 py-1.5 border-2 border-[#DFE1E6] rounded text-[13px] bg-[#FAFBFC] text-[#172B4D] focus:outline-none focus:border-[#0052CC] focus:bg-white transition-colors"
                  />
                </div>

                <div className="mb-2">
                  <label htmlFor="endDate" className="block mb-[3px] text-[#172B4D] font-semibold text-[11px] uppercase tracking-[0.3px]">End Date & Time</label>
                  <input
                    type="datetime-local"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min="1900-01-01T00:00"
                    max="9999-12-31T23:59"
                    className="w-full px-2 py-1.5 border-2 border-[#DFE1E6] rounded text-[13px] bg-[#FAFBFC] text-[#172B4D] focus:outline-none focus:border-[#0052CC] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="mb-2">
                <label htmlFor="comment" className="block mb-[3px] text-[#172B4D] font-semibold text-[11px] uppercase tracking-[0.3px]">Add Comment</label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Enter your comment/update here..."
                  rows="2"
                  style={{ minHeight: '40px' }}
                  className="w-full px-2 py-1.5 border-2 border-[#DFE1E6] rounded text-[13px] bg-[#FAFBFC] text-[#172B4D] focus:outline-none focus:border-[#0052CC] focus:bg-white placeholder-[#8993A4] transition-colors resize-y"
                />
                {errors.comment && <span className="block text-[#DE350B] text-[12px] mt-1">{errors.comment}</span>}
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={handlePostComment}
                    disabled={isPostingComment || !comment.trim()}
                    className="px-4 py-2 bg-[#0052CC] text-white border-none rounded text-[14px] font-medium flex items-center justify-center gap-2 hover:enabled:bg-[#0065FF] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {isPostingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>

              <div className="flex justify-start gap-2 pt-3 mt-3 border-t border-[#DFE1E6]">
                <button type="button" className="px-4 py-1.5 rounded text-[13px] font-medium cursor-pointer bg-[#FAFBFC] text-[#42526E] border border-[#DFE1E6] hover:bg-[#EBECF0] transition-colors" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="inline-flex items-center gap-2 px-4 py-1.5 rounded text-[13px] font-medium cursor-pointer bg-[#0052CC] text-white border-none hover:bg-[#0065FF] active:bg-[#0747A6] disabled:opacity-70 disabled:cursor-not-allowed transition-colors" disabled={isSubmitting}>
                  {isSubmitting && <Spinner className="size-4" />}
                  Update Ticket
                </button>
              </div>
            </div>

            {/* Right Section - Ticket Info & Change History (Scrollable) */}
            <div className="min-w-0 flex flex-col overflow-y-auto pr-2 scroll-hover">
              <TicketInfoPanel ticket={{ ...ticket, worknoteHistory }} />
            </div>
          </div>
        </form>
      </div>
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

export default UpdateTicketModal;
