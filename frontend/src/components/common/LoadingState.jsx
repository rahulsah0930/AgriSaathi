import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({ message = 'Loading data...', className = '' }) => {
  return (
    <div
      className={`loading-state ${className}`.trim()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        gap: '12px',
      }}
    >
      <Loader2
        size={32}
        className="animate-spin"
        style={{
          color: 'var(--primary-700)',
          animation: 'spin 1s linear infinite',
        }}
      />
      <span style={{ fontSize: '0.925rem', color: 'var(--slate-600)', fontWeight: 500 }}>
        {message}
      </span>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingState;
