import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, StatusBadge, Input, Select, Modal } from '../../components/common';
import {
  ShieldCheck,
  UserCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  PauseCircle,
  Building2,
  ShoppingCart,
  Warehouse as WarehouseIcon,
  Sprout,
  Search,
  Filter,
  Eye,
  DollarSign,
  FileText,
  HelpCircle,
  Check,
  X
} from 'lucide-react';
import api from '../../services/api';

export const AdminDashboard = ({ user, onNavigate, onLogout }) => {
  const [activeTab, setActiveTab] = useState('verifications'); // 'verifications' | 'escrow' | 'grievances' | 'overview'
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [escrowRecords, setEscrowRecords] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('PENDING'); // 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED'
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'FARMER' | 'FPO' | 'BUYER' | 'WAREHOUSE'
  const [searchQuery, setSearchQuery] = useState('');

  // User detail view modal
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);

  // Rejection modal
  const [rejectModalUser, setRejectModalUser] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');

  // Grievance resolution modal
  const [resolveGrievanceModal, setResolveGrievanceModal] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const [banner, setBanner] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, escrowRes, grvRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get(`/api/admin/users?status=${statusFilter}&role=${roleFilter}`),
        api.get('/api/admin/escrow'),
        api.get('/api/admin/grievances')
      ]);

      if (statsRes && statsRes.stats) setStats(statsRes.stats);
      if (usersRes && usersRes.users) setUsersList(usersRes.users);
      if (escrowRes && escrowRes.records) setEscrowRecords(escrowRes.records);
      if (grvRes && grvRes.grievances) setGrievances(grvRes.grievances);
    } catch (err) {
      console.error('[AdminDashboard Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, roleFilter]);

  const handleAction = async (userId, action, reason = '', notes = '') => {
    try {
      const res = await api.post(`/api/admin/users/${userId}/status`, {
        action,
        reason,
        notes,
      });

      if (res.success) {
        setBanner({ type: 'success', message: res.message });
        setRejectModalUser(null);
        setSelectedUserDetail(null);
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  const handleResolveGrievance = async (e) => {
    e.preventDefault();
    if (!resolveGrievanceModal || !resolutionNotes) return;

    try {
      const res = await api.post(`/api/admin/grievances/${resolveGrievanceModal.id}/resolve`, {
        status: 'RESOLVED',
        resolution_notes: resolutionNotes,
        admin_id: user?.id || 10,
      });

      if (res.success) {
        setBanner({ type: 'success', message: res.message });
        setResolveGrievanceModal(null);
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Resolution failed');
    }
  };

  // Filter users by search
  const filteredUsers = usersList.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          color: '#ffffff',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <ShieldCheck size={26} color="#38bdf8" />
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
                Government Administration & Regulatory Portal
              </h1>
              <Badge variant="info" size="sm">Govt Nodal Authority</Badge>
            </div>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
              Maharashtra State Agriculture Department • User Verification Registry, Escrow Audits & Dispute Redressal
            </p>
          </div>

          {stats && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '8px 14px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#f59e0b' }}>Pending Verification</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fbbf24' }}>{stats.pending_verifications}</div>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '8px 14px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#38bdf8' }}>Govt Escrow Balance</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#38bdf8' }}>₹{stats.escrow_held_amount?.toLocaleString()}</div>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '8px 14px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#ef4444' }}>Open Disputes</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f87171' }}>{stats.open_grievances}</div>
              </div>
            </div>
          )}

          {onLogout && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={onLogout}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  padding: '8px 14px',
                }}
              >
                Exit / Logout
              </Button>
            </div>
          )}
        </div>
      </div>

      {banner && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{banner.message}</span>
          <button onClick={() => setBanner(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>×</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border-color)', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('verifications')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'verifications' ? '3px solid var(--primary-700)' : '3px solid transparent',
            color: activeTab === 'verifications' ? 'var(--primary-800)' : 'var(--slate-600)',
            fontWeight: activeTab === 'verifications' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <UserCheck size={18} />
          <span>User Verification Registry ({stats?.pending_verifications || 0} Pending)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('escrow')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'escrow' ? '3px solid var(--primary-700)' : '3px solid transparent',
            color: activeTab === 'escrow' ? 'var(--primary-800)' : 'var(--slate-600)',
            fontWeight: activeTab === 'escrow' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <DollarSign size={18} />
          <span>Government Escrow Vault (₹{stats?.escrow_held_amount?.toLocaleString() || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('grievances')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'grievances' ? '3px solid var(--primary-700)' : '3px solid transparent',
            color: activeTab === 'grievances' ? 'var(--primary-800)' : 'var(--slate-600)',
            fontWeight: activeTab === 'grievances' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={18} />
          <span>Grievance Redressal Board ({stats?.open_grievances || 0})</span>
        </button>
      </div>

      {/* TAB 1: USER VERIFICATION WORKBENCH */}
      {activeTab === 'verifications' && (
        <div>
          {/* Status Filter Tabs (Section 1) */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {['ALL', 'PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: statusFilter === st ? 'var(--primary-700)' : '#ffffff',
                  color: statusFilter === st ? '#ffffff' : 'var(--slate-700)',
                  fontWeight: statusFilter === st ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                {st.charAt(0) + st.slice(1).toLowerCase()} Registrations
              </button>
            ))}
          </div>

          {/* Role Filter & Search Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '12px',
              backgroundColor: '#ffffff',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              marginBottom: '16px',
            }}
          >
            <div style={{ position: 'relative' }}>
              <Input
                placeholder="Search registered names, mobile numbers, or emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px' }}
              />
              <Search size={16} color="var(--slate-400)" style={{ position: 'absolute', left: '10px', top: '12px' }} />
            </div>

            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Roles (Farmer, FPO, Buyer, Warehouse)' },
                { value: 'FARMER', label: 'Farmers Only' },
                { value: 'FPO', label: 'FPOs Only' },
                { value: 'BUYER', label: 'Wholesale Buyers' },
                { value: 'WAREHOUSE', label: 'Cold Storages' },
              ]}
            />
          </div>

          {/* Registrations List Table */}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--slate-50)', borderBottom: '1px solid var(--border-color)', color: 'var(--slate-700)' }}>
                  <th style={{ padding: '12px 16px' }}>Applicant Name / Entity</th>
                  <th style={{ padding: '12px 16px' }}>Role</th>
                  <th style={{ padding: '12px 16px' }}>District / Location</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Registration Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Government Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--slate-500)' }}>
                      No registration records matching selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const prof = u.profile || {};
                    const isPending = u.verification_status === 'PENDING';

                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{u.name || u.phone}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>
                            📞 {u.phone} {u.email ? `• ${u.email}` : ''}
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <Badge variant={u.role === 'FPO' ? 'info' : (u.role === 'BUYER' ? 'warning' : 'neutral')}>
                            {u.role}
                          </Badge>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <div>{prof.district || 'Maharashtra'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                            {prof.village || prof.address || 'State Yard'}
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <Badge
                            variant={
                              u.verification_status === 'VERIFIED'
                                ? 'success'
                                : (u.verification_status === 'PENDING'
                                  ? 'warning'
                                  : (u.verification_status === 'REJECTED' ? 'danger' : 'neutral'))
                            }
                          >
                            {u.verification_status}
                          </Badge>
                          {u.rejection_reason && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--error-700)', marginTop: '2px' }}>
                              Reason: {u.rejection_reason}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '12px 16px', color: 'var(--slate-600)', fontSize: '0.8rem' }}>
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '2026-09-08'}
                        </td>

                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setSelectedUserDetail(u)}
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              <Eye size={12} style={{ marginRight: '4px' }} />
                              View
                            </Button>

                            {isPending && (
                              <>
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleAction(u.id, 'VERIFY')}
                                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                >
                                  <Check size={12} style={{ marginRight: '2px' }} />
                                  Verify
                                </Button>

                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => setRejectModalUser(u)}
                                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                >
                                  <X size={12} style={{ marginRight: '2px' }} />
                                  Reject
                                </Button>
                              </>
                            )}

                            {u.verification_status === 'VERIFIED' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleAction(u.id, 'SUSPEND')}
                                style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--warning-800)' }}
                              >
                                Suspend
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* TAB 2: GOVERNMENT ESCROW VAULT */}
      {activeTab === 'escrow' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>State Agriculture Escrow Ledger</h2>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.85rem', margin: '4px 0 0' }}>
              Statutory government escrow oversight holding buyer advance funds until delivery confirmation.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {escrowRecords.map((rec) => (
              <Card key={rec.id} style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                        {rec.payment_ref}
                      </h4>
                      <Badge variant={rec.escrow_status === 'HELD_BY_GOVT_ESCROW' ? 'warning' : 'success'}>
                        {rec.escrow_status}
                      </Badge>
                      <Badge variant="neutral">{rec.stage} PAYMENT</Badge>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', marginTop: '4px' }}>
                      Payer: <strong>{rec.payer_name}</strong> • Payee: <strong>{rec.payee_name}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                      ₹{rec.amount?.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                      Ref: {rec.reference_number || 'SIM/ESCROW/2026'}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--slate-50)',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    color: 'var(--slate-700)',
                  }}
                >
                  🔒 <strong>Audit Record:</strong> {rec.govt_audit_notes || 'Secured in State Escrow Vault.'}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GRIEVANCE REDRESSAL BOARD */}
      {activeTab === 'grievances' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Grievance Redressal & Official Adjudication</h2>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.85rem', margin: '4px 0 0' }}>
              Complaints filed by buyers or sellers regarding quality disparity, transit delays, or payment discrepancies.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {grievances.map((g) => (
              <Card key={g.id} style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                        {g.title}
                      </h4>
                      <Badge variant={g.status === 'RESOLVED' ? 'success' : 'danger'}>
                        {g.status}
                      </Badge>
                      <Badge variant="warning">{g.category}</Badge>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', marginTop: '4px' }}>
                      Case Ref: <strong>{g.grievance_ref}</strong> • Complainant: <strong>{g.complainant_name} ({g.complainant_role})</strong>
                    </div>
                  </div>

                  {g.status === 'OPEN' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setResolveGrievanceModal(g);
                        setResolutionNotes('Claim investigated by Taluka Inspector. Resolution agreed by both parties.');
                      }}
                    >
                      Adjudicate & Resolve
                    </Button>
                  )}
                </div>

                <p style={{ margin: '10px 0', fontSize: '0.875rem', color: 'var(--slate-700)' }}>
                  {g.description}
                </p>

                {g.resolution_notes && (
                  <div
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      color: '#166534',
                    }}
                  >
                    ✓ <strong>Official Resolution:</strong> {g.resolution_notes}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* USER DETAIL VIEW MODAL (Section 1) */}
      {selectedUserDetail && (
        <Modal
          isOpen={!!selectedUserDetail}
          onClose={() => setSelectedUserDetail(null)}
          title={`Government Registration Dossier: ${selectedUserDetail.name || selectedUserDetail.phone}`}
        >
          {(() => {
            const u = selectedUserDetail;
            const prof = u.profile || {};

            return (
              <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Badge variant="neutral" size="lg">{u.role} REGISTRATION</Badge>
                  <Badge variant={u.verification_status === 'VERIFIED' ? 'success' : 'warning'}>
                    {u.verification_status}
                  </Badge>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: 'var(--slate-50)', padding: '12px', borderRadius: '6px' }}>
                  <div><strong>Mobile:</strong> {u.phone}</div>
                  <div><strong>Email:</strong> {u.email || 'N/A'}</div>
                  <div><strong>District:</strong> {prof.district || 'Nashik'}</div>
                  <div><strong>State:</strong> {prof.state || 'Maharashtra'}</div>
                </div>

                {/* Farmer specific details */}
                {u.role === 'FARMER' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--slate-800)' }}>Farmer Land & Identity Details:</div>
                    <div><strong>Masked Aadhaar:</strong> {prof.aadhaar_masked || 'XXXX XXXX 4589'}</div>
                    <div><strong>Village / Taluka:</strong> {prof.village || 'Dindori'}, {prof.taluka || 'Dindori'}</div>
                    <div><strong>Farm Size:</strong> {prof.farm_size_acres || 4.5} Acres</div>
                    <div><strong>Primary Crops:</strong> {prof.main_crops || 'Tomato, Onion, Grapes'}</div>
                    <div><strong>Bank Account:</strong> {prof.bank_account_masked || 'XXXXXX8812'} (IFSC: {prof.ifsc_code_masked || 'SBIN0001234'})</div>
                  </div>
                )}

                {/* FPO specific details */}
                {u.role === 'FPO' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--slate-800)' }}>FPO Corporate Details:</div>
                    <div><strong>Org Name:</strong> {prof.fpo_name}</div>
                    <div><strong>Registration No:</strong> {prof.registration_number || 'FPO-MH-NSK-2023-089'}</div>
                    <div><strong>Representative:</strong> {prof.contact_person || 'Anand Rao Deshmukh'}</div>
                    <div><strong>Member Farmer Count:</strong> {prof.member_count || 450} Farmers</div>
                    <div><strong>Crops Aggregated:</strong> {prof.primary_crops || 'Tomato, Onion'}</div>
                  </div>
                )}

                {/* Buyer specific details */}
                {u.role === 'BUYER' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--slate-800)' }}>Wholesale Buyer Business Details:</div>
                    <div><strong>Company Name:</strong> {prof.company_name}</div>
                    <div><strong>Authorized Signatory:</strong> {prof.authorized_person}</div>
                    <div><strong>GSTIN:</strong> {prof.gst_number || '27AAACM1234F1Z5'}</div>
                    <div><strong>CIN / Reg:</strong> {prof.business_registration || 'CIN: U01409MH2021PTC355201'}</div>
                    <div><strong>Delivery Depot:</strong> {prof.address}</div>
                  </div>
                )}

                {/* Warehouse specific details */}
                {u.role === 'WAREHOUSE' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--slate-800)' }}>Cold Storage Accreditation Details:</div>
                    <div><strong>Facility Name:</strong> {prof.warehouse_name}</div>
                    <div><strong>License:</strong> {prof.license_number || 'WDRA-MH-NSK-2023-441'}</div>
                    <div><strong>Storage Capacity:</strong> {prof.capacity_mt || 2500} MT</div>
                    <div><strong>Tariff:</strong> ₹{prof.tariff_per_quintal_month || 55}/Quintal/Month</div>
                    <div><strong>Current Ambient Temp:</strong> {prof.temperature_celsius || 2.8}°C</div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                  <Button variant="secondary" onClick={() => setSelectedUserDetail(null)}>Close</Button>
                  {u.verification_status === 'PENDING' && (
                    <>
                      <Button variant="danger" onClick={() => { setRejectModalUser(u); setSelectedUserDetail(null); }}>
                        Reject
                      </Button>
                      <Button variant="success" onClick={() => handleAction(u.id, 'VERIFY')}>
                        Verify Now
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* REJECTION REASON MODAL (Section 1) */}
      {rejectModalUser && (
        <Modal
          isOpen={!!rejectModalUser}
          onClose={() => setRejectModalUser(null)}
          title={`Reject Registration: ${rejectModalUser.name || rejectModalUser.phone}`}
        >
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginBottom: '12px' }}>
              Government regulations require a formal rejection reason to be recorded and communicated to the applicant.
            </p>

            <Input
              label="Mandatory Rejection Reason *"
              placeholder="e.g. 7/12 Land record mismatched with Aadhaar name / Incomplete GST document"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
            />

            <Input
              label="Inspector Internal Audit Notes"
              placeholder="Optional notes for department audit log"
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button variant="secondary" onClick={() => setRejectModalUser(null)}>Cancel</Button>
              <Button
                variant="danger"
                onClick={() => handleAction(rejectModalUser.id, 'REJECT', rejectReason, rejectNotes)}
                disabled={!rejectReason}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* GRIEVANCE RESOLUTION MODAL */}
      {resolveGrievanceModal && (
        <Modal
          isOpen={!!resolveGrievanceModal}
          onClose={() => setResolveGrievanceModal(null)}
          title={`Resolve Dispute: ${resolveGrievanceModal.grievance_ref}`}
        >
          <form onSubmit={handleResolveGrievance}>
            <div style={{ marginBottom: '12px', fontSize: '0.875rem' }}>
              <div><strong>Claim Title:</strong> {resolveGrievanceModal.title}</div>
              <div><strong>Complainant:</strong> {resolveGrievanceModal.complainant_name}</div>
              <div style={{ color: 'var(--slate-600)', marginTop: '4px' }}>{resolveGrievanceModal.description}</div>
            </div>

            <Input
              label="Official Adjudication & Resolution Order *"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              required
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button variant="secondary" onClick={() => setResolveGrievanceModal(null)}>Cancel</Button>
              <Button type="submit" variant="primary">Submit Official Order</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;
