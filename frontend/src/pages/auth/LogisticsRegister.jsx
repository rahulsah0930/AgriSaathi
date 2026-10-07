import React, { useState } from 'react';
import { Card, Input, Button, Badge } from '../../components/common';
import { Truck, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export const LogisticsRegister = ({
  onBackToLanding,
  onRegisterSuccess,
  onSwitchToLogin,
}) => {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    password: '',
    confirm_password: '',
    vehicle_count: '5',
    service_districts: 'Nashik, Pune, Mumbai, Ahmednagar',
    license_number: '',
    vehicle_types: ['PICKUP', 'LCV', 'TRUCK'],
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const vehicleOptions = [
    { key: 'MINI_TRUCK', label: 'Mini Truck (≤1 MT / Tata Ace)' },
    { key: 'PICKUP', label: 'Pickup (≤2.5 MT / Bolero Maxi)' },
    { key: 'LCV', label: 'LCV (≤6 MT / Eicher 6-Wheeler)' },
    { key: 'TRUCK', label: 'Heavy Truck (>6 MT / Multi-Axle)' },
    { key: 'REFRIGERATED_VEHICLE', label: 'Refrigerated Cold-Chain Van' },
  ];

  const handleCheckboxToggle = (key) => {
    setFormData((prev) => {
      const exists = prev.vehicle_types.includes(key);
      const nextTypes = exists
        ? prev.vehicle_types.filter((t) => t !== key)
        : [...prev.vehicle_types, key];
      return { ...prev, vehicle_types: nextTypes };
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (
      !formData.company_name ||
      !formData.contact_person ||
      !formData.phone ||
      !formData.password ||
      !formData.confirm_password
    ) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        company_name: formData.company_name,
        contact_person: formData.contact_person,
        phone: formData.phone,
        email: formData.email || undefined,
        password: formData.password,
        confirm_password: formData.confirm_password,
        vehicle_count: formData.vehicle_count,
        service_districts: formData.service_districts,
        license_number: formData.license_number,
        vehicle_types: formData.vehicle_types.join(','),
      };

      const res = await api.post('/api/auth/register/logistics', payload);

      if (res.success) {
        const token = res.token || res.access_token;
        if (token) api.setToken(token);
        if (res.user) api.setStoredUser(res.user);
        onRegisterSuccess(
          res.user,
          'Transporter registration completed successfully.',
          token
        );
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '30px auto', padding: '0 16px' }}>
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
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: '#2563eb',
            }}
          >
            <Truck size={28} />
          </div>
          <h2
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: 'var(--slate-900)',
              marginBottom: '6px',
            }}
          >
            Logistics & Transport Provider Registration
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--slate-600)',
              margin: 0,
            }}
          >
            Join AgriSaathi's rural freight network. Accept farmgate pickups,
            schedule dispatches, and provide verified delivery fulfillment.
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '18px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px',
              marginBottom: '14px',
            }}
          >
            <Input
              label="Fleet / Company Name *"
              name="company_name"
              placeholder="e.g. MahaAgri Express Logistics"
              value={formData.company_name}
              onChange={handleChange}
              required
            />
            <Input
              label="Authorized Contact Person *"
              name="contact_person"
              placeholder="e.g. Vikram Shinde"
              value={formData.contact_person}
              onChange={handleChange}
              required
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px',
              marginBottom: '14px',
            }}
          >
            <Input
              label="Mobile Number (OTP Enabled) *"
              name="phone"
              type="tel"
              placeholder="10-digit mobile"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            <Input
              label="Official Email (Optional)"
              name="email"
              type="email"
              placeholder="fleet@company.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px',
              marginBottom: '14px',
            }}
          >
            <Input
              label="Password *"
              name="password"
              type="password"
              placeholder="Min 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <Input
              label="Confirm Password *"
              name="confirm_password"
              type="password"
              placeholder="Re-enter password"
              value={formData.confirm_password}
              onChange={handleChange}
              required
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px',
              marginBottom: '16px',
            }}
          >
            <Input
              label="Operating Fleet Size (Vehicles)"
              name="vehicle_count"
              type="number"
              placeholder="e.g. 5"
              value={formData.vehicle_count}
              onChange={handleChange}
            />
            <Input
              label="RTO / Commercial Permit No. (Optional)"
              name="license_number"
              placeholder="e.g. MH-RTO-2024-LOG-9182"
              value={formData.license_number}
              onChange={handleChange}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <Input
              label="Service Districts / Corridors"
              name="service_districts"
              placeholder="e.g. Nashik, Pune, Mumbai, Ahmednagar"
              value={formData.service_districts}
              onChange={handleChange}
            />
          </div>

          {/* Supported Vehicle Types */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--slate-700)',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Supported Vehicle Types & Capabilities
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
              }}
            >
              {vehicleOptions.map((opt) => {
                const checked = formData.vehicle_types.includes(opt.key);
                return (
                  <div
                    key={opt.key}
                    onClick={() => handleCheckboxToggle(opt.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: checked
                        ? '1px solid #2563eb'
                        : '1px solid var(--border-color)',
                      backgroundColor: checked ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                    />
                    <span
                      style={{
                        color: checked ? '#1e40af' : 'var(--slate-800)',
                        fontWeight: checked ? 600 : 400,
                      }}
                    >
                      {opt.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              padding: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '0.8rem',
              color: 'var(--slate-600)',
              marginBottom: '20px',
            }}
          >
            🔒 <strong>SIH Prototype Transporter Agreement:</strong> Registration
            grants immediate prototype access to farm-to-hub freight orders.
            Official government RTO / GST verification belongs to subsequent
            governance phases.
          </div>

          <Button
            type="submit"
            variant="primary"
            style={{ width: '100%', padding: '12px' }}
            isLoading={loading}
          >
            Register Logistics Fleet
          </Button>
        </form>

        <div
          style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: 'var(--slate-600)',
          }}
        >
          Already registered as a Transporter?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-700)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Sign in here
          </button>
        </div>
      </Card>
    </div>
  );
};

export default LogisticsRegister;
