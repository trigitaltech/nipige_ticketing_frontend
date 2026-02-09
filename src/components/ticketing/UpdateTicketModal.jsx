import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../../redux/categorySlice';
import { fetchUsers } from '../../redux/userSlice';
import { postCommentAPI } from '../../services/api';
import TicketInfoPanel from './TicketInfoPanel';
import '../../assets/Styles/Modal.css';

const UpdateTicketModal = ({ ticket, onClose, onUpdate }) => {
  const dispatch = useDispatch();
  const { categories, loading: categoriesLoading } = useSelector((state) => state.categories);
  const { users, loading: usersLoading } = useSelector((state) => state.users);

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
    category: ticket.category?._id || ticket.category || '',
    scope: ticket.scope || '',
    startDate: formatDateTimeLocal(ticket.startDate),
    endDate: formatDateTimeLocal(ticket.endDate),
  });

  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState({});
  const [isPostingComment, setIsPostingComment] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchUsers());
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

      // Clear comment after successful post
      setComment('');
      setErrors(prev => ({ ...prev, comment: '' }));

      // Show success message
      alert('Comment posted successfully!');

      // You might want to refresh the ticket data here
      // to show the new comment in the history
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsPostingComment(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Ticket Details #{ticket.ticketNo || ticket.id || 'N/A'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-two-column">
            {/* Left Section - Form Fields */}
            <div className="modal-left-section">
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleCategoryChange}
                  disabled={categoriesLoading}
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

              <div className="form-group">
                <label htmlFor="subject">Subject *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Enter ticket subject"
                />
                {errors.subject && <span className="error">{errors.subject}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="initialDescription">Description</label>
                <textarea
                  id="initialDescription"
                  name="description"
                  value={formData.description || ticket.description || ''}
                  onChange={handleChange}
                  rows="1"
                  placeholder="Enter initial description"
                  style={{ minHeight: '32px' }}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="scope">Scope</label>
                  <input
                    type="text"
                    id="scope"
                    name="scope"
                    value={formData.scope}
                    onChange={handleChange}
                    placeholder="Scope (auto-filled)"
                    readOnly
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="severity">Severity</label>
                  <select
                    id="severity"
                    name="severity"
                    value={formData.severity}
                    onChange={handleChange}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="priority">Priority (0-10)</label>
                  <input
                    type="number"
                    id="priority"
                    name="priority"
                    min="0"
                    max="10"
                    value={formData.priority}
                    onChange={handleChange}
                    placeholder="Priority level"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="assignTo">Assign To</label>
                  <select
                    id="assignTo"
                    name="assignTo"
                    value={formData.assignTo?.id || ''}
                    onChange={(e) => handleUserChange(e, 'assignTo')}
                    disabled={usersLoading}
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

                <div className="form-group">
                  <label htmlFor="reportedTo">Reported To</label>
                  <select
                    id="reportedTo"
                    name="reportedTo"
                    value={formData.reportedTo?.id || ''}
                    onChange={(e) => handleUserChange(e, 'reportedTo')}
                    disabled={usersLoading}
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

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    min="1900-01-01T00:00"
                    max="9999-12-31T23:59"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endDate">End Date & Time</label>
                  <input
                    type="datetime-local"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min="1900-01-01T00:00"
                    max="9999-12-31T23:59"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="comment">Add Comment</label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Enter your comment/update here..."
                  rows="2"
                  style={{ minHeight: '40px' }}
                />
                {errors.comment && <span className="error">{errors.comment}</span>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={handlePostComment}
                    disabled={isPostingComment || !comment.trim()}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#0052CC',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isPostingComment || !comment.trim() ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: isPostingComment || !comment.trim() ? 0.6 : 1,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    {isPostingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>

              <div className="modal-footer-left">
                <button type="button" className="cancel-btn" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Update Ticket
                </button>
              </div>
            </div>

            {/* Right Section - Ticket Info & Change History (Scrollable) */}
            <div className="modal-right-section scrollable">
              <TicketInfoPanel ticket={ticket} />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateTicketModal;