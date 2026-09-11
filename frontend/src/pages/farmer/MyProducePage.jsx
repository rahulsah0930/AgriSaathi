import React, { useState, useEffect, useCallback } from 'react';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  StatusBadge,
  EmptyState,
  LoadingState,
  FilterPanel,
  SearchBar,
  Table,
} from '../../components/common';
import {
  Package,
  PlusCircle,
  Eye,
  Edit3,
  Trash2,
  Warehouse,
  TrendingUp,
  Tag,
  Sparkles,
  RefreshCw,
  Filter,
  Camera,
  Sprout,
} from 'lucide-react';
import { api, getImageUrl } from '../../services/api';


const STATUS_COLORS = {
  ACTIVE: 'success',
  DRAFT: 'warning',
  RESERVED: 'info',
  SOLD: 'success',
  EXPIRED: 'danger',
  CANCELLED: 'danger',
};

const STORAGE_LABELS = {
  NOT_STORED: 'At Farm',
  IN_STORAGE: 'In Storage',
  SCHEDULED: 'Storage Scheduled',
};

export const MyProducePage = ({ user, onNavigate, onViewLot }) => {
  const [lots, setLots] = useState([]);
  const [filteredLots, setFilteredLots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLots = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sellerId = user?.id || 1;
      const data = await api.get(`/api/lots?seller_id=${sellerId}`);
      setLots(data.lots || []);
      setFilteredLots(data.lots || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLots();
  }, [fetchLots]);

  // Apply client-side filters
  useEffect(() => {
    let result = [...lots];

    if (statusFilter !== 'ALL') {
      result = result.filter((lot) => lot.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (lot) =>
          lot.crop.toLowerCase().includes(q) ||
          lot.variety?.toLowerCase().includes(q) ||
          lot.district.toLowerCase().includes(q) ||
          lot.location.toLowerCase().includes(q)
      );
    }

    setFilteredLots(result);
  }, [lots, statusFilter, searchQuery]);

  const handleDeleteLot = async (lotId) => {
    if (!window.confirm('Are you sure you want to delete this draft lot?')) return;
    try {
      await api.delete(`/api/lots/${lotId}`);
      setLots((prev) => prev.filter((l) => l.id !== lotId));
    } catch (err) {
      alert(err.message || 'Could not delete lot.');
    }
  };

  const handleCancelLot = async (lotId) => {
    if (!window.confirm('Cancel this lot listing?')) return;
    try {
      await api.patch(`/api/lots/${lotId}/status`, { status: 'CANCELLED' });
      setLots((prev) =>
        prev.map((l) => (l.id === lotId ? { ...l, status: 'CANCELLED' } : l))
      );
    } catch (err) {
      alert(err.message || 'Could not cancel lot.');
    }
  };

  // Summary statistics
  const stats = {
    total: lots.length,
    active: lots.filter((l) => l.status === 'ACTIVE').length,
    reserved: lots.filter((l) => l.status === 'RESERVED').length,
    sold: lots.filter((l) => l.status === 'SOLD').length,
    draft: lots.filter((l) => l.status === 'DRAFT').length,
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="My Produce"
          subtitle="Loading your crop lot listings..."
          icon={Package}
        />
        <LoadingState message="Fetching your produce listings..." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="My Produce"
        subtitle={`${stats.total} lot${stats.total !== 1 ? 's' : ''} listed — ${stats.active} active, ${stats.reserved} reserved, ${stats.sold} sold`}
        icon={Package}
        action={
          <Button
            variant="primary"
            size="sm"
            icon={PlusCircle}
            onClick={() => onNavigate('add-produce')}
          >
            Add New Lot
          </Button>
        }
      />

      {/* Quick Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {[
          { label: 'Total Lots', value: stats.total, color: 'var(--primary-700)' },
          { label: 'Active', value: stats.active, color: 'var(--status-success-text)' },
          { label: 'Reserved', value: stats.reserved, color: 'var(--status-info-text)' },
          { label: 'Sold', value: stats.sold, color: 'var(--accent-amber)' },
          { label: 'Draft', value: stats.draft, color: 'var(--slate-500)' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: s.color,
                lineHeight: 1.1,
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', marginTop: '4px' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['ALL', 'ACTIVE', 'DRAFT', 'RESERVED', 'SOLD', 'CANCELLED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: statusFilter === s ? '2px solid var(--primary-600)' : '1px solid var(--border-color)',
                backgroundColor: statusFilter === s ? 'var(--primary-50)' : '#ffffff',
                color: statusFilter === s ? 'var(--primary-800)' : 'var(--slate-600)',
                fontWeight: statusFilter === s ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              {s !== 'ALL' && (
                <span style={{ marginLeft: '5px', opacity: 0.7 }}>
                  ({lots.filter((l) => l.status === s).length})
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search crops, district..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '7px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem',
              width: '200px',
              outline: 'none',
            }}
          />
          <button
            onClick={fetchLots}
            title="Refresh"
            style={{
              padding: '7px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <RefreshCw size={16} color="var(--slate-500)" />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#b91c1c',
            fontSize: '0.9rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Empty State */}
      {filteredLots.length === 0 && !error && (
        <EmptyState
          icon={Package}
          title={statusFilter === 'ALL' ? 'No Produce Listed Yet' : `No ${statusFilter.toLowerCase()} lots`}
          description={
            statusFilter === 'ALL'
              ? 'Start by adding your harvest to the marketplace. Buyers across Maharashtra will be able to discover your produce.'
              : `You have no lots with status "${statusFilter}".`
          }
          action={
            statusFilter === 'ALL' && (
              <Button variant="primary" icon={PlusCircle} onClick={() => onNavigate('add-produce')}>
                Add Your First Lot
              </Button>
            )
          }
        />
      )}

      {/* Lot Cards */}
      {filteredLots.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredLots.map((lot) => (
            <div
              key={lot.id}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '18px',
                transition: 'box-shadow 0.2s ease',
                cursor: 'pointer',
              }}
              onClick={() => onViewLot && onViewLot(lot.id)}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
            >
              {/* Thumbnail Image */}
              <div
                style={{
                  position: 'relative',
                  width: '74px',
                  height: '74px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  flexShrink: 0,
                  backgroundColor: 'var(--primary-50)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {lot.primary_image_url || lot.image_url ? (
                  <img
                    src={getImageUrl(lot.primary_image_url || lot.image_url)}
                    alt={lot.crop}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <Sprout size={28} color="var(--primary-600)" />
                )}
                {lot.images_count > 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '3px',
                      right: '3px',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: '#ffffff',
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      padding: '1px 4px',
                      borderRadius: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <Camera size={8} /> {lot.images_count}
                  </div>
                )}
              </div>

              {/* Left: Crop Info */}
              <div style={{ flex: 1, minWidth: 0 }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: 'var(--slate-900)',
                    }}
                  >
                    {lot.crop}
                  </h4>
                  {lot.variety && lot.variety !== 'Standard' && (
                    <span style={{ fontSize: '0.82rem', color: 'var(--slate-500)' }}>
                      ({lot.variety})
                    </span>
                  )}
                  <Badge variant={STATUS_COLORS[lot.status] || 'default'}>
                    {lot.status}
                  </Badge>
                  {lot.verification_status === 'VERIFIED' ? (
                    <Badge variant="success">✓ Verified Grade</Badge>
                  ) : lot.verification_status === 'VERIFICATION_REQUESTED' ? (
                    <Badge variant="info">Verification Pending</Badge>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--slate-500)',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid var(--border-color)',
                        padding: '2px 7px',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 600,
                      }}
                    >
                      Self-Reported
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px',
                    fontSize: '0.83rem',
                    color: 'var(--slate-600)',
                  }}
                >
                  <span>
                    📦 {lot.quantity} {lot.unit}
                  </span>
                  <span>⭐ {lot.quality_grade}</span>
                  <span>📍 {lot.district}</span>
                  <span>🗓 Harvested: {lot.harvest_date}</span>
                  <span>
                    🏬{' '}
                    {STORAGE_LABELS[lot.storage_status] || lot.storage_status}
                  </span>
                </div>
              </div>

              {/* Center: Price */}
              <div style={{ textAlign: 'right', minWidth: '120px' }}>
                <div
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: 'var(--primary-700)',
                  }}
                >
                  ₹{lot.expected_price.toLocaleString('en-IN')}
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--slate-500)' }}>
                    /{lot.unit}
                  </span>
                </div>
                {lot.offers_count > 0 && (
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--accent-amber)',
                      fontWeight: 600,
                      marginTop: '4px',
                    }}
                  >
                    <Tag size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
                    {lot.offers_count} buyer offer{lot.offers_count > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Right: Actions */}
              <div
                style={{ display: 'flex', gap: '6px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  title="View Details"
                  onClick={() => onViewLot && onViewLot(lot.id)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Eye size={16} color="var(--primary-600)" />
                </button>
                {lot.status !== 'SOLD' && lot.status !== 'CANCELLED' && (
                  <button
                    title="Cancel Listing"
                    onClick={() => handleCancelLot(lot.id)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid #fecaca',
                      backgroundColor: '#fff5f5',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Trash2 size={16} color="#dc2626" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProducePage;
