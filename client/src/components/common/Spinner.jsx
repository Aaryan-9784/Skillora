const Spinner = ({ size = "md", className = "" }) => {
  const sizes = { xs: "h-3 w-3", sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" };
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg className={`animate-spin text-brand ${sizes[size]}`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    </div>
  );
};

export default Spinner;
