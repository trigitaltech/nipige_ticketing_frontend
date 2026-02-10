import { useState } from 'react';
import ChangePasswordModal from './ChangePasswordModal';
import '../../assets/Styles/Profile.css';

const ProfileDropdown = ({ avatarLabel, userEmail, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleChangePassword = () => {
    setIsOpen(false);
    setIsPasswordModalOpen(true);
  };

  return (
    <div className="profile-wrapper">
      <button
        className="profile-avatar-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={userEmail || 'No email available'}
      >
        {avatarLabel}
      </button>

      {isOpen && (
        <>
          <div className="dropdown-overlay" onClick={() => setIsOpen(false)} />
          <div className="profile-dropdown-panel">
            <div className="profile-dropdown-email">
              <div className="profile-dropdown-email-label">Email</div>
              <div className="profile-dropdown-email-value">{userEmail || 'No email available'}</div>
            </div>
            <div className="profile-dropdown-actions">
              <button className="profile-dropdown-action" onClick={handleChangePassword}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1.5V4.5A3.5 3.5 0 0 0 8 1zm2 6H6V4.5a2 2 0 1 1 4 0V7z" />
                </svg>
                Change Password
              </button>
              <button className="profile-dropdown-action" onClick={onLogout}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M6 1a1 1 0 0 0-1 1v1.5a.5.5 0 0 0 1 0V2h7v12H6v-1.5a.5.5 0 0 0-1 0V15a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6z" />
                  <path d="M1.146 8.354a.5.5 0 0 1 0-.708l2.5-2.5a.5.5 0 1 1 .708.708L2.707 7.5H10.5a.5.5 0 0 1 0 1H2.707l1.647 1.646a.5.5 0 0 1-.708.708l-2.5-2.5z" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </>
      )}

      {isPasswordModalOpen && (
        <ChangePasswordModal onClose={() => setIsPasswordModalOpen(false)} />
      )}
    </div>
  );
};

export default ProfileDropdown;
