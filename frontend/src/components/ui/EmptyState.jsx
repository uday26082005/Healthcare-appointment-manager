import React from 'react';
import { PackageOpen } from 'lucide-react';

const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No Data Available',
  description,
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-surface border border-border border-dashed rounded-2xl ${className}`}>
      <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-main mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
};

export default EmptyState;
