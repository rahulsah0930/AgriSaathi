import React from 'react';
import { Card, Badge, StatusBadge, Button } from '../../components/common';
import { User, MapPin, Phone, Mail, ShieldCheck, Clock, Sprout, Building2, ShoppingCart, Warehouse, CreditCard } from 'lucide-react';

export const ProfilePage = ({ user, onBackToDashboard }) => {
  const role = user?.role || 'FARMER';
  const isFPO = role === 'FPO';
  const isBuyer = role === 'BUYER';
  const isWarehouse = role === 'WAREHOUSE';
  const profile = user?.profile || {};

  const getPageTitle = () => {
    if (isFPO) return 'FPO Organization Profile';
    if (isBuyer) return 'Wholesale Buyer Profile';
    if (isWarehouse) return 'Warehouse & Cold Storage Profile';
    return 'Farmer Seller Profile';
  };

  const getDisplayName = () => {
    if (isFPO) return profile.fpo_name || user?.name || 'Sahyadri FPO';
    if (isBuyer) return profile.company_name || user?.name || 'MahaFresh Foods Pvt Ltd';
    if (isWarehouse) return profile.warehouse_name || user?.name || 'Nashik Agro Storage Corp';
    return profile.full_name || user?.name || 'Suresh Patil';
  };

  const getIcon = () => {
    if (isFPO) return <Building2 size={36} />;
    if (isBuyer) return <ShoppingCart size={36} />;
    if (isWarehouse) return <Warehouse size={36} />;
    return <User size={36} />;
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--slate-900)' }}>
            {getPageTitle()}
          </h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem' }}>
            Government registration, verification UID, and transaction banking records
          </p>
        </div>
        {onBackToDashboard && (
          <Button variant="secondary" onClick={onBackToDashboard}>
            Back to Dashboard
          </Button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* Left card */}
        <Card style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            {getIcon()}
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--slate-900)' }}>
            {getDisplayName()}
          </h3>

          <div style={{ margin: '8px 0 16px' }}>
            <Badge variant={user?.verification_status === 'VERIFIED' ? 'success' : 'warning'}>
              {user?.verification_status === 'VERIFIED' ? 'Govt Verified' : 'Pending Verification'}
            </Badge>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Phone size={14} />
              <span>{user?.phone || '9823012345'}</span>
            </div>
            {user?.email && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Mail size={14} />
                <span>{user.email}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <MapPin size={14} />
              <span>{profile.district || user?.district || 'Nashik'}, Maharashtra</span>
            </div>
          </div>
        </Card>

        {/* Right card details */}
        <Card title="Registration & Verification Details">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderBottom: '1px solid var(--slate-100)', paddingBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.785rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Role Type</span>
                <p style={{ fontWeight: 600, color: 'var(--slate-900)', margin: '4px 0 0 0' }}>{user?.role}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.785rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Verification Status</span>
                <div style={{ marginTop: '4px' }}><StatusBadge status={user?.verification_status || 'VERIFIED'} /></div>
              </div>
            </div>

            {/* Role Specific Registration Fields */}
            {isBuyer ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.785rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Company Name</span>
                    <p style={{ fontWeight: 600, color: 'var(--slate-900)', margin: '4px 0 0 0' }}>{profile.company_name || user?.name || 'MahaFresh Foods Pvt Ltd'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.785rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Authorized Representative</span>
                    <p style={{ fontWeight: 600, color: 'var(--primary-700)', margin: '4px 0 0 0' }}>{profile.authorized_person || 'Sunil Agarwal'}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.785rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Business Reg (CIN / Shop Act)</span>
                    <p style={{ fontWeight: 600, color: 'var(--slate-900)', margin: '4px 0 0 0' }}>{profile.business_registration || 'CIN: U01409MH2021PTC355201'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.785rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>GST Identification Number</span>
                    <p style={{ fontWeight: 600, color: 'var(--slate-900)', margin: '4px 0 0 0' }}>{profile.gst_number || '27AAACM1234F1Z5'}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.785rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Procurement District</span>
                    <p style={{ fontWeight: 600, color: 'var(--slate-900)', margin: '4px 0 0 0' }}>{profile.district || 'Pune'}, Maharashtra</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.785rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Aadhaar UID (Masked)</span>
                    <p style={{ fontWeight: 600, color: 'var(--primary-700)', fontFamily: 'monospace', margin: '4px 0 0 0' }}>
                      {profile.aadhaar_masked || 'XXXX XXXX 8912'}
                    </p>
                  </div>
                </div>
              </>
            ) : isWarehouse ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.785rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Facility Name</span>
                    <p style={{ fontWeight: 600, color: 'var(--slate-900)', margin: '4px 0 0 0' }}>{profile.warehouse_name || user?.name || 'Nashik Agro Storage Corp'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.785rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Operator / Manager</span>
                    <p style={{ fontWeight: 600, color: 'var(--primary-700)', margin: '4px 0 0 0' }}>{profile.operator_name || 'Rajesh Deshpande'}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.785rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>WDRA / MSWC License</span>
                    <p style={{ fontWeight: 600, color: 'var(--slate-900)', margin: '4px 0 0 0' }}>{profile.license_number || 'WDRA-MH-NSK-2023-441'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.785rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Storage Category</span>
                    <p style={{ fontWeight: 600, color: 'var(--slate-900)', margin: '4px 0 0 0' }}>{profile.storage_type || 'Cold Storage (Multi-Chamber)'}</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.785rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Capacity</span>
                    <p style={{ fontWeight: 600, color: 'var(--slate-900)', margin: '4px 0 0 0' }}>{profile.capacity_mt || 2500} Metric Tonnes</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.785rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Aadhaar UID (Masked)</span>
                    <p style={{ fontWeight: 600, color: 'var(--primary-700)', fontFamily: 'monospace', margin: '4px 0 0 0' }}>
                      {profile.aadhaar_masked || 'XXXX XXXX 3321'}
                    </p>
                  </div>
                </div>
              </>
            ) : isFPO ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.785rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Registration Number</span>
                    <p style={{ fontWeight: 600, color: 'var(--slate-900)', margin: '4px 0 0 0' }}>{profile.registration_number || 'FPO-MH-NSK-2023-089'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.785rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Affiliated Farmers</span>
                    <p style={{ fontWeight: 600, color: 'var(--primary-700)', margin: '4px 0 0 0' }}>{profile.member_count || 450} Member Growers</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.785rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Contact Person</span>
                    <p style={{ fontWeight: 600, color: 'var(--slate-900)', margin: '4px 0 0 0' }}>{profile.contact_person || 'Anand Rao Deshmukh'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.785rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Primary Produce</span>
                    <p style={{ fontWeight: 600, color: 'var(--slate-900)', margin: '4px 0 0 0' }}>{profile.primary_crops || 'Tomato, Grapes, Onion'}</p>
                  </div>
                </div>
              </>
            ) : (
              /* Farmer Seller Profile */
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.785rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Village & Taluka</span>
                    <p style={{ fontWeight: 600, color: 'var(--slate-900)', margin: '4px 0 0 0' }}>{profile.village || 'Dindori'}, {profile.taluka || 'Dindori'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.785rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Farm Holding Size</span>
                    <p style={{ fontWeight: 600, color: 'var(--primary-700)', margin: '4px 0 0 0' }}>{profile.farm_size_acres || 4.5} Acres</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.785rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Main Harvest Crops</span>
                    <p style={{ fontWeight: 600, color: 'var(--slate-900)', margin: '4px 0 0 0' }}>{profile.main_crops || 'Tomato, Onion, Grapes'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.785rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>Aadhaar UID (Masked)</span>
                    <p style={{ fontWeight: 600, color: 'var(--primary-700)', fontFamily: 'monospace', margin: '4px 0 0 0' }}>
                      {profile.aadhaar_masked || 'XXXX XXXX 4589'}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Bank Details Section - Visible Across All Roles for Transactions */}
            <div
              style={{
                borderTop: '1px solid var(--slate-100)',
                paddingTop: '16px',
                marginTop: '4px',
                backgroundColor: '#f8fafc',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CreditCard size={16} color="var(--primary-700)" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--slate-700)', textTransform: 'uppercase', fontWeight: 700 }}>
                    {isBuyer
                      ? 'Trade Escrow & Settlement Bank Account'
                      : isWarehouse
                      ? 'Storage Tariff Payout Bank Account'
                      : 'Sale Settlement Bank Account'}
                  </span>
                </div>
                <Badge variant="success" size="sm">
                  Verified for Transactions
                </Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Bank Name</span>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-900)', margin: '2px 0 0 0' }}>
                    {profile.bank_name || (isBuyer ? 'HDFC Bank' : isWarehouse ? 'Bank of Maharashtra' : 'State Bank of India')}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Account Holder Name</span>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-900)', margin: '2px 0 0 0' }}>
                    {profile.account_holder_name || getDisplayName()}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Account Number (Masked)</span>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-900)', fontFamily: 'monospace', margin: '2px 0 0 0' }}>
                    {profile.bank_account_masked || (isBuyer ? 'XXXXXX3490' : isWarehouse ? 'XXXXXX7741' : 'XXXXXX8812')}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>IFSC Code</span>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-900)', fontFamily: 'monospace', margin: '2px 0 0 0' }}>
                    {profile.ifsc_code_masked || (isBuyer ? 'HDFC0001824' : isWarehouse ? 'MAHB0000412' : 'SBIN0001234')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
