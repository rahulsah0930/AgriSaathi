import React from 'react';

export const Button = ({
  children,
  variant = 'primary', // primary, secondary, outline-primary, danger
  size = 'md', // sm, md, lg
  type = 'button',
  disabled = false,
  onClick,
  icon: Icon,
  className = '',
  ...props
}) => {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  const variantClass = `btn-${variant}`;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 18} />}
      {children}
    </button>
  );
};

export default Button;
