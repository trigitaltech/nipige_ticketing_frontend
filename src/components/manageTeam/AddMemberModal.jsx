import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PortalMultiSelect } from '../shared/FilterDropdown';
import { getUserDisplayName } from './teamUtils';

const AddMemberModal = ({ projectName, availableUsers, loading, onAdd, onClose }) => {
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [role, setRole] = useState('');

  const handleAdd = () => {
    if (selectedUserIds.length === 0) return;
    onAdd(selectedUserIds, role.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15,23,42,0.45)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Add Team Member</h3>
            <p className="text-xs text-slate-500 mt-0.5">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Fields */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">User</label>
            <PortalMultiSelect
              options={availableUsers.map((u) => ({ value: u._id, label: getUserDisplayName(u) }))}
              value={selectedUserIds}
              onChange={setSelectedUserIds}
              placeholder="Search user…"
              showAvatar
              triggerClassName="w-full h-9 flex items-center justify-between px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm cursor-pointer gap-1.5 overflow-hidden text-slate-700"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Role</label>
            <input
              type="text"
              placeholder="e.g. Developer, Designer…"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 !bg-[#5449D6] border-transparent hover:!bg-[#5449D6] hover:brightness-110"
            disabled={selectedUserIds.length === 0 || loading}
            onClick={handleAdd}
          >
            {loading ? 'Adding…' : 'Add Member'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;
