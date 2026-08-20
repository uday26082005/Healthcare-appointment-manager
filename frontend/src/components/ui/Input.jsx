import React from 'react';

const Input = React.forwardRef(({ 
  label, 
  error, 
  className = '', 
  id,
  ...props 
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-main mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`
          block w-full h-10 px-3 py-2 rounded-lg border text-sm
          focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors
          disabled:bg-slate-50 disabled:text-muted disabled:cursor-not-allowed
          ${error 
            ? 'border-error focus:border-error focus:ring-error/20' 
            : 'border-border focus:border-primary focus:ring-primary/20 hover:border-slate-300'
          }
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-error">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
