import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral', // success, warning, danger, info, neutral
  icon: Icon,
  className = '',
  ...props
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()} {...props}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
};

export const StatusBadge = ({ status, className = '' }) => {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  let variant = 'neutral';
  let label = status;

  switch (normalized) {
    case 'ACTIVE':
    case 'VERIFIED':
    case 'ACCEPTED':
    case 'AVAILABLE':
    case 'COMPLETED':
      variant = 'success';
      break;

    case 'PENDING':
    case 'LIMITED':
    case 'REQUESTED':
    case 'COUNTERED':
    case 'SCHEDULED':
    case 'SELF_REPORTED':
      variant = 'warning';
      break;

    case 'REJECTED':
    case 'CANCELLED':
    case 'EXPIRED':
    case 'FULL':
      variant = 'danger';
      break;

    case 'DRAFT':
    case 'NOT_STORED':
    case 'NOT_INSPECTED':
      variant = 'neutral';
      break;

    case 'IN_STORAGE':
    case 'RESERVED':
    case 'SOLD':
      variant = 'info';
      break;

    default:
      variant = 'neutral';
      break;
  }

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
};

export default Badge;
