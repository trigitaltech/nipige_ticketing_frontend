import { useState } from 'react';
import ChangePasswordModal from './ChangePasswordModal';

const ProfileDropdown = ({ avatarLabel, userEmail, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleChangePassword = () => {
    setIsOpen(false);
    setIsPasswordModalOpen(true);
  };

  return (
    <div className="relative inline-flex">
      <button
        className="w-8 h-8 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-[14px] font-semibold uppercase cursor-pointer border-none outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
        onClick={() => setIsOpen(!isOpen)}
        title={userEmail || 'No email available'}
      >
        {avatarLabel}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[999]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[calc(100%+8px)] right-0 bg-white border border-[#DFE1E6] rounded-md shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-[1000] min-w-[240px] overflow-hidden">
            <div className="px-4 py-3.5 border-b border-[#EBECF0]">
              <div className="text-[11px] font-semibold text-[#5E6C84] uppercase tracking-[0.3px] mb-1">Email</div>
              <div className="text-[13px] text-[#172B4D] break-all">{userEmail || 'No email available'}</div>
            </div>
            <div className="py-1.5">
              <button
                className="flex items-center gap-2 w-full px-4 py-2.5 bg-transparent border-none text-[13px] text-[#172B4D] cursor-pointer text-left outline-none hover:bg-[#F4F5F7] transition-colors [font-family:inherit]"
                onClick={handleChangePassword}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-[#5E6C84] shrink-0">
                  <path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1.5V4.5A3.5 3.5 0 0 0 8 1zm2 6H6V4.5a2 2 0 1 1 4 0V7z" />
                </svg>
                Change Password
              </button>
              <button
                className="flex items-center gap-2 w-full px-4 py-2.5 bg-transparent border-none text-[13px] text-[#172B4D] cursor-pointer text-left outline-none hover:bg-[#F4F5F7] transition-colors [font-family:inherit]"
                onClick={onLogout}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-[#5E6C84] shrink-0">
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
