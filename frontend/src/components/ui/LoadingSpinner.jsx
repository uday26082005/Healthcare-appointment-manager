import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'md', className = '', fullScreen = false }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinner = (
    <Loader2 className={`${sizes[size]} animate-spin text-primary ${className}`} />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center p-4">
      {spinner}
    </div>
  );
};

export default LoadingSpinner;
