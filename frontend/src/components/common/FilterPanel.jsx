import React from 'react';
import Card from './Card';
import Button from './Button';
import { Filter, RotateCcw } from 'lucide-react';

export const FilterPanel = ({
  title = 'Filter Results',
  children,
  onReset,
  onApply,
  className = '',
}) => {
  return (
    <Card className={`filter-panel ${className}`.trim()} style={{ backgroundColor: 'var(--slate-50)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--slate-800)', fontWeight: 600, fontSize: '0.95rem' }}>
          <Filter size={16} />
          <span>{title}</span>
        </div>
        {onReset && (
          <button
            onClick={onReset}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--slate-500)',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {children}
      </div>

      {onApply && (
        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
          <Button size="sm" variant="primary" onClick={onApply}>
            Apply Filters
          </Button>
        </div>
      )}
    </Card>
  );
};

export default FilterPanel;
