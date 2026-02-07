import { useState } from 'react';
import '../assets/Styles/Modal.css';

const UpdateTicketModal = ({ ticket, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    subject: ticket.subject || ticket.title || '',
    description: ticket.description || '',
    priority: ticket.priority || 0,
    severity: ticket.severity || ticket.category?.severity || 'Low',
    assignedTo: ticket.assignTo?.name || ticket.assignedTo || '',
    status: ticket.status || 'OPEN',
  });

  const [errors, setErrors] = useState({});

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

  const validate = () => {
    const newErrors = {};
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Ticket Details #{ticket.ticketNo || ticket.id || 'N/A'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
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
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter ticket description"
              rows="4"
            />
            {errors.description && <span className="error">{errors.description}</span>}
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
          </div>

          <div className="form-row">
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
          </div>

          <div className="ticket-metadata" style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '10px', fontSize: '14px', color: '#333' }}>Ticket Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
              <p><strong>Ticket No:</strong> {ticket.ticketNo || 'N/A'}</p>
              <p><strong>Category:</strong> {ticket.category?.name || 'N/A'}</p>
              <p><strong>Reported By:</strong> {ticket.reportedBy?.name || 'Unknown'}</p>
              <p><strong>Reported To:</strong> {ticket.reportedTo?.name || 'N/A'}</p>
              <p><strong>Escalated:</strong> {ticket.escalated ? 'Yes ⚠️' : 'No'}</p>
              <p><strong>Scope:</strong> {ticket.scope || 'N/A'}</p>
              <p><strong>Created:</strong> {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'N/A'}</p>
              <p><strong>Updated:</strong> {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : 'N/A'}</p>
            </div>
            {ticket.assignTo?.email && (
              <p style={{ marginTop: '10px' }}><strong>Assignee Email:</strong> {ticket.assignTo.email}</p>
            )}
          </div>

          {ticket.changeHistory && ticket.changeHistory.length > 0 && (
            <div className="ticket-metadata" style={{ marginTop: '15px', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '10px', fontSize: '14px', color: '#333' }}>Change History</h3>
              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {ticket.changeHistory.map((change, index) => (
                  <div key={change._id || index} style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #e0e0e0', fontSize: '12px' }}>
                    <p><strong>{change.action}</strong> by {change.updatedBy?.name || 'Unknown'}</p>
                    <p style={{ color: '#666' }}>{change.description}</p>
                    <p style={{ color: '#999', fontSize: '11px' }}>{new Date(change.updatedAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="submit-btn">
              Update Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateTicketModal;