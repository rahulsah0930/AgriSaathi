import React, { useState } from 'react';
import { Card, Input, Button, Badge } from '../../components/common';
import {
  LogIn,
  ArrowLeft,
  Sprout,
  Building2,
  Sparkles,
  ShoppingCart,
  Package,
  ShieldCheck
} from 'lucide-react';
import api from '../../services/api';

export const SellerLogin = ({
  initialRole = 'FARMER',
  onBackToLanding,
  onLoginSuccess,
  onSwitchToRegister,
}) => {
  const [role, setRole] = useState(initialRole);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier || !password) {
      setError('Please provide your registered phone/email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', {
        identifier,
        password,
        role,
      });

      if (res.success) {
        onLoginSuccess(res.user, res.message);
      } else {
        setError(res.message || 'Login failed.');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials or server error.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Demo Login handler
  const handleQuickDemoLogin = async (demoPhone, demoPass, demoRole) => {
    setRole(demoRole);
    setIdentifier(demoPhone);
    setPassword(demoPass);
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/api/auth/login', {
        identifier: demoPhone,
        password: demoPass,
        role: demoRole,
      });

      if (res.success) {
        onLoginSuccess(res.user, res.message);
      } else {
        setError(res.message || 'Demo login failed.');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  const roleLabels = {
    FARMER: { label: 'Individual Farmer', icon: <Sprout size={18} /> },
    FPO: { label: 'FPO / Cooperative', icon: <Building2 size={18} /> },
    BUYER: { label: 'Wholesale Buyer', icon: <ShoppingCart size={18} /> },
    WAREHOUSE: { label: 'Cold Storage', icon: <Package size={18} /> },
    ADMIN: { label: 'Government Admin', icon: <ShieldCheck size={18} /> },
  };

  const isSellerMode = role === 'FARMER' || role === 'FPO';

  const getHeading = () => {
    if (role === 'BUYER') return 'AgriSaathi Wholesale Buyer Login';
    if (role === 'WAREHOUSE') return 'Cold Storage & Warehouse Login';
    if (role === 'ADMIN') return 'Government Regulatory Admin Login';
    return 'AgriSaathi Seller Portal Login';
  };

  const getSubheading = () => {
    if (role === 'BUYER') return 'Sign in to access verified marketplace, contracts & escrow orders';
    if (role === 'WAREHOUSE') return 'Sign in to manage cold storage capacity and farmer bookings';
    if (role === 'ADMIN') return 'Sign in to access state oversight, escrow audits & dispute resolution';
    return 'Sign in to access your Farmer or FPO account';
  };

  return (
    <div style={{ maxWidth: '640px', margin: '30px auto', padding: '0 16px' }}>
      <button
        type="button"
        onClick={onBackToLanding}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          color: 'var(--primary-700)',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '16px',
          fontSize: '0.9rem',
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Landing Page</span>
      </button>

      <Card>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: role === 'BUYER' ? '#ecfdf5' : 'var(--primary-100)',
              color: role === 'BUYER' ? '#047857' : 'var(--primary-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            {role === 'BUYER' ? <ShoppingCart size={26} /> : <LogIn size={26} />}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-900)' }}>
            {getHeading()}
          </h2>
          <p style={{ color: 'var(--slate-600)', fontSize: '0.9rem', marginTop: '4px' }}>
            {getSubheading()}
          </p>
        </div>

        {/* Role Switcher Tabs (Only shown when in Seller Mode: Farmer & FPO) */}
        {isSellerMode && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              backgroundColor: 'var(--slate-100)',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
            }}
          >
            {['FARMER', 'FPO'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRole(r);
                  setError('');
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: role === r ? '#ffffff' : 'transparent',
                  color: role === r ? 'var(--primary-800)' : 'var(--slate-600)',
                  fontWeight: role === r ? 700 : 500,
                  fontSize: '0.9rem',
                  boxShadow: role === r ? 'var(--shadow-sm)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {roleLabels[r]?.icon}
                <span>{roleLabels[r]?.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Non-Seller Role Header Badge */}
        {!isSellerMode && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'var(--slate-100)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--slate-800)',
            }}
          >
            {roleLabels[role]?.icon}
            <span>Logging in as: <strong>{roleLabels[role]?.label || role}</strong></span>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--error-50)',
              border: '1px solid var(--error-200)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--error-800)',
              fontSize: '0.875rem',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label={role === 'ADMIN' ? 'Official Government ID / Phone / Email' : 'Registered Mobile Number or Email'}
            placeholder="e.g. 9823012345 or user@domain"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            Sign In to {roleLabels[role]?.label || 'Account'}
          </Button>
        </form>

        {role !== 'ADMIN' && (
          <div
            style={{
              textAlign: 'center',
              marginTop: '16px',
              fontSize: '0.875rem',
              color: 'var(--slate-600)',
            }}
          >
            Don't have an account yet?{' '}
            <button
              type="button"
              onClick={() => onSwitchToRegister && onSwitchToRegister(role)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-700)',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Register as {roleLabels[role]?.label || role}
            </button>
          </div>
        )}

        {/* 1-Click Demo Evaluation Box for Judges / Evaluators */}
        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: 'var(--primary-800)',
              marginBottom: '10px',
            }}
          >
            <Sparkles size={16} color="var(--primary-600)" />
            <span>Smart India Hackathon 1-Click Evaluation Accounts</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isSellerMode ? '1fr 1fr' : '1fr', gap: '8px' }}>
            {/* If Buyer Mode */}
            {role === 'BUYER' && (
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #10b981',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                    MahaFresh Wholesale & Retail
                  </span>
                  <Badge variant="success" size="sm">Govt Verified Buyer</Badge>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                  Navi Mumbai • APMC Direct Purchase License • Escrow Ready
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleQuickDemoLogin('9820011223', 'buyer123', 'BUYER')}
                  style={{ fontSize: '0.8rem', padding: '6px 12px', marginTop: '4px', backgroundColor: '#059669' }}
                >
                  1-Click Buyer Login (MahaFresh)
                </Button>
              </div>
            )}

            {/* If Warehouse Mode */}
            {role === 'WAREHOUSE' && (
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #2563eb',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                    Nashik Agro Cold Storage
                  </span>
                  <Badge variant="info" size="sm">Verified Warehouse</Badge>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                  MIDC Ambad, Nashik • 2500 MT Capacity • Multi-Chamber
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleQuickDemoLogin('9830022334', 'warehouse123', 'WAREHOUSE')}
                  style={{ fontSize: '0.8rem', padding: '6px 12px', marginTop: '4px' }}
                >
                  1-Click Warehouse Login
                </Button>
              </div>
            )}

            {/* If Admin Mode */}
            {role === 'ADMIN' && (
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #7c3aed',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                    MahaAgri State Nodal Officer
                  </span>
                  <Badge variant="neutral" size="sm">Regulatory Admin</Badge>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                  Government of Maharashtra • MSAMB Directorate Pune
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleQuickDemoLogin('9810000001', 'admin123', 'ADMIN')}
                  style={{ fontSize: '0.8rem', padding: '6px 12px', marginTop: '4px', backgroundColor: '#7c3aed' }}
                >
                  1-Click State Admin Login
                </Button>
              </div>
            )}

            {/* If Seller Mode (Farmer & FPO) */}
            {isSellerMode && (
              <>
                {/* Farmer Suresh Patil */}
                <div
                  style={{
                    padding: '8px 10px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-800)' }}>Suresh Patil</span>
                    <Badge variant="success" size="sm">Verified Farmer</Badge>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>Dindori, Nashik (Produce, APMC, AI)</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleQuickDemoLogin('9823012345', 'farmer123', 'FARMER')}
                    style={{ fontSize: '0.75rem', padding: '4px 8px', marginTop: '2px' }}
                  >
                    1-Click Farmer Login
                  </Button>
                </div>

                {/* FPO Sahyadri */}
                <div
                  style={{
                    padding: '8px 10px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-800)' }}>Sahyadri FPO</span>
                    <Badge variant="success" size="sm">Verified FPO</Badge>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>450 Members (Aggregation, Bulk pool)</span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleQuickDemoLogin('9823099999', 'fpo123', 'FPO')}
                    style={{ fontSize: '0.75rem', padding: '4px 8px', marginTop: '2px' }}
                  >
                    1-Click FPO Login
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SellerLogin;
