import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../../redux/categorySlice';
import { fetchUsers } from '../../redux/userSlice';
import { fetchProjects } from '../../redux/projectSlice';
import { uploadImage } from '../../services/api';
import { fileToBase64 } from '../../function/function';
import '../../assets/Styles/Modal.css';

const CreateTicketModal = ({ onClose, onCreate }) => {
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
  });

  const [errors, setErrors] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

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
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
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

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onCreate({ ...formData, attachments: uploadedFiles });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-create" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Task</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="project">Project *</label>
              <select
                id="project"
                name="project"
                value={formData.project}
                onChange={handleProjectChange}
                disabled={projectsLoading}
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
              {errors.project && <span className="error">{errors.project}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="category">Category *</label>
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
              {errors.category && <span className="error">{errors.category}</span>}
            </div>
          </div>

          <div className="form-row">
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
            <label htmlFor="attachments">Attachments</label>
            <input
              type="file"
              id="attachments"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,video/*,.pdf"
              multiple
              disabled={isUploading}
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
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketModal;   
