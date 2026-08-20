const Badge = ({
  children,
  variant = 'neutral',
  className = '',
  size = 'md'
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full';
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const variants = {
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    success: 'bg-green-50 text-success border border-green-200',
    warning: 'bg-amber-50 text-warning border border-amber-200',
    error: 'bg-red-50 text-error border border-red-200',
    info: 'bg-sky-50 text-info border border-sky-200',
  };

  return (
    <span className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
