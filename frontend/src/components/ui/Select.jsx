import React from 'react';

const Select = React.forwardRef(({ 
  label, 
  error, 
  options = [], 
  className = '', 
  id,
  placeholder = 'Select an option',
  ...props 
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-main mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`
          block w-full h-10 px-3 py-2 rounded-lg border text-sm bg-surface appearance-none
          focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors
          disabled:bg-slate-50 disabled:text-muted disabled:cursor-not-allowed
          ${error 
            ? 'border-error focus:border-error focus:ring-error/20' 
            : 'border-border focus:border-primary focus:ring-primary/20 hover:border-slate-300'
          }
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-sm text-error">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
