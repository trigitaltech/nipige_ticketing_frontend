import ProfileDropdown from '../profile/ProfileDropdown';
import SearchBar from '../shared/SearchBar';
import { Button } from '@/components/ui/button';

const Header = ({
  avatarLabel,
  userEmail,
  onCreateTicket,
  onLogout,
  searchQuery,
  setSearchQuery,
  showCreateButton = true,
}) => {
  const showSearch = typeof setSearchQuery === 'function';

  return (
    <header className="bg-gray-50 px-6 py-2 grid grid-cols-3 items-center gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-[18px] font-bold text-slate-900 truncate">
          TRIGITAL Task Management
        </h1>
      </div>

      <div className="flex justify-center">
        {showSearch && (
          <div className="w-full max-w-md">
            <SearchBar value={searchQuery || ''} onChange={setSearchQuery} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 justify-end">
        {showCreateButton && (
          <Button
            onClick={onCreateTicket}
            size="sm"
            className="!bg-[#5449D6] text-white border-transparent hover:!bg-[#5449D6] hover:brightness-110 focus-visible:ring-[#5449D6]/30 rounded-lg h-8 px-3 text-[13px]"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Task
          </Button>
        )}
        <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        <ProfileDropdown avatarLabel={avatarLabel} userEmail={userEmail} onLogout={onLogout} />
      </div>
    </header>
  );
};

export default Header;
