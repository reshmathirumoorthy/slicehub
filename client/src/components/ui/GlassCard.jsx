function GlassCard({ children, className = '', as: Tag = 'div', ...props }) {
  return (
    <Tag
      className={`glass rounded-2xl ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}

export default GlassCard;
