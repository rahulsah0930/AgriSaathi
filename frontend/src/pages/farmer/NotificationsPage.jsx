import React, { useState, useEffect, useCallback } from 'react';
import {
  PageHeader,
  Card,
  StatCard,
  Button,
  Badge,
  LoadingState,
  EmptyState,
} from '../../components/common';
import {
  Bell,
  Tag,
  TrendingUp,
  Warehouse,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Check,
  RefreshCw,
  SlidersHorizontal,
  IndianRupee,
  Users,
} from 'lucide-react';
import api from '../../services/api';

const NOTIF_TYPES = [
  { id: 'ALL', label: 'All Notifications' },
  { id: 'UNREAD', label: 'Unread Only' },
  { id: 'OFFER', label: 'Buyer Offers' },
  { id: 'PAYMENT', label: 'Escrow & Payments' },
  { id: 'PRICE', label: 'Price Alerts' },
  { id: 'STORAGE', label: 'Storage' },
  { id: 'FPO', label: 'FPO & Pooling' },
  { id: 'VERIFICATION', label: 'Verification' },
];

export const NotificationsPage = ({ user, onNavigate }) => {
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userId = user?.id || 1;
      let url = `/api/notifications?user_id=${userId}`;
      if (activeFilter === 'UNREAD') {
        url += '&unread_only=true';
      } else if (activeFilter !== 'ALL') {
        url += `&type=${activeFilter}`;
      }

      const res = await api.get(url);
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError(err.message || 'Error loading notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, activeFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post(`/api/notifications/mark-all-read`, { user_id: user?.id || 1 });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      setActionFeedback('All notifications marked as read.');
    } catch (err) {
      alert(`Failed to mark all as read: ${err.message}`);
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'OFFER':
        return <Tag size={20} color="var(--primary-700)" />;
      case 'PAYMENT':
        return <IndianRupee size={20} color="var(--primary-700)" />;
      case 'PRICE':
        return <TrendingUp size={20} color="var(--accent-amber)" />;
      case 'STORAGE':
        return <Warehouse size={20} color="var(--status-info-text)" />;
      case 'FPO':
        return <Users size={20} color="var(--primary-800)" />;
      case 'VERIFICATION':
        return <ShieldCheck size={20} color="var(--status-success-text)" />;
      default:
        return <Bell size={20} color="var(--slate-600)" />;
    }
  };

  const getNotifBg = (type) => {
    switch (type) {
      case 'OFFER':
        return 'var(--primary-50)';
      case 'PAYMENT':
        return '#f0fdf4';
      case 'PRICE':
        return 'var(--accent-amber-light)';
      case 'STORAGE':
        return 'var(--status-info-bg)';
      case 'FPO':
        return '#eff6ff';
      case 'VERIFICATION':
        return 'var(--status-success-bg)';
      default:
        return 'var(--slate-100)';
    }
  };

  const handleActionClick = (notif) => {
    handleMarkAsRead(notif.id);
    if (notif.type === 'OFFER' && onNavigate) {
      onNavigate('buyer-offers');
    } else if (notif.type === 'STORAGE' && onNavigate) {
      onNavigate('storage');
    } else if (notif.type === 'PRICE' && onNavigate) {
      onNavigate('markets');
    } else if (notif.type === 'VERIFICATION' && onNavigate) {
      onNavigate('profile');
    } else if (notif.type === 'PAYMENT' && onNavigate) {
      onNavigate('payments');
    } else if (notif.type === 'FPO' && onNavigate) {
      onNavigate('fpo-aggregation');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Notifications & System Alerts"
        subtitle="Live notifications on inbound procurement bids, APMC price surges, storage reservations, and government verifications."
        action={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline-primary"
              icon={RefreshCw}
              onClick={fetchNotifications}
            >
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="primary"
                icon={Check}
                onClick={handleMarkAllRead}
              >
                Mark All Read
              </Button>
            )}
          </div>
        }
      />

      {/* 2. Action Feedback */}
      {actionFeedback && (
        <div
          style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #6ee7b7',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#065f46',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="#10b981" />
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: '#065f46' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. Filter Bar */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        {NOTIF_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveFilter(t.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeFilter === t.id ? 'var(--primary-50)' : 'transparent',
              color: activeFilter === t.id ? 'var(--primary-800)' : 'var(--slate-600)',
              fontWeight: activeFilter === t.id ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{t.label}</span>
            {t.id === 'UNREAD' && unreadCount > 0 && (
              <span
                style={{
                  backgroundColor: 'var(--primary-600)',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontWeight: 700,
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 4. Notifications List */}
      {isLoading ? (
        <LoadingState message="Fetching system alerts..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Notifications"
          description="You are completely caught up! We will alert you when new buyer bids or price spikes occur."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                backgroundColor: notif.is_read ? '#ffffff' : '#f0fdf4',
                border: `1px solid ${notif.is_read ? 'var(--border-color)' : 'var(--primary-300)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px',
                boxShadow: notif.is_read ? 'none' : '0 2px 6px rgba(16, 185, 129, 0.08)',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    backgroundColor: getNotifBg(notif.type),
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getNotifIcon(notif.type)}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
                      {notif.title}
                    </h4>
                    {!notif.is_read && (
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          backgroundColor: 'var(--primary-600)',
                          borderRadius: '50%',
                        }}
                      />
                    )}
                    <Badge variant={notif.type === 'OFFER' ? 'success' : notif.type === 'PRICE' ? 'warning' : 'info'}>
                      {notif.type}
                    </Badge>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: 'var(--slate-700)', margin: '0 0 8px', lineHeight: 1.45 }}>
                    {notif.message}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                    <Clock size={13} />
                    <span>{notif.time_ago}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', flexShrink: 0 }}>
                {(notif.type === 'OFFER' || notif.type === 'STORAGE' || notif.type === 'PRICE') && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={ArrowRight}
                    onClick={() => handleActionClick(notif)}
                  >
                    {notif.type === 'OFFER' ? 'View Offer' : notif.type === 'STORAGE' ? 'View Storage' : 'View Mandi'}
                  </Button>
                )}

                {!notif.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      color: 'var(--slate-500)',
                      textDecoration: 'underline',
                      padding: '2px 0',
                    }}
                  >
                    Mark as read
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

export default NotificationsPage;
