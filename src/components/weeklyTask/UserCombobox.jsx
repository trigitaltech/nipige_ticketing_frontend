import { useState } from 'react';
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { getUserName } from './utils';
import UserAvatar from './UserAvatar';

const UserCombobox = ({ users, selectedUserId, onSelect, disabled }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedUser = Array.isArray(users) && users.find(u => String(u._id) === selectedUserId);
  const selectedName = selectedUser ? getUserName(selectedUser) : null;

  const filtered = Array.isArray(users)
    ? users.filter(u => getUserName(u).toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <Sheet open={disabled ? false : open} onOpenChange={disabled ? undefined : setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={`h-[22px] inline-flex items-center gap-1.5 px-3 rounded-full border text-[12px] font-medium transition-colors ${disabled ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed opacity-60' : `cursor-pointer ${selectedName ? 'border-[#3B2FB1]/30 bg-[#3B2FB1]/10 text-[#3B2FB1]' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          {selectedName ?? 'Assignee'}
        </button>
      </SheetTrigger>
      <SheetContent side="right" showOverlay={false} className="!w-[300px] !max-w-[300px] p-0 flex flex-col !top-12 !h-[calc(100%-3rem)] border-t border-slate-200">

        <SheetHeader className="px-4 pt-4 pb-3 border-b border-slate-100">
          <SheetTitle className="text-[14px] font-semibold text-slate-800">Select Assignee</SheetTitle>
        </SheetHeader>

        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search user…"
              className="flex-1 text-[13px] bg-transparent outline-none text-slate-700 placeholder-slate-400"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-1.5">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-[13px] text-slate-400 text-center">No results found</div>
          ) : (
            filtered.map(u => {
              const id = String(u._id);
              const isSelected = id === selectedUserId;
              const name = getUserName(u);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => { onSelect(id); setOpen(false); setSearch(''); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] cursor-pointer transition-colors hover:bg-slate-50"
                >
                  <UserAvatar name={name} size={28} />
                  <span className="flex-1 text-left truncate font-medium text-slate-700">{name}</span>
                  {isSelected && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5449D6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UserCombobox;
