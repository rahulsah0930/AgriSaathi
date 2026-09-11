import React from 'react';
import { Bell, User, LogOut, Sprout } from 'lucide-react';
import StatusBadge from './Badge';

export const Navbar = ({ user, onLogout, onNotificationClick, unreadCount = 0 }) => {
  return (
    <header
      style={{
        height: '64px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--primary-700)',
            fontWeight: 700,
            fontSize: '1.25rem',
          }}
        >
          <Sprout size={26} />
          <span>AgriSaathi</span>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            backgroundColor: 'var(--primary-50)',
            color: 'var(--primary-800)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 600,
            border: '1px solid var(--primary-200)',
          }}
        >
          Maharashtra GovTech SIH Prototype
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* User Info & Verification Status */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--slate-800)' }}>
                {user.name || user.phone}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                  {user.role}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: user.verification_status === 'VERIFIED' ? 'var(--status-success-text)' : 'var(--status-warning-text)' }}>
                  ({user.verification_status || 'PENDING'})
                </span>
              </div>
            </div>

            {/* Notification Bell */}
            <button
              onClick={onNotificationClick}
              style={{
                position: 'relative',
                background: 'var(--slate-100)',
                border: 'none',
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--slate-600)',
              }}
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    backgroundColor: 'var(--accent-amber)',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              style={{
                background: 'transparent',
                border: '1px solid var(--slate-200)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                color: 'var(--slate-600)',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
              title="Logout"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
