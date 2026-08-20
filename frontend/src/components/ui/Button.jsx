const Button = ({
  children,
  variant = 'primary',
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm h-10';

  const variants = {
    primary:
      'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
    secondary:
      'bg-secondary text-white hover:opacity-90 focus:ring-secondary',
    outline:
      'border border-border text-main hover:bg-slate-50 focus:ring-primary',
    danger:
      'bg-error text-white hover:opacity-90 focus:ring-error',
    ghost:
      'text-main hover:bg-slate-100 focus:ring-slate-200',
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
