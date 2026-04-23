import '../../assets/Styles/SearchBar.css';

const SearchBar = ({ value, onChange, placeholder = 'Search' }) => {
  return (
    <div className="search-bar-wrapper bg-white border border-slate-200 rounded-3xl px-3 flex items-center gap-2 w-full focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-colors">
      <svg
        className="search-bar-icon"
        width="15"
        height="15"
        viewBox="0 0 16 16"
        fill="currentColor"
      >
        <path d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zm-.82 4.74a6 6 0 1 1 1.06-1.06l3.04 3.04a.75.75 0 1 1-1.06 1.06l-3.04-3.04z" />
      </svg>
      <input
        type="text"
        className="search-bar-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
