import React, { useState } from 'react';
import { Card, Input, Select, Button, Badge } from '../../components/common';
import { Warehouse as WarehouseIcon, ShieldAlert, ArrowLeft, Building2 } from 'lucide-react';
import api from '../../services/api';

const MAHARASHTRA_DISTRICTS = [
  'Nashik', 'Pune', 'Ahmednagar', 'Jalgaon', 'Kolhapur', 'Solapur',
  'Satara', 'Sangli', 'Aurangabad', 'Nagpur', 'Amravati', 'Nanded'
];

export const WarehouseRegister = ({ onBackToLanding, onRegisterSuccess, onSwitchToLogin, onNavigateToLogin }) => {
  const [formData, setFormData] = useState({
    warehouse_name: '',
    operator_name: '',
    aadhaar: '',
    license_number: '',
    storage_type: 'Cold Storage (Multi-Chamber)',
    capacity_mt: '2500',
    supported_crops: 'Tomato, Onion, Grapes, Pomegranate',
    tariff_per_quintal_month: '55',
    phone: '',
    email: '',
    address: '',
    district: 'Nashik',
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

  const handleBack = onBackToLanding || onNavigateToLogin;
  const handleLoginClick = onSwitchToLogin || onNavigateToLogin;

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

    if (!formData.warehouse_name || !formData.operator_name || !formData.phone || !formData.password || !formData.district) {
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
      const res = await api.post('/api/auth/register/warehouse', formData);
      if (res.success) {
        if (onRegisterSuccess) {
          onRegisterSuccess(res.user, res.message);
        } else if (handleLoginClick) {
          handleLoginClick();
        }
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
        onClick={handleBack}
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
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <WarehouseIcon size={26} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-900)' }}>
            Warehouse & Cold Storage Registration
          </h2>
          <p style={{ color: 'var(--slate-600)', fontSize: '0.9rem', marginTop: '4px' }}>
            List your agricultural storage facility for Maharashtra Farmers, FPOs, and Commercial Buyers
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
            <strong>WDRA & MSWC Compliance:</strong> All facilities undergo accreditation review by the District Agriculture Officer. Once your Aadhaar UID, WDRA license, and bank settlement account are validated, your facility will be unlocked for direct public bookings.
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
              label="Facility / Warehouse Name *"
              name="warehouse_name"
              placeholder="e.g. Nashik Agro Cold Storage"
              value={formData.warehouse_name}
              onChange={handleChange}
              required
            />
            <Input
              label="Operator / Manager Name *"
              name="operator_name"
              placeholder="e.g. Rajesh Deshpande"
              value={formData.operator_name}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Aadhaar Card Number (Operator)"
              name="aadhaar"
              placeholder="XXXX XXXX XXXX (12 digits)"
              value={formData.aadhaar}
              onChange={handleChange}
              maxLength={14}
              helperText="12-digit Aadhaar UID for facility KYC verification"
            />
            <Input
              label="WDRA / MSWC License Number"
              name="license_number"
              placeholder="e.g. WDRA-MH-NSK-2023-441"
              value={formData.license_number}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Select
              label="Storage Category *"
              name="storage_type"
              value={formData.storage_type}
              onChange={handleChange}
              options={[
                { value: 'Cold Storage (Multi-Chamber)', label: 'Cold Storage (Multi-Chamber)' },
                { value: 'Controlled Atmosphere (CA) Store', label: 'Controlled Atmosphere (CA) Store' },
                { value: 'Dry Grain Warehouse', label: 'Dry Grain Warehouse' },
                { value: 'Silo Storage System', label: 'Silo Storage System' },
              ]}
              required
            />
            <Input
              label="Total Capacity (Metric Tonnes) *"
              name="capacity_mt"
              type="number"
              placeholder="e.g. 2500"
              value={formData.capacity_mt}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Tariff (Rs / Quintal / Month) *"
              name="tariff_per_quintal_month"
              type="number"
              placeholder="e.g. 55"
              value={formData.tariff_per_quintal_month}
              onChange={handleChange}
              required
            />
            <Input
              label="Supported Crops"
              name="supported_crops"
              placeholder="e.g. Tomato, Onion, Grapes, Apples"
              value={formData.supported_crops}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Select
              label="District *"
              name="district"
              value={formData.district}
              onChange={handleChange}
              options={MAHARASHTRA_DISTRICTS.map((d) => ({ value: d, label: d }))}
              required
            />
            <Input
              label="Facility Postal Address"
              name="address"
              placeholder="Plot No., MIDC / Gat No., Taluka"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Mobile Number (Login ID) *"
              name="phone"
              type="tel"
              placeholder="10-digit mobile number"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            <Input
              label="Facility Email"
              name="email"
              type="email"
              placeholder="storage@nashikagro.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Storage Tariff Settlement Bank Account Details */}
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
                Storage Tariff Settlement Bank Account
              </h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--slate-600)', marginBottom: '14px', lineHeight: 1.4 }}>
              Required for automated disbursement of storage fees from farmers, FPOs, and escrow settlements.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <Input
                label="Bank Name"
                name="bank_name"
                placeholder="e.g. Bank of Maharashtra, SBI"
                value={formData.bank_name}
                onChange={handleChange}
              />
              <Input
                label="Account Holder / Entity Name"
                name="account_holder_name"
                placeholder="e.g. Nashik Agro Storage Corp"
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
                helperText="Masked on save (XXXXXX7741)"
              />
              <Input
                label="IFSC Code"
                name="ifsc_code"
                placeholder="e.g. MAHB0000412"
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
            Submit Cold Storage Facility
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.875rem', color: 'var(--slate-600)' }}>
          Already registered?{' '}
          <button
            type="button"
            onClick={handleLoginClick}
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

export default WarehouseRegister;
