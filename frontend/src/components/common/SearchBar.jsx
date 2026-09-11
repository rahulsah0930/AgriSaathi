import React from 'react';
import { Search, X } from 'lucide-react';

export const SearchBar = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search by crop, market, or district...',
  className = '',
}) => {
  return (
    <div
      className={`search-bar-wrapper ${className}`.trim()}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <Search
        size={18}
        style={{
          position: 'absolute',
          left: '12px',
          color: 'var(--slate-400)',
          pointerEvents: 'none',
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 36px 10px 38px',
          fontSize: '0.9rem',
          border: '1px solid var(--slate-300)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#ffffff',
          color: 'var(--slate-800)',
          outline: 'none',
        }}
      />
      {value && (
        <button
          onClick={onClear}
          style={{
            position: 'absolute',
            right: '10px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--slate-400)',
            display: 'flex',
            alignItems: 'center',
            padding: '2px',
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
