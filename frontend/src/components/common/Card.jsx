import React from 'react';

export const Card = ({
  children,
  title,
  subtitle,
  action,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footer,
  ...props
}) => {
  return (
    <div className={`card ${className}`.trim()} {...props}>
      {(title || action) && (
        <div className={`card-header ${headerClassName}`.trim()}>
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-500 mt-1" style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`card-body ${bodyClassName}`.trim()}>{children}</div>
      {footer && <div className="card-footer mt-4 pt-3 border-t" style={{ borderTop: '1px solid var(--slate-100)', marginTop: '16px', paddingTop: '12px' }}>{footer}</div>}
    </div>
  );
};

export default Card;
