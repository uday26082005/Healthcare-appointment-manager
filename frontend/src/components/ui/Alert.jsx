import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const Alert = ({ type = 'error', message, className = '' }) => {
  if (!message) return null;

  const variants = {
    error: {
      bg: 'bg-red-50',
      text: 'text-error',
      border: 'border-red-200',
      Icon: AlertCircle,
    },
    success: {
      bg: 'bg-green-50',
      text: 'text-success',
      border: 'border-green-200',
      Icon: CheckCircle,
    },
    warning: {
      bg: 'bg-amber-50',
      text: 'text-warning',
      border: 'border-amber-200',
      Icon: AlertTriangle,
    },
    info: {
      bg: 'bg-sky-50',
      text: 'text-info',
      border: 'border-sky-200',
      Icon: Info,
    },
  };

  const { bg, text, border, Icon } = variants[type] || variants.error;

  return (
    <div className={`${bg} ${text} p-4 rounded-lg flex items-start gap-3 border ${border} ${className}`}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

export default Alert;
