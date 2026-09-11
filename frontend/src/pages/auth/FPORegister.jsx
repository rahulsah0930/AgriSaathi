import React, { useState } from 'react';
import { Card, Input, Select, Button, Badge } from '../../components/common';
import { Building2, ShieldAlert, ArrowLeft, Users } from 'lucide-react';
import api from '../../services/api';

const MAHARASHTRA_DISTRICTS = [
  'Nashik', 'Pune', 'Ahmednagar', 'Jalgaon', 'Kolhapur', 'Solapur',
  'Satara', 'Sangli', 'Aurangabad', 'Nagpur', 'Amravati', 'Nanded',
  'Beed', 'Latur', 'Dhule', 'Buldhana', 'Yavatmal', 'Osmanabad'
];

export const FPORegister = ({ onBackToLanding, onRegisterSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    fpo_name: '',
    registration_number: '',
    contact_person: '',
    aadhaar: '',
    phone: '',
    email: '',
    password: '',
    confirm_password: '',
    district: 'Nashik',
    state: 'Maharashtra',
    member_count: '',
    primary_crops: 'Onion, Tomato, Soybean',
    bank_account: '',
    ifsc_code: '',
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
    if (!formData.fpo_name || !formData.registration_number || !formData.contact_person || !formData.phone || !formData.password || !formData.district) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit contact number.');
      return;
    }

    const cleanAadhaar = formData.aadhaar ? formData.aadhaar.replace(/\D/g, '') : '';
    if (cleanAadhaar.length > 0 && cleanAadhaar.length !== 12) {
      setError('Authorized Representative Aadhaar Card number must be exactly 12 digits.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/auth/register/fpo', formData);
      if (res.success) {
        onRegisterSuccess(res.user, res.message);
      } else {
        setError(res.message || 'FPO registration failed.');
      }
    } catch (err) {
      setError(err.message || 'Server error during FPO registration.');
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
              <Building2 size={24} color="var(--primary-700)" />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                FPO Organization Registration
              </h2>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginTop: '4px' }}>
              Register your Farmer Producer Company to aggregate member harvest and negotiate bulk corporate contracts.
            </p>
          </div>
          <Badge variant="warning">
            Status: PENDING VERIFICATION
          </Badge>
        </div>

        {/* Security & Prototype Notice */}
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
            <strong>SIH Prototype Notice:</strong> Official government verification of Registration Numbers & Bank details will be processed through the Government Admin Verification Portal.
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
          {/* Organization Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <Input
              label="FPO / FPC Legal Name"
              name="fpo_name"
              placeholder="e.g. Sahyadri Farmers Producer Co. Ltd."
              value={formData.fpo_name}
              onChange={handleChange}
              required
            />

            <Input
              label="FPO Registration Number"
              name="registration_number"
              placeholder="e.g. FPO-MH-NSK-2023-089"
              value={formData.registration_number}
              onChange={handleChange}
              required
              helperText="Govt / MCA registration number"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <Input
              label="Contact Person / Authorized Representative"
              name="contact_person"
              placeholder="e.g. Anand Rao Deshmukh"
              value={formData.contact_person}
              onChange={handleChange}
              required
            />

            <Input
              label="Authorized Signatory Aadhaar Card Number"
              name="aadhaar"
              placeholder="12-digit UID (e.g. 5421 8904 2314)"
              value={formData.aadhaar}
              onChange={handleChange}
              maxLength={14}
              helperText="12-digit UIDAI Number for Director / Representative KYC"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <Input
              label="Official Contact Phone"
              name="phone"
              type="tel"
              placeholder="e.g. 9823099999"
              value={formData.phone}
              onChange={handleChange}
              required
              helperText="Used for FPO login and trade notifications"
            />

            <Input
              label="Official Email Address"
              name="email"
              type="email"
              placeholder="contact@sahyadrifpo.org"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <Select
              label="Operating District"
              name="district"
              value={formData.district}
              onChange={handleChange}
              options={MAHARASHTRA_DISTRICTS}
              required
            />
          </div>

          {/* Password */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <Input
              label="Portal Password"
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

          {/* Membership & Crops */}
          <div style={{ borderTop: '1px solid var(--slate-100)', marginTop: '8px', paddingTop: '16px', marginBottom: '8px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--slate-800)', marginBottom: '12px' }}>
              Aggregation Scale
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <Input
                label="Number of Member Farmers"
                name="member_count"
                type="number"
                placeholder="e.g. 450"
                value={formData.member_count}
                onChange={handleChange}
                helperText="Total affiliated grower base"
              />

              <Input
                label="Primary Harvest Crops"
                name="primary_crops"
                placeholder="e.g. Tomato, Grapes, Onion, Soybean"
                value={formData.primary_crops}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Bank Detail Placeholder */}
          <div style={{ borderTop: '1px solid var(--slate-100)', marginTop: '8px', paddingTop: '16px', marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--slate-800)', marginBottom: '12px' }}>
              Bank Detail Placeholder (FPO Escrow / Settlement Account)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <Input
                label="Bank Account Number"
                name="bank_account"
                placeholder="e.g. 987654321012"
                value={formData.bank_account}
                onChange={handleChange}
                helperText="Masked on save (XXXXXX1012)"
              />

              <Input
                label="IFSC Code"
                name="ifsc_code"
                placeholder="e.g. HDFC0001890"
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
              Already registered as FPO? Login here
            </button>

            <Button type="submit" variant="primary" size="lg" disabled={loading}>
              {loading ? 'Submitting Registration...' : 'Submit FPO Registration'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default FPORegister;
