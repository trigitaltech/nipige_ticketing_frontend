import ProfileDropdown from '../profile/ProfileDropdown';

const Header = ({ fullName, avatarLabel, userEmail, onCreateTicket, onLogout }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">TRIGITAL Task Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Welcome back, {fullName}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onCreateTicket}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Task
        </button>
        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        <ProfileDropdown avatarLabel={avatarLabel} userEmail={userEmail} onLogout={onLogout} />
      </div>
    </header>
  );
};

export default Header;
