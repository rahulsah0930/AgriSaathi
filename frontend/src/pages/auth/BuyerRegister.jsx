import React, { useState } from 'react';
import { Card, Input, Select, Button, Badge } from '../../components/common';
import { ShoppingCart, ShieldAlert, ArrowLeft, Building2, CreditCard, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

const MAHARASHTRA_DISTRICTS = [
  'Navi Mumbai', 'Mumbai', 'Pune', 'Nashik', 'Ahmednagar', 'Nagpur',
  'Kolhapur', 'Solapur', 'Aurangabad', 'Jalgaon', 'Satara', 'Sangli'
];

export const BuyerRegister = ({ onBackToLanding, onRegisterSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    company_name: '',
    authorized_person: '',
    aadhaar: '',
    business_registration: '',
    gst_number: '',
    procurement_categories: 'Tomato, Onion, Grapes, Wheat',
    phone: '',
    email: '',
    address: '',
    district: 'Navi Mumbai',
    state: 'Maharashtra',
    password: '',
    confirm_password: '',
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
    } else if (name === 'ifsc_code') {
      setFormData((prev) => ({ ...prev, ifsc_code: value.toUpperCase() }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.company_name || !formData.authorized_person || !formData.phone || !formData.password || !formData.district) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    const cleanAadhaar = formData.aadhaar ? formData.aadhaar.replace(/\D/g, '') : '';
    if (cleanAadhaar && cleanAadhaar.length !== 12) {
      setError('Aadhaar Card number must be exactly 12 digits.');
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

    setLoading(true);
    try {
      const res = await api.post('/api/auth/register/buyer', formData);
      if (res.success) {
        onRegisterSuccess(res.user, res.message);
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to backend.');
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
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-100)',
              color: 'var(--accent-800)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <ShoppingCart size={26} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-900)' }}>
            Wholesale Buyer Registration
          </h2>
          <p style={{ color: 'var(--slate-600)', fontSize: '0.9rem', marginTop: '4px' }}>
            Register your procurement company or retail chain on AgriSaathi
          </p>
        </div>

        <div
          style={{
            backgroundColor: 'var(--slate-50)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            marginBottom: '20px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
          }}
        >
          <ShieldAlert size={20} color="var(--primary-700)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.825rem', color: 'var(--slate-700)', lineHeight: '1.4' }}>
            <strong>Government Verification Policy:</strong> All registered buyer organizations start in{' '}
            <Badge variant="warning" size="sm">PENDING</Badge> verification. You can browse produce immediately,
            and full escrow deal execution unlocks once the Agriculture Nodal Officer verifies your Aadhaar UID, GST, and Bank Account.
          </div>
        </div>

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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Company / Enterprise Name *"
              name="company_name"
              placeholder="e.g. MahaFresh Foods Pvt Ltd"
              value={formData.company_name}
              onChange={handleChange}
              required
            />
            <Input
              label="Authorized Representative *"
              name="authorized_person"
              placeholder="Full name of representative"
              value={formData.authorized_person}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Aadhaar Card Number (Representative)"
              name="aadhaar"
              placeholder="XXXX XXXX XXXX (12 digits)"
              value={formData.aadhaar}
              onChange={handleChange}
              maxLength={14}
              helperText="12-digit Aadhaar UID for government verification (Masked on save)"
            />
            <Input
              label="GST Number (if registered)"
              name="gst_number"
              placeholder="e.g. 27AAACM1234F1Z5"
              value={formData.gst_number}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Business Registration (CIN / Shop Act)"
              name="business_registration"
              placeholder="e.g. CIN: U01409MH2021PTC355201"
              value={formData.business_registration}
              onChange={handleChange}
            />
            <Input
              label="Mobile Number (Login ID) *"
              name="phone"
              type="tel"
              placeholder="10-digit mobile number"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Business Email"
              name="email"
              type="email"
              placeholder="procurement@company.com"
              value={formData.email}
              onChange={handleChange}
            />
            <Select
              label="Procurement District *"
              name="district"
              value={formData.district}
              onChange={handleChange}
              options={MAHARASHTRA_DISTRICTS.map((d) => ({ value: d, label: d }))}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Primary Procurement Crops"
              name="procurement_categories"
              placeholder="e.g. Tomato, Onion, Grapes"
              value={formData.procurement_categories}
              onChange={handleChange}
            />
            <Input
              label="Delivery Hub / Warehouse Address"
              name="address"
              placeholder="Plot / Gat No. / APMC Yard / Landmark"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          {/* Trade Settlement & Escrow Bank Details */}
          <div
            style={{
              marginTop: '16px',
              marginBottom: '16px',
              padding: '16px',
              backgroundColor: 'var(--slate-50)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Building2 size={18} color="var(--primary-700)" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-800)', margin: 0 }}>
                Escrow & Settlement Bank Account Details
              </h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--slate-600)', marginBottom: '14px', lineHeight: 1.4 }}>
              Required for wholesale purchase contracts, escrow fund releases, and government compliance auditing.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <Input
                label="Bank Name"
                name="bank_name"
                placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                value={formData.bank_name}
                onChange={handleChange}
              />
              <Input
                label="Account Holder Name"
                name="account_holder_name"
                placeholder="Name as per bank passbook"
                value={formData.account_holder_name}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Bank Account Number"
                name="bank_account"
                placeholder="e.g. 11 to 16-digit account number"
                value={formData.bank_account}
                onChange={handleChange}
                helperText="Masked on save (XXXXXX3490)"
              />
              <Input
                label="IFSC Code"
                name="ifsc_code"
                placeholder="e.g. HDFC0001824"
                value={formData.ifsc_code}
                onChange={handleChange}
                maxLength={11}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Password *"
              name="password"
              type="password"
              placeholder="Minimum 6 characters"
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

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={loading}
            style={{ marginTop: '16px', padding: '10px 16px' }}
          >
            Submit Buyer Registration
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.875rem', color: 'var(--slate-600)' }}>
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-700)',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Sign In here
          </button>
        </div>
      </Card>
    </div>
  );
};

export default BuyerRegister;
