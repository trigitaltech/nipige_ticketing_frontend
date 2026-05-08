import { useState } from 'react';
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { getUserName } from './utils';
import UserAvatar from './UserAvatar';

const UserCombobox = ({ users, selectedUserIds, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const usersArr = Array.isArray(users) ? users : [];
  const selectedIds = Array.isArray(selectedUserIds) ? selectedUserIds : [];
  const allIds = usersArr.map(u => String(u._id));
  const allSelected = usersArr.length > 0 && selectedIds.length === usersArr.length;

  const filtered = usersArr.filter(u =>
    getUserName(u).toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter(v => v !== id));
    else onChange([...selectedIds, id]);
  };

  const triggerLabel = (() => {
    if (selectedIds.length === 0) return 'All Assignees';
    if (selectedIds.length === 1) {
      const u = usersArr.find(x => String(x._id) === selectedIds[0]);
      return u ? getUserName(u) : '1 Assignee';
    }
    if (allSelected) return 'All Assignees';
    return `${selectedIds.length} Assignees`;
  })();

  const isFiltered = selectedIds.length > 0 && !allSelected;

  return (
    <Sheet open={disabled ? false : open} onOpenChange={disabled ? undefined : setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={`h-[22px] inline-flex items-center gap-1.5 px-3 rounded-full border text-[12px] font-medium transition-colors whitespace-nowrap shrink-0 ${disabled ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed opacity-60' : `cursor-pointer ${isFiltered ? 'border-[#3B2FB1]/30 bg-[#3B2FB1]/10 text-[#3B2FB1]' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          {triggerLabel}
        </button>
      </SheetTrigger>
      <SheetContent side="right" showOverlay={false} className="!w-[300px] !max-w-[300px] p-0 flex flex-col !top-12 !h-[calc(100%-3rem)] border-t border-slate-200">

        <SheetHeader className="px-4 pt-4 pb-3 border-b border-slate-100">
          <SheetTitle className="text-[14px] font-semibold text-slate-800">Select Assignees</SheetTitle>
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

        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 gap-2">
          <button
            type="button"
            onClick={() => onChange(allSelected ? [] : allIds)}
            className="text-[12px] font-semibold text-[#3B2FB1] hover:underline cursor-pointer"
          >
            {allSelected ? 'Clear all' : 'Select all'}
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={selectedIds.length === 0}
            className={`text-[12px] font-medium ${selectedIds.length === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-700 cursor-pointer'}`}
          >
            Cancel selection
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-1.5">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-[13px] text-slate-400 text-center">No results found</div>
          ) : (
            filtered.map(u => {
              const id = String(u._id);
              const isSelected = selectedIds.includes(id);
              const name = getUserName(u);
              return (
                <label
                  key={id}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] cursor-pointer transition-colors hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(id)}
                    className="w-[14px] h-[14px] accent-[#3B2FB1] cursor-pointer shrink-0"
                  />
                  <UserAvatar name={name} size={28} />
                  <span className="flex-1 text-left truncate font-medium text-slate-700">{name}</span>
                </label>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UserCombobox;
