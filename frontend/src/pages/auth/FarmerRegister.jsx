import React, { useState } from 'react';
import { Card, Input, Select, Button, Badge } from '../../components/common';
import { UserCheck, ShieldAlert, ArrowLeft, Sprout } from 'lucide-react';
import api from '../../services/api';

const MAHARASHTRA_DISTRICTS = [
  'Nashik', 'Pune', 'Ahmednagar', 'Jalgaon', 'Kolhapur', 'Solapur',
  'Satara', 'Sangli', 'Aurangabad', 'Nagpur', 'Amravati', 'Nanded',
  'Beed', 'Latur', 'Dhule', 'Buldhana', 'Yavatmal', 'Osmanabad'
];

export const FarmerRegister = ({ onBackToLanding, onRegisterSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    confirm_password: '',
    aadhaar: '',
    village: '',
    taluka: '',
    district: 'Nashik',
    state: 'Maharashtra',
    farm_size_acres: '',
    main_crops: 'Tomato, Onion',
    bank_name: '',
    bank_account: '',
    ifsc_code: '',
    account_holder_name: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formatAadhaar = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 12);
    const parts = [];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.slice(i, i + 4));
    }
    return parts.join(' ');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'aadhaar') {
      setFormData((prev) => ({ ...prev, aadhaar: formatAadhaar(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!formData.full_name || !formData.phone || !formData.password || !formData.village || !formData.taluka || !formData.district) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const cleanAadhaar = formData.aadhaar ? formData.aadhaar.replace(/\D/g, '') : '';
    if (cleanAadhaar.length > 0 && cleanAadhaar.length !== 12) {
      setError('Aadhaar Card number must be exactly 12 digits.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/auth/register/farmer', formData);
      if (res.success) {
        onRegisterSuccess(res.user, res.message);
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.message || 'Server error during farmer registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '32px auto', padding: '0 16px' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--slate-100)', paddingBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sprout size={24} color="var(--primary-700)" />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                Individual Farmer Registration
              </h2>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginTop: '4px' }}>
              Register your farm to publish crop lots and access AI sale recommendations.
            </p>
          </div>
          <Badge variant="warning">
            Status: PENDING VERIFICATION
          </Badge>
        </div>

        {/* Security & Prototype Disclosure Notice */}
        <div
          style={{
            backgroundColor: 'var(--slate-50)',
            border: '1px solid var(--slate-200)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: '0.825rem',
            color: 'var(--slate-600)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <ShieldAlert size={20} color="var(--accent-amber)" />
          <span>
            <strong>SIH Prototype Notice:</strong> Sensitive credentials (Aadhaar & Bank Details) are masked automatically (e.g. <code>XXXX XXXX 1234</code>) and never stored as raw identity data.
          </span>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'var(--status-danger-bg)',
              border: '1px solid var(--status-danger-border)',
              color: 'var(--status-danger-text)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              marginBottom: '16px',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Personal Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <Input
              label="Full Name"
              name="full_name"
              placeholder="e.g. Suresh Tukaram Patil"
              value={formData.full_name}
              onChange={handleChange}
              required
            />

            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="e.g. 9823012345"
              value={formData.phone}
              onChange={handleChange}
              required
              helperText="Used for login and SMS trade alerts"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <Input
              label="Email Address (Optional)"
              name="email"
              type="email"
              placeholder="suresh@example.com"
              value={formData.email}
              onChange={handleChange}
            />

            <Input
              label="Aadhaar Card Number"
              name="aadhaar"
              placeholder="12-digit UID (e.g. 5421 8904 2314)"
              value={formData.aadhaar}
              onChange={handleChange}
              maxLength={14}
              helperText="12-digit Aadhaar UID (Masked: XXXX XXXX 2314)"
            />
          </div>

          {/* Password */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <Input
              label="Account Password"
              name="password"
              type="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <Input
              label="Confirm Password"
              name="confirm_password"
              type="password"
              placeholder="Re-enter password"
              value={formData.confirm_password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Location Details */}
          <div style={{ borderTop: '1px solid var(--slate-100)', marginTop: '8px', paddingTop: '16px', marginBottom: '8px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--slate-800)', marginBottom: '12px' }}>
              Farm Location (Maharashtra)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <Input
                label="Village"
                name="village"
                placeholder="e.g. Dindori"
                value={formData.village}
                onChange={handleChange}
                required
              />

              <Input
                label="Taluka"
                name="taluka"
                placeholder="e.g. Dindori"
                value={formData.taluka}
                onChange={handleChange}
                required
              />

              <Select
                label="District"
                name="district"
                value={formData.district}
                onChange={handleChange}
                options={MAHARASHTRA_DISTRICTS}
                required
              />
            </div>
          </div>

          {/* Agricultural Profile */}
          <div style={{ borderTop: '1px solid var(--slate-100)', marginTop: '8px', paddingTop: '16px', marginBottom: '8px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--slate-800)', marginBottom: '12px' }}>
              Agricultural Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <Input
                label="Farm Size (Acres)"
                name="farm_size_acres"
                type="number"
                step="0.1"
                placeholder="e.g. 4.5"
                value={formData.farm_size_acres}
                onChange={handleChange}
              />

              <Input
                label="Main Harvest Crops"
                name="main_crops"
                placeholder="e.g. Tomato, Onion, Grapes"
                value={formData.main_crops}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Bank Detail Placeholder */}
          <div style={{ borderTop: '1px solid var(--slate-100)', marginTop: '8px', paddingTop: '16px', marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--slate-800)', marginBottom: '12px' }}>
              Bank Detail Placeholder (For Direct Sale Settlements)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '12px' }}>
              <Input
                label="Bank Name"
                name="bank_name"
                placeholder="e.g. State Bank of India, Bank of Maharashtra"
                value={formData.bank_name}
                onChange={handleChange}
              />
              <Input
                label="Account Holder Name"
                name="account_holder_name"
                placeholder="Farmer name as per passbook"
                value={formData.account_holder_name}
                onChange={handleChange}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <Input
                label="Bank Account Number"
                name="bank_account"
                placeholder="e.g. 1234567890"
                value={formData.bank_account}
                onChange={handleChange}
                helperText="Masked on save (XXXXXX7890)"
              />

              <Input
                label="IFSC Code"
                name="ifsc_code"
                placeholder="e.g. SBIN0001234"
                value={formData.ifsc_code}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={onSwitchToLogin}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-700)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              Already registered? Login here
            </button>

            <Button type="submit" variant="primary" size="lg" disabled={loading}>
              {loading ? 'Submitting Registration...' : 'Complete Farmer Registration'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default FarmerRegister;
