import React from 'react';

export const StatCard = ({
  label,
  value,
  icon: Icon,
  helper,
  trend,
  className = '',
  iconColor,
  iconBg,
}) => {
  return (
    <div className={`stat-card ${className}`.trim()}>
      {Icon && (
        <div
          className="stat-icon-wrapper"
          style={{
            color: iconColor || 'var(--primary-700)',
            backgroundColor: iconBg || 'var(--primary-50)',
          }}
        >
          <Icon size={24} />
        </div>
      )}
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {helper && <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '2px' }}>{helper}</span>}
        {trend && (
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: trend.isUp ? 'var(--status-success-text)' : 'var(--status-danger-text)',
              marginTop: '2px',
            }}
          >
            {trend.isUp ? '▲' : '▼'} {trend.text}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
