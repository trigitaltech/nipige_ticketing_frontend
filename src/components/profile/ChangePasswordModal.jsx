import { useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'react-toastify';
import { changePasswordAPI } from '../../services/api';

const ChangePasswordModal = ({ onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword) {
      setError('Both fields are required.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      await changePasswordAPI({ currentPassword, newPassword });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full py-[11px] pl-3 pr-11 border-2 border-[#DFE1E6] rounded text-[14px] bg-[#FAFBFC] text-[#172B4D] focus:outline-none focus:border-[#0052CC] focus:bg-white placeholder-[#8993A4] transition-all";

  return (
    <div className="fixed inset-0 bg-[rgba(9,30,66,0.54)] flex justify-center items-center z-[1000]" onClick={onClose}>
      <div className="bg-white rounded w-[90%] max-w-[420px] max-h-[90vh] overflow-y-auto shadow-[0_8px_16px_rgba(9,30,66,0.25)]" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[#DFE1E6] flex justify-between items-center">
          <h2 className="text-[20px] text-[#172B4D] m-0 font-medium">Change Password</h2>
          <button
            className="bg-transparent border-none text-[24px] text-[#6B778C] cursor-pointer p-0 w-7 h-7 leading-none hover:text-[#172B4D] transition-colors"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-6">
          <div className="mb-5">
            <label className="block mb-1.5 text-[#172B4D] font-semibold text-[13px]">Current Password</label>
            <div className="relative flex items-center">
              <img
                src={showCurrentPassword
                  ? "https://cdn-icons-png.flaticon.com/512/159/159604.png"
                  : "https://cdn-icons-png.flaticon.com/512/2767/2767146.png"
                }
                alt={showCurrentPassword ? "Hide password" : "Show password"}
                className="absolute right-3 w-5 h-5 cursor-pointer pointer-events-auto z-[1] object-contain opacity-70 hover:opacity-100 transition-opacity"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              />
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className={inputClass}
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="block mb-1.5 text-[#172B4D] font-semibold text-[13px]">New Password</label>
            <div className="relative flex items-center">
              <img
                src={showNewPassword
                  ? "https://cdn-icons-png.flaticon.com/512/159/159604.png"
                  : "https://cdn-icons-png.flaticon.com/512/2767/2767146.png"
                }
                alt={showNewPassword ? "Hide password" : "Show password"}
                className="absolute right-3 w-5 h-5 cursor-pointer pointer-events-auto z-[1] object-contain opacity-70 hover:opacity-100 transition-opacity"
                onClick={() => setShowNewPassword(!showNewPassword)}
              />
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className={inputClass}
              />
            </div>
          </div>

          {error && <span className="block text-[#DE350B] text-[12px] mt-1 mb-3">{error}</span>}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              className="px-4 py-2 rounded text-[14px] font-medium cursor-pointer bg-[#FAFBFC] text-[#42526E] border border-[#DFE1E6] hover:bg-[#EBECF0] transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded text-[14px] font-medium cursor-pointer bg-[#0052CC] text-white border-none hover:bg-[#0065FF] active:bg-[#0747A6] disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              disabled={loading}
            >
              {loading && <Spinner className="size-4" />}
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
