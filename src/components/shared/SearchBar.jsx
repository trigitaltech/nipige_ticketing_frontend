const SearchBar = ({ value, onChange, placeholder = 'Search' }) => {
  return (
    <div className="relative flex items-center flex-1 bg-white border border-slate-200 rounded-3xl px-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-colors">
      <svg
        className="absolute left-3 text-gray-400 pointer-events-none shrink-0"
        width="15"
        height="15"
        viewBox="0 0 16 16"
        fill="currentColor"
      >
        <path d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zm-.82 4.74a6 6 0 1 1 1.06-1.06l3.04 3.04a.75.75 0 1 1-1.06 1.06l-3.04-3.04z" />
      </svg>
      <input
        type="text"
        className="w-[60%] py-1 pl-7 pr-3 border-none bg-transparent outline-none text-[13px] text-[#172B4D] placeholder-gray-400"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
