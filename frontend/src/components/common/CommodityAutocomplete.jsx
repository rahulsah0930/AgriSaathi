import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, Check, Sprout } from 'lucide-react';
import api, { getImageUrl } from '../../services/api';

/**
 * CommodityAutocomplete - Centralized Agricultural Commodity Selector
 * Supports multilingual search (English, Hindi, Marathi, Roman scripts),
 * fuzzy matching, debounce, keyboard navigation, and real produce thumbnails.
 */
export const CommodityAutocomplete = ({
  label,
  id,
  name = 'crop',
  value = '',
  onChange,
  onSelect,
  placeholder = 'Search crop (e.g., Tomato, Tamatar, टमाटर, बटाटा)...',
  category = '',
  required = false,
  disabled = false,
  error = null,
  helperText = null,
  className = '',
}) => {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedCommodity, setSelectedCommodity] = useState(null);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync external value changes
  useEffect(() => {
    if (value !== undefined) {
      if (selectedCommodity && selectedCommodity.canonical_name === value) {
        // already synced
        return;
      }
      setQuery(value || '');
      if (value) {
        // Try to fetch the commodity object to display its thumbnail
        api.get(`/api/commodities/resolve?q=${encodeURIComponent(value)}`)
          .then((res) => {
            if (res?.commodity) {
              setSelectedCommodity(res.commodity);
            }
          })
          .catch(() => {});
      } else {
        setSelectedCommodity(null);
      }
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search suggestions
  const fetchCommodities = useCallback(async (searchQuery) => {
    setIsLoading(true);
    try {
      let endpoint = '';
      if (!searchQuery || !searchQuery.trim()) {
        endpoint = `/api/commodities?limit=12${category ? `&category=${encodeURIComponent(category)}` : ''}`;
      } else {
        endpoint = `/api/commodities/search?q=${encodeURIComponent(searchQuery)}&limit=10${category ? `&category=${encodeURIComponent(category)}` : ''}`;
      }
      const data = await api.get(endpoint);
      setResults(data?.commodities || []);
    } catch (err) {
      console.error('Failed to search commodities:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  // Handle typing with debounce
  const handleInputChange = (e) => {
    const nextQuery = e.target.value;
    setQuery(nextQuery);
    setSelectedCommodity(null);
    setIsOpen(true);
    setHighlightedIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchCommodities(nextQuery);
    }, 220);
  };

  const handleFocus = () => {
    if (disabled) return;
    setIsOpen(true);
    if (!results.length) {
      fetchCommodities(query);
    }
  };

  const handleSelect = (item) => {
    setSelectedCommodity(item);
    setQuery(item.canonical_name);
    setIsOpen(false);
    setHighlightedIndex(-1);

    // Call standard onChange with synthetic event
    if (onChange) {
      onChange({
        target: {
          name,
          value: item.canonical_name,
          commodity_id: item.id,
          commodity: item,
        },
      });
    }

    if (onSelect) {
      onSelect(item);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setQuery('');
    setSelectedCommodity(null);
    setResults([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (inputRef.current) inputRef.current.focus();

    if (onChange) {
      onChange({
        target: {
          name,
          value: '',
          commodity_id: null,
          commodity: null,
        },
      });
    }
    if (onSelect) {
      onSelect(null);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        fetchCommodities(query);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev < results.length - 1 ? prev + 1 : 0;
        scrollIntoView(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : results.length - 1;
        scrollIntoView(next);
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        handleSelect(results[highlightedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const scrollIntoView = (index) => {
    if (dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('.commodity-option');
      if (items[index]) {
        items[index].scrollIntoView({ block: 'nearest' });
      }
    }
  };

  const inputId = id || name;

  return (
    <div
      ref={containerRef}
      className={`form-group ${className}`.trim()}
      style={{ position: 'relative' }}
    >
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label} {required && <span style={{ color: 'var(--status-danger-text)' }}>*</span>}
        </label>
      )}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {/* Left produce thumbnail preview or search icon */}
        <div
          style={{
            position: 'absolute',
            left: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          {selectedCommodity?.image_url ? (
            <img
              src={getImageUrl(selectedCommodity.image_url)}
              alt={selectedCommodity.canonical_name}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid var(--primary-200)',
                background: '#fff',
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <Search size={18} color="var(--slate-400)" />
          )}
        </div>

        {/* Search Input */}
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          className="form-input"
          style={{
            paddingLeft: '40px',
            paddingRight: query ? '64px' : '36px',
            borderColor: error ? 'var(--status-danger-text)' : undefined,
            width: '100%',
          }}
        />

        {/* Right action icons (Loading / Clear) */}
        <div
          style={{
            position: 'absolute',
            right: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {isLoading && (
            <Loader2
              size={16}
              className="spin-animation"
              color="var(--primary-600)"
            />
          )}
          {query && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear selection"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--slate-400)',
                borderRadius: '50%',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--slate-700)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--slate-400)')}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {error && <span className="form-error">{error}</span>}
      {!error && helperText && <span className="form-helper">{helperText}</span>}

      {/* Dropdown Suggestions */}
      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--slate-200, #e2e8f0)',
            maxHeight: '320px',
            overflowY: 'auto',
          }}
        >
          {isLoading && results.length === 0 ? (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                color: 'var(--slate-500)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Loader2 size={16} className="spin-animation" />
              Searching commodities catalog...
            </div>
          ) : results.length === 0 ? (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                color: 'var(--slate-500)',
                fontSize: '0.875rem',
              }}
            >
              <div style={{ marginBottom: '4px', fontWeight: 500 }}>
                No matching agricultural commodities found.
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)' }}>
                Try searching in English, Hindi (टमाटर), Marathi (टोमॅटो), or common names.
              </div>
            </div>
          ) : (
            <div>
              <div
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--slate-400)',
                  backgroundColor: 'var(--slate-50, #f8fafc)',
                  borderBottom: '1px solid var(--slate-100, #f1f5f9)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>Agricultural Produce ({results.length})</span>
                <span>Mandi & e-NAM Catalog</span>
              </div>
              {results.map((item, index) => {
                const isSelected =
                  selectedCommodity?.id === item.id ||
                  (query && query.toLowerCase() === item.canonical_name.toLowerCase());
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={item.id}
                    className="commodity-option"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--slate-100, #f1f5f9)',
                      backgroundColor: isHighlighted
                        ? 'var(--primary-50, #ecfdf5)'
                        : isSelected
                        ? '#f0fdf4'
                        : '#ffffff',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {/* Produce Thumbnail */}
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        backgroundColor: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--slate-200)',
                      }}
                    >
                      {item.image_url ? (
                        <img
                          src={getImageUrl(item.image_url)}
                          alt={item.canonical_name}
                          loading="lazy"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentNode.innerHTML = '🌱';
                          }}
                        />
                      ) : (
                        <Sprout size={20} color="var(--primary-600)" />
                      )}
                    </div>

                    {/* Commodity Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '2px',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: '0.925rem',
                            color: isHighlighted
                              ? 'var(--primary-900, #064e3b)'
                              : 'var(--slate-800, #1e293b)',
                          }}
                        >
                          {item.canonical_name}
                        </span>
                        {item.category && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--slate-100)',
                              color: 'var(--slate-600)',
                              fontWeight: 500,
                            }}
                          >
                            {item.category}
                          </span>
                        )}
                        {item.match_score !== undefined && item.match_score < 100 && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              color: 'var(--slate-400)',
                              marginLeft: 'auto',
                            }}
                          >
                            {Math.round(item.match_score)}% match
                          </span>
                        )}
                      </div>

                      {/* Multilingual Subtitle */}
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--slate-500)',
                          display: 'flex',
                          gap: '8px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.hindi_name && (
                          <span>
                            हिन्दी: <strong>{item.hindi_name}</strong>
                          </span>
                        )}
                        {item.hindi_name && item.marathi_name && <span>•</span>}
                        {item.marathi_name && (
                          <span>
                            मराठी: <strong>{item.marathi_name}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Selected Checkmark */}
                    {isSelected && (
                      <Check
                        size={18}
                        color="var(--primary-600, #059669)"
                        style={{ flexShrink: 0 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommodityAutocomplete;
