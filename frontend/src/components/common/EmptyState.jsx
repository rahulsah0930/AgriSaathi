import React from 'react';
import { PackageOpen } from 'lucide-react';
import Button from './Button';

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No records found',
  description = 'There is currently no information available in this section.',
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`empty-state ${className}`.trim()}
      style={{
        textAlign: 'center',
        padding: '48px 24px',
        backgroundColor: '#ffffff',
        border: '1px dashed var(--slate-300)',
        borderRadius: 'var(--radius-lg)',
        margin: '16px 0',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--slate-100)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: 'var(--slate-400)',
        }}
      >
        <Icon size={28} />
      </div>
      <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--slate-800)', marginBottom: '6px' }}>
        {title}
      </h4>
      <p style={{ fontSize: '0.9rem', color: 'var(--slate-500)', maxWidth: '420px', margin: '0 auto 20px' }}>
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
