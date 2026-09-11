import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  PlusCircle,
  Package,
  Sparkles,
  Tag,
  Warehouse,
  Receipt,
  CreditCard,
  AlertCircle,
  Bell,
  User,
  Truck,
  Users
} from 'lucide-react';

export const Sidebar = ({
  activeRoute = 'dashboard',
  onRouteChange,
  userRole = 'FARMER',
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'markets', label: 'Market Prices', icon: TrendingUp },
    { id: 'add-produce', label: 'Add Produce', icon: PlusCircle },
    { id: 'my-lots', label: 'My Lots', icon: Package },
    { id: 'fpo-aggregation', label: userRole === 'FARMER' ? 'Join FPO (Pooling)' : 'FPO Aggregation', icon: Users, badge: userRole === 'FPO' ? 'Core' : '+Profit' },
    { id: 'ai-advisor', label: 'AI Advisor', icon: Sparkles, badge: 'Core AI' },
    { id: 'buyer-offers', label: 'Buyer Offers', icon: Tag },
    { id: 'storage', label: 'Storage Discovery', icon: Warehouse },
    { type: 'divider', label: 'Transactions & Support' },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'payments', label: 'Payments & Escrow', icon: CreditCard },
    { id: 'grievances', label: 'Grievances', icon: AlertCircle },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'logistics', label: 'Logistics', icon: Truck, comingSoon: true },
  ];

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 64px)',
        position: 'sticky',
        top: '64px',
        overflowY: 'auto',
        padding: '16px 12px',
      }}
    >
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item, index) => {
          if (item.type === 'divider') {
            return (
              <div
                key={`divider-${index}`}
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--slate-400)',
                  padding: '14px 12px 6px',
                  letterSpacing: '0.04em',
                }}
              >
                {item.label}
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = activeRoute === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onRouteChange(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--primary-50)' : 'transparent',
                color: isActive ? 'var(--primary-800)' : 'var(--slate-600)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon
                  size={18}
                  style={{ color: isActive ? 'var(--primary-700)' : 'var(--slate-400)' }}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    backgroundColor: 'var(--primary-100)',
                    color: 'var(--primary-800)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 700,
                  }}
                >
                  {item.badge}
                </span>
              )}

              {item.placeholder && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    backgroundColor: 'var(--slate-100)',
                    color: 'var(--slate-500)',
                    padding: '1px 5px',
                    borderRadius: '4px',
                  }}
                >
                  Sys 2
                </span>
              )}

              {item.comingSoon && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    backgroundColor: 'var(--accent-amber-light)',
                    color: 'var(--accent-amber)',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}
                >
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
