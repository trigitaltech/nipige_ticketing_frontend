import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../../redux/categorySlice';
import { postCommentAPI } from '../../services/api';
import TicketInfoPanel from './TicketInfoPanel';
import '../../assets/Styles/Modal.css';

const UpdateTicketModal = ({ ticket, onClose, onUpdate }) => {
  const dispatch = useDispatch();
  const { categories, loading: categoriesLoading } = useSelector((state) => state.categories);

  const [formData, setFormData] = useState({
    subject: ticket.subject || ticket.title || '',
    description: ticket.description || '',
    priority: ticket.priority || 0,
    severity: ticket.severity || ticket.category?.severity || 'Low',
    assignedTo: ticket.assignTo?.name || ticket.assignedTo || '',
    status: ticket.status || 'OPEN',
    category: ticket.category?._id || ticket.category || '',
    scope: ticket.scope || '',
  });

  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState({});
  const [isPostingComment, setIsPostingComment] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
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
                  rows="2"
                  placeholder="Enter initial description"
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

              <div className="form-group">
                <label htmlFor="assignedTo">Assigned To</label>
                <input
                  type="text"
                  id="assignedTo"
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  placeholder="Assignee name"
                  readOnly
                />
              </div>

              <div className="form-group">
                <label htmlFor="comment">Add Comment</label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Enter your comment/update here..."
                  rows="3"
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