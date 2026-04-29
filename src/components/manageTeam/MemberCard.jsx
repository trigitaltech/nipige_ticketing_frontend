import { useState } from 'react';
import { avatarColors, getInitials } from './teamUtils';

const MemberCard = ({ member, onRemove, onRoleSave }) => {
  const [editing, setEditing] = useState(false);
  const [editRole, setEditRole] = useState('');

  const startEdit = () => {
    setEditRole(member.role);
    setEditing(true);
  };

  const save = () => {
    onRoleSave(member.id, editRole);
    setEditing(false);
  };

  const cancel = () => setEditing(false);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group flex flex-col items-center text-center relative">
      {/* Delete button */}
      <button
        onClick={() => onRemove(member.id)}
        className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
        aria-label={`Remove ${member.name}`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      {/* Avatar */}
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold mb-3 mt-1 ${avatarColors[member.colorIndex]}`}>
        {getInitials(member.name)}
      </div>

      {/* Name */}
      <p className="text-sm font-semibold text-slate-900 leading-tight truncate w-full px-1">{member.name}</p>

      {/* Role */}
      {editing ? (
        <div className="flex items-center gap-1 mt-2 w-full">
          <input
            type="text"
            value={editRole}
            onChange={(e) => setEditRole(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
            className="flex-1 text-xs border border-blue-300 rounded-lg px-2 py-1 text-slate-700 outline-none focus:border-blue-500 bg-white text-center"
            autoFocus
          />
          <button onClick={save} className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 cursor-pointer shrink-0">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button onClick={cancel} className="w-6 h-6 rounded-md border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-100 cursor-pointer shrink-0">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <button onClick={startEdit} className="mt-1.5 cursor-pointer group/role">
          {member.role ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
              {member.role}
              <svg className="w-2.5 h-2.5 opacity-0 group-hover/role:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.5-6.5a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
              </svg>
            </span>
          ) : (
            <span className="text-xs text-slate-300 italic hover:text-slate-400 transition-colors">Add role…</span>
          )}
        </button>
      )}
    </div>
  );
};

export default MemberCard;
