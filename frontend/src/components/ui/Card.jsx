const Card = ({ children, className = '', padding = 'p-6', ...props }) => {
  return (
    <div
      className={`bg-surface border border-border shadow-sm rounded-2xl ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
