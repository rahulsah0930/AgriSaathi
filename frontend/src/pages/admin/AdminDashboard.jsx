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
  X,
  Truck,
  Layers,
  History,
  CheckCircle2
} from 'lucide-react';
import api from '../../services/api';

export const AdminDashboard = ({ user, onNavigate, onLogout }) => {
  const [activeTab, setActiveTab] = useState('verifications'); // 'verifications' | 'warehouses' | 'logistics' | 'escrow' | 'grievances' | 'storage' | 'audit_logs'
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [warehousesList, setWarehousesList] = useState([]);
  const [logisticsList, setLogisticsList] = useState([]);
  const [escrowRecords, setEscrowRecords] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [storageBookings, setStorageBookings] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('PENDING'); // 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED'
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'FARMER' | 'FPO' | 'BUYER' | 'WAREHOUSE' | 'LOGISTICS'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [rejectModalUser, setRejectModalUser] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');

  // Warehouse status modal
  const [whStatusModal, setWhStatusModal] = useState(null);
  const [whAction, setWhAction] = useState('VERIFY');
  const [whReason, setWhReason] = useState('');

  // Logistics status modal
  const [logStatusModal, setLogStatusModal] = useState(null);
  const [logAction, setLogAction] = useState('VERIFY');
  const [logReason, setLogReason] = useState('');

  // Grievance adjudication modal
  const [resolveGrievanceModal, setResolveGrievanceModal] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Transaction 360-Audit modal
  const [txnAuditDossier, setTxnAuditDossier] = useState(null);
  const [loadingAuditDossier, setLoadingAuditDossier] = useState(false);

  const [banner, setBanner] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, whRes, logRes, escrowRes, grvRes, sbRes, logsRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get(`/api/admin/users?status=${statusFilter}&role=${roleFilter}`),
        api.get('/api/admin/warehouses'),
        api.get('/api/admin/logistics'),
        api.get('/api/admin/escrow'),
        api.get('/api/admin/grievances'),
        api.get('/api/admin/storage/bookings'),
        api.get('/api/admin/audit-logs')
      ]);

      if (statsRes && statsRes.stats) setStats(statsRes.stats);
      if (usersRes && usersRes.users) setUsersList(usersRes.users);
      if (whRes && whRes.warehouses) setWarehousesList(whRes.warehouses);
      if (logRes && logRes.logistics_providers) setLogisticsList(logRes.logistics_providers);
      if (escrowRes && escrowRes.records) setEscrowRecords(escrowRes.records);
      if (grvRes && grvRes.grievances) setGrievances(grvRes.grievances);
      if (sbRes && sbRes.bookings) setStorageBookings(sbRes.bookings);
      if (logsRes && logsRes.audit_logs) setAuditLogs(logsRes.audit_logs);
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

  const handleWarehouseAction = async () => {
    if (!whStatusModal) return;
    try {
      const res = await api.post(`/api/admin/warehouses/${whStatusModal.id}/status`, {
        action: whAction,
        reason: whReason
      });
      if (res.success) {
        setBanner({ type: 'success', message: res.message });
        setWhStatusModal(null);
        setWhReason('');
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Warehouse action failed');
    }
  };

  const handleLogisticsAction = async () => {
    if (!logStatusModal) return;
    try {
      const res = await api.post(`/api/admin/logistics/${logStatusModal.id}/status`, {
        action: logAction,
        reason: logReason
      });
      if (res.success) {
        setBanner({ type: 'success', message: res.message });
        setLogStatusModal(null);
        setLogReason('');
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Logistics action failed');
    }
  };

  const handleGrievanceStatus = async (grievanceId, action, notes = '') => {
    try {
      const res = await api.post(`/api/admin/grievances/${grievanceId}/status`, {
        action,
        resolution_notes: notes || 'Administrative review proceeding.'
      });
      if (res.success) {
        setBanner({ type: 'success', message: res.message });
        setResolveGrievanceModal(null);
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Grievance update failed');
    }
  };

  const openTxnAudit = async (txnId) => {
    try {
      setLoadingAuditDossier(true);
      const res = await api.get(`/api/admin/transactions/${txnId}/audit`);
      if (res.success) {
        setTxnAuditDossier(res.audit_dossier);
      }
    } catch (err) {
      alert(err.message || 'Failed to retrieve transaction audit dossier');
    } finally {
      setLoadingAuditDossier(false);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (u.name || '').toLowerCase().includes(q);
    const phoneMatch = (u.phone || '').includes(q);
    const districtMatch = (u.profile?.district || '').toLowerCase().includes(q);
    return nameMatch || phoneMatch || districtMatch;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
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
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Government Administration & Regulatory Oversight Portal
              </h1>
              <Badge variant="info" size="sm">Prototype Regulatory Authority</Badge>
            </div>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
              Maharashtra State Agriculture Department • User Verification, Transporters, Cold Storage & Prototype Escrow Audits
            </p>
          </div>

          {stats && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '8px 14px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#f59e0b' }}>Pending Verifications</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fbbf24' }}>{stats.pending_verifications}</div>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '8px 14px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#38bdf8' }}>Prototype Escrow Vault</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#38bdf8' }}>₹{stats.escrow_held_amount?.toLocaleString()}</div>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: '8px 14px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#10b981' }}>Active Dispatches</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#34d399' }}>{stats.active_logistics_deliveries}</div>
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
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
              >
                Sign Out
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
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border-color)', marginBottom: '20px', overflowX: 'auto' }}>
        <button
          type="button"
          onClick={() => setActiveTab('verifications')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'verifications' ? '3px solid var(--primary-700)' : '3px solid transparent',
            color: activeTab === 'verifications' ? 'var(--primary-800)' : 'var(--slate-600)',
            fontWeight: activeTab === 'verifications' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <UserCheck size={16} />
          <span>Users ({stats?.pending_verifications || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('warehouses')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'warehouses' ? '3px solid var(--primary-700)' : '3px solid transparent',
            color: activeTab === 'warehouses' ? 'var(--primary-800)' : 'var(--slate-600)',
            fontWeight: activeTab === 'warehouses' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <WarehouseIcon size={16} />
          <span>Cold Storage Facilities ({warehousesList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logistics')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'logistics' ? '3px solid var(--primary-700)' : '3px solid transparent',
            color: activeTab === 'logistics' ? 'var(--primary-800)' : 'var(--slate-600)',
            fontWeight: activeTab === 'logistics' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <Truck size={16} />
          <span>Logistics Providers ({logisticsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('escrow')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'escrow' ? '3px solid var(--primary-700)' : '3px solid transparent',
            color: activeTab === 'escrow' ? 'var(--primary-800)' : 'var(--slate-600)',
            fontWeight: activeTab === 'escrow' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <DollarSign size={16} />
          <span>Prototype Escrow Vault</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('grievances')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'grievances' ? '3px solid var(--primary-700)' : '3px solid transparent',
            color: activeTab === 'grievances' ? 'var(--primary-800)' : 'var(--slate-600)',
            fontWeight: activeTab === 'grievances' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <AlertTriangle size={16} />
          <span>Disputes & Grievances ({stats?.open_grievances || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('storage')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'storage' ? '3px solid var(--primary-700)' : '3px solid transparent',
            color: activeTab === 'storage' ? 'var(--primary-800)' : 'var(--slate-600)',
            fontWeight: activeTab === 'storage' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <Layers size={16} />
          <span>Storage Bookings Audit ({storageBookings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit_logs')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'audit_logs' ? '3px solid var(--primary-700)' : '3px solid transparent',
            color: activeTab === 'audit_logs' ? 'var(--primary-800)' : 'var(--slate-600)',
            fontWeight: activeTab === 'audit_logs' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}
        >
          <History size={16} />
          <span>Audit Log Trail</span>
        </button>
      </div>

      {/* TAB 1: USER VERIFICATION WORKBENCH */}
      {activeTab === 'verifications' && (
        <div>
          {/* Status Filter Tabs */}
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

          {/* Role Filter & Search */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <Filter size={16} color="var(--slate-500)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)' }}>Role:</span>
              {['ALL', 'FARMER', 'FPO', 'BUYER', 'WAREHOUSE', 'LOGISTICS'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: roleFilter === r ? 'var(--slate-800)' : '#ffffff',
                    color: roleFilter === r ? '#ffffff' : 'var(--slate-600)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, minWidth: '240px' }}>
              <Input
                placeholder="Search by name, phone, or district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* User Table */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--slate-50)', borderBottom: '2px solid var(--border-color)', color: 'var(--slate-600)' }}>
                  <th style={{ padding: '12px 16px' }}>Applicant / Entity</th>
                  <th style={{ padding: '12px 16px' }}>Role</th>
                  <th style={{ padding: '12px 16px' }}>Location</th>
                  <th style={{ padding: '12px 16px' }}>Registration Date</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const prof = u.profile || {};
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{u.name || u.phone}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>{u.phone}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge variant="neutral">{u.role}</Badge>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {prof.district || prof.taluka ? `${prof.district || ''} (${prof.taluka || prof.state || 'MH'})` : 'Maharashtra'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--slate-600)' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge
                          variant={
                            u.verification_status === 'VERIFIED'
                              ? 'success'
                              : u.verification_status === 'PENDING'
                              ? 'warning'
                              : u.verification_status === 'SUSPENDED'
                              ? 'neutral'
                              : 'danger'
                          }
                        >
                          {u.verification_status}
                        </Badge>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <Button variant="secondary" size="sm" onClick={() => setSelectedUserDetail(u)}>
                            Inspect
                          </Button>
                          {u.verification_status !== 'VERIFIED' && (
                            <Button variant="success" size="sm" onClick={() => handleAction(u.id, 'VERIFY')}>
                              Verify
                            </Button>
                          )}
                          {u.verification_status !== 'REJECTED' && (
                            <Button variant="danger" size="sm" onClick={() => setRejectModalUser(u)}>
                              Reject
                            </Button>
                          )}
                          {u.verification_status !== 'SUSPENDED' && (
                            <Button variant="neutral" size="sm" onClick={() => handleAction(u.id, 'SUSPEND', 'Administrative suspension')}>
                              Suspend
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: WAREHOUSES & COLD STORAGE */}
      {activeTab === 'warehouses' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Registered Cold Storage Facilities Review</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
              Total Registered: <strong>{warehousesList.length}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {warehousesList.map((wh) => (
              <Card key={wh.id} style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>{wh.name}</h4>
                      <Badge variant={wh.verification_status === 'VERIFIED' ? 'success' : wh.verification_status === 'PENDING' ? 'warning' : 'danger'}>
                        {wh.verification_status}
                      </Badge>
                      <Badge variant="neutral">{wh.storage_type}</Badge>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--slate-600)', marginTop: '4px' }}>
                      Location: <strong>{wh.location} ({wh.district})</strong> • Operator: <strong>{wh.operator_name || 'Registered Operator'}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {wh.verification_status !== 'VERIFIED' && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => {
                          setWhStatusModal(wh);
                          setWhAction('VERIFY');
                        }}
                      >
                        Verify Facility
                      </Button>
                    )}
                    {wh.verification_status !== 'REJECTED' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setWhStatusModal(wh);
                          setWhAction('REJECT');
                        }}
                      >
                        Reject
                      </Button>
                    )}
                    {wh.verification_status !== 'SUSPENDED' && (
                      <Button
                        variant="neutral"
                        size="sm"
                        onClick={() => {
                          setWhStatusModal(wh);
                          setWhAction('SUSPEND');
                        }}
                      >
                        Suspend
                      </Button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '12px', backgroundColor: 'var(--slate-50)', padding: '10px', borderRadius: '6px', fontSize: '0.82rem' }}>
                  <div><span style={{ color: 'var(--slate-500)' }}>Total Capacity: </span><strong>{wh.total_capacity} MT</strong></div>
                  <div><span style={{ color: 'var(--slate-500)' }}>Available Capacity: </span><strong>{wh.available_capacity} MT</strong></div>
                  <div><span style={{ color: 'var(--slate-500)' }}>Tariff: </span>₹{wh.price_per_kg_per_day}/kg/day (₹{wh.price_per_tonne_per_month}/MT/mo)</div>
                  <div><span style={{ color: 'var(--slate-500)' }}>Temperature: </span>{wh.temperature_range}</div>
                  <div><span style={{ color: 'var(--slate-500)' }}>Supported Crops: </span>{wh.supported_crops}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LOGISTICS PROVIDERS */}
      {activeTab === 'logistics' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Logistics & Fleet Provider Registrations</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
              Registered Transporters: <strong>{logisticsList.length}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {logisticsList.map((log) => (
              <Card key={log.id} style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>{log.company_name}</h4>
                      <Badge variant={log.verification_status === 'VERIFIED' ? 'success' : log.verification_status === 'PENDING' ? 'warning' : 'danger'}>
                        {log.verification_status}
                      </Badge>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--slate-600)', marginTop: '4px' }}>
                      Operator Contact: <strong>{log.contact_person || log.user_name} ({log.phone || log.user_phone})</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {log.verification_status !== 'VERIFIED' && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => {
                          setLogStatusModal(log);
                          setLogAction('VERIFY');
                        }}
                      >
                        Verify Transporter
                      </Button>
                    )}
                    {log.verification_status !== 'REJECTED' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setLogStatusModal(log);
                          setLogAction('REJECT');
                        }}
                      >
                        Reject
                      </Button>
                    )}
                    {log.verification_status !== 'SUSPENDED' && (
                      <Button
                        variant="neutral"
                        size="sm"
                        onClick={() => {
                          setLogStatusModal(log);
                          setLogAction('SUSPEND');
                        }}
                      >
                        Suspend
                      </Button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '12px', backgroundColor: 'var(--slate-50)', padding: '10px', borderRadius: '6px', fontSize: '0.82rem' }}>
                  <div><span style={{ color: 'var(--slate-500)' }}>Service Districts: </span><strong>{log.service_districts || 'All Maharashtra'}</strong></div>
                  <div><span style={{ color: 'var(--slate-500)' }}>Fleet Size: </span><strong>{log.fleet_size || 'N/A'} Commercial Vehicles</strong></div>
                  <div><span style={{ color: 'var(--slate-500)' }}>Vehicle Types: </span>{log.vehicle_types_available || 'MINI_TRUCK, PICKUP, LCV, TRUCK'}</div>
                  <div><span style={{ color: 'var(--slate-500)' }}>Reg / License: </span>{log.transport_license || 'MH-RTO-COMMERCIAL-PROTOTYPE'}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PROTOTYPE ESCROW AUDIT */}
      {activeTab === 'escrow' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Prototype Escrow Vault Financial Audit</h2>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.85rem', margin: '4px 0 0' }}>
              Simulated agricultural escrow ledger records ensuring 100% two-stage payment protection for farmer produce.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {escrowRecords.map((rec) => (
              <Card key={rec.id} style={{ padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--slate-900)' }}>
                        Txn #{rec.transaction_id || rec.id} • {rec.stage || rec.payment_type}
                      </span>
                      <Badge variant={['RELEASED_TO_SELLER', 'SETTLED', 'SUCCESS'].includes(rec.escrow_status) ? 'success' : 'warning'}>
                        {rec.escrow_status || 'PROTOTYPE_HELD'}
                      </Badge>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                      Payer: <strong>User #{rec.payer_id}</strong> → Payee: <strong>User #{rec.payee_id}</strong> • Date: {new Date(rec.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                        ₹{rec.amount?.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                        Ref: {rec.reference_number || 'SIM/ESCROW/2026'}
                      </div>
                    </div>
                    {rec.transaction_id && (
                      <Button variant="secondary" size="sm" onClick={() => openTxnAudit(rec.transaction_id)}>
                        Audit Dossier
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: GRIEVANCES & DISPUTES */}
      {activeTab === 'grievances' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Grievance Redressal & Official Adjudication Console</h2>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.85rem', margin: '4px 0 0' }}>
              Complaints and transaction disputes under administrative arbitration. Unresolved disputes block escrow settlement.
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
                      <Badge variant={g.status === 'RESOLVED' ? 'success' : g.status === 'UNDER_REVIEW' ? 'warning' : 'danger'}>
                        {g.status}
                      </Badge>
                      <Badge variant="neutral">{g.category}</Badge>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', marginTop: '4px' }}>
                      Case Ref: <strong>{g.grievance_ref}</strong> • Complainant: <strong>{g.complainant_name} ({g.complainant_role})</strong>
                      {g.transaction_id && <> • Linked Transaction: <strong>Txn #{g.transaction_id}</strong></>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {g.status === 'OPEN' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleGrievanceStatus(g.id, 'UNDER_REVIEW', 'Investigation initiated by Nodal Officer.')}
                      >
                        Start Investigation
                      </Button>
                    )}

                    {g.status !== 'RESOLVED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setResolveGrievanceModal(g);
                          setResolutionNotes('Claim investigated by Taluka Inspector. Dispute resolved and terms mutually settled.');
                        }}
                      >
                        Adjudicate & Resolve
                      </Button>
                    )}

                    {g.transaction_id && (
                      <Button variant="secondary" size="sm" onClick={() => openTxnAudit(g.transaction_id)}>
                        Inspect Txn
                      </Button>
                    )}
                  </div>
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

      {/* TAB 6: STORAGE BOOKINGS AUDIT */}
      {activeTab === 'storage' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Warehouse & Storage Bookings Audit</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
              Total Facility Reservations: <strong>{storageBookings.length}</strong>
            </div>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--slate-50)', borderBottom: '2px solid var(--border-color)', color: 'var(--slate-600)' }}>
                  <th style={{ padding: '10px 14px' }}>Booking Ref</th>
                  <th style={{ padding: '10px 14px' }}>Facility</th>
                  <th style={{ padding: '10px 14px' }}>Client User</th>
                  <th style={{ padding: '10px 14px' }}>Crop Cargo</th>
                  <th style={{ padding: '10px 14px' }}>Quantity</th>
                  <th style={{ padding: '10px 14px' }}>Duration</th>
                  <th style={{ padding: '10px 14px' }}>Estimated Cost</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {storageBookings.map((sb) => (
                  <tr key={sb.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>{sb.booking_ref}</td>
                    <td style={{ padding: '10px 14px' }}>{sb.warehouse_name} ({sb.warehouse_district})</td>
                    <td style={{ padding: '10px 14px' }}>{sb.user_name} ({sb.user_role})</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{sb.crop}</td>
                    <td style={{ padding: '10px 14px' }}>{sb.quantity} {sb.unit}</td>
                    <td style={{ padding: '10px 14px' }}>{sb.expected_duration_days} Days</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--primary-700)' }}>₹{sb.estimated_cost?.toLocaleString()}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <Badge variant={['APPROVED', 'COMPLETED', 'ACTIVE'].includes(sb.status) ? 'success' : ['PENDING', 'REQUESTED'].includes(sb.status) ? 'warning' : 'danger'}>
                        {sb.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: ADMINISTRATIVE AUDIT LOG */}
      {activeTab === 'audit_logs' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Append-Only Administrative Action Log</h2>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.85rem', margin: '4px 0 0' }}>
              Immutable regulatory audit trail recording all government verifications, suspensions, and dispute resolutions.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {auditLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{log.action}</span>
                    <Badge variant="neutral">{log.target_type} #{log.target_id}</Badge>
                    <span style={{ color: 'var(--slate-500)', fontSize: '0.75rem' }}>by {log.admin_name}</span>
                  </div>
                  <div style={{ color: 'var(--slate-600)', marginTop: '3px' }}>{log.details}</div>
                  {log.reason && <div style={{ color: '#b45309', fontSize: '0.75rem', marginTop: '2px' }}>Reason: {log.reason}</div>}
                </div>
                <div style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* USER DETAIL VIEW MODAL */}
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
                    <div><strong>Representative Aadhaar:</strong> {prof.aadhaar_masked || 'XXXX XXXX 6721'}</div>
                    <div><strong>Bank Account:</strong> {prof.bank_account_masked || 'XXXXXX4419'} ({prof.bank_name || 'Bank of Maharashtra'})</div>
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
                    <div><strong>Signatory Aadhaar:</strong> {prof.aadhaar_masked || 'XXXX XXXX 8834'}</div>
                    <div><strong>Bank Account:</strong> {prof.bank_account_masked || 'XXXXXX7720'}</div>
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
                    <div><strong>Operator Aadhaar:</strong> {prof.aadhaar_masked || 'XXXX XXXX 3390'}</div>
                    <div><strong>Payout Bank Account:</strong> {prof.bank_account_masked || 'XXXXXX9912'}</div>
                  </div>
                )}

                {/* Logistics specific details */}
                {u.role === 'LOGISTICS' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--slate-800)' }}>Transporter Fleet Details:</div>
                    <div><strong>Company:</strong> {prof.company_name}</div>
                    <div><strong>Contact Person:</strong> {prof.contact_person}</div>
                    <div><strong>Fleet Size:</strong> {prof.fleet_size || 8} Commercial Trucks</div>
                    <div><strong>Service Districts:</strong> {prof.service_districts || 'All Maharashtra'}</div>
                    <div><strong>License:</strong> {prof.transport_license || 'MH-RTO-COMMERCIAL-PROTOTYPE'}</div>
                    <div><strong>Bank Account:</strong> {prof.bank_account_masked || 'XXXXXX5521'}</div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                  <Button variant="secondary" onClick={() => setSelectedUserDetail(null)}>Close</Button>
                  {u.verification_status !== 'VERIFIED' && (
                    <Button variant="success" onClick={() => handleAction(u.id, 'VERIFY')}>
                      Verify Now
                    </Button>
                  )}
                  {u.verification_status !== 'REJECTED' && (
                    <Button variant="danger" onClick={() => { setRejectModalUser(u); setSelectedUserDetail(null); }}>
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectModalUser && (
        <Modal
          isOpen={!!rejectModalUser}
          onClose={() => setRejectModalUser(null)}
          title={`Reject Registration: ${rejectModalUser.name || rejectModalUser.phone}`}
        >
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginBottom: '12px' }}>
              Administrative protocol requires a formal rejection reason to be recorded and communicated to the applicant.
            </p>

            <Input
              label="Mandatory Rejection Reason *"
              placeholder="e.g. Mismatched land ownership documentation / Invalid license certificate"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
            />

            <Input
              label="Department Internal Notes"
              placeholder="Optional notes for department audit trail"
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

      {/* WAREHOUSE STATUS MODAL */}
      {whStatusModal && (
        <Modal
          isOpen={!!whStatusModal}
          onClose={() => setWhStatusModal(null)}
          title={`Facility Review: ${whStatusModal.name}`}
        >
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginBottom: '12px' }}>
              Execute administrative verification action for this cold chain / storage facility.
            </p>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Action</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['VERIFY', 'REJECT', 'SUSPEND'].map((act) => (
                  <Button
                    key={act}
                    variant={whAction === act ? (act === 'VERIFY' ? 'success' : act === 'REJECT' ? 'danger' : 'neutral') : 'secondary'}
                    size="sm"
                    onClick={() => setWhAction(act)}
                  >
                    {act}
                  </Button>
                ))}
              </div>
            </div>

            {whAction !== 'VERIFY' && (
              <Input
                label="Reason / Inspector Order *"
                placeholder="Reason for rejection or suspension..."
                value={whReason}
                onChange={(e) => setWhReason(e.target.value)}
                required
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button variant="secondary" onClick={() => setWhStatusModal(null)}>Cancel</Button>
              <Button
                variant={whAction === 'VERIFY' ? 'success' : 'danger'}
                onClick={handleWarehouseAction}
              >
                Confirm {whAction}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* LOGISTICS STATUS MODAL */}
      {logStatusModal && (
        <Modal
          isOpen={!!logStatusModal}
          onClose={() => setLogStatusModal(null)}
          title={`Transporter Review: ${logStatusModal.company_name}`}
        >
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginBottom: '12px' }}>
              Execute regulatory verification action for this logistics fleet operator.
            </p>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Action</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['VERIFY', 'REJECT', 'SUSPEND'].map((act) => (
                  <Button
                    key={act}
                    variant={logAction === act ? (act === 'VERIFY' ? 'success' : act === 'REJECT' ? 'danger' : 'neutral') : 'secondary'}
                    size="sm"
                    onClick={() => setLogAction(act)}
                  >
                    {act}
                  </Button>
                ))}
              </div>
            </div>

            {logAction !== 'VERIFY' && (
              <Input
                label="Reason / Inspector Order *"
                placeholder="Reason for rejection or suspension..."
                value={logReason}
                onChange={(e) => setLogReason(e.target.value)}
                required
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button variant="secondary" onClick={() => setLogStatusModal(null)}>Cancel</Button>
              <Button
                variant={logAction === 'VERIFY' ? 'success' : 'danger'}
                onClick={handleLogisticsAction}
              >
                Confirm {logAction}
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
          <div>
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
              <Button
                variant="primary"
                onClick={() => handleGrievanceStatus(resolveGrievanceModal.id, 'RESOLVED', resolutionNotes)}
              >
                Submit Official Order
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* TRANSACTION 360-AUDIT DOSSIER MODAL */}
      {txnAuditDossier && (
        <Modal
          isOpen={!!txnAuditDossier}
          onClose={() => setTxnAuditDossier(null)}
          title={`End-to-End Audit Dossier: ${txnAuditDossier.transaction.transaction_ref}`}
        >
          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '70vh', overflowY: 'auto' }}>
            {/* Status and parties */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Cargo: </strong>{txnAuditDossier.transaction.crop} • {txnAuditDossier.transaction.quantity} {txnAuditDossier.transaction.unit}
              </div>
              <Badge variant="success">{txnAuditDossier.transaction.status}</Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: 'var(--slate-50)', padding: '10px', borderRadius: '6px' }}>
              <div>
                <span style={{ color: 'var(--slate-500)' }}>Seller / Producer: </span>
                <div><strong>{txnAuditDossier.seller.name}</strong> ({txnAuditDossier.seller.phone})</div>
                <Badge variant={txnAuditDossier.seller.verification_status === 'VERIFIED' ? 'success' : 'warning'}>
                  {txnAuditDossier.seller.verification_status}
                </Badge>
              </div>
              <div>
                <span style={{ color: 'var(--slate-500)' }}>Buyer / Procurement: </span>
                <div><strong>{txnAuditDossier.buyer.name}</strong> ({txnAuditDossier.buyer.phone})</div>
                <Badge variant={txnAuditDossier.buyer.verification_status === 'VERIFIED' ? 'success' : 'warning'}>
                  {txnAuditDossier.buyer.verification_status}
                </Badge>
              </div>
            </div>

            {/* Financials & Escrow */}
            <div style={{ backgroundColor: 'var(--slate-50)', padding: '10px', borderRadius: '6px' }}>
              <div style={{ fontWeight: 700, marginBottom: '6px' }}>Prototype Escrow Financial Breakdown:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>Total: <strong>₹{txnAuditDossier.transaction.total_amount?.toLocaleString()}</strong></div>
                <div>Advance (20%): <strong>₹{txnAuditDossier.transaction.advance_amount?.toLocaleString()}</strong></div>
                <div>Balance (80%): <strong>₹{txnAuditDossier.transaction.balance_amount?.toLocaleString()}</strong></div>
              </div>
              <div style={{ marginTop: '8px' }}>
                <span style={{ color: 'var(--slate-500)' }}>Escrow Payments Recorded: </span>
                <strong>{txnAuditDossier.escrow_records?.length || 0} Ledger Entries</strong>
              </div>
            </div>

            {/* Logistics & Delivery */}
            <div style={{ backgroundColor: 'var(--slate-50)', padding: '10px', borderRadius: '6px' }}>
              <div style={{ fontWeight: 700, marginBottom: '6px' }}>Logistics Consignment & Delivery POD:</div>
              {txnAuditDossier.logistics_order ? (
                <div>
                  <div>Transporter: <strong>{txnAuditDossier.logistics_order.provider_name || 'Assigned Transporter'}</strong></div>
                  <div>Vehicle: <strong>{txnAuditDossier.logistics_order.vehicle_number || 'Awaiting assignment'}</strong> ({txnAuditDossier.logistics_order.vehicle_type})</div>
                  <div>Driver: <strong>{txnAuditDossier.logistics_order.driver_name || 'Assigned'}</strong></div>
                  <div>Status: <Badge variant="info">{txnAuditDossier.logistics_order.status}</Badge></div>
                  {txnAuditDossier.logistics_order.pod_image_url && (
                    <div style={{ marginTop: '6px', color: '#166534', fontWeight: 600 }}>
                      ✓ Proof of Delivery (POD) Image On File: {txnAuditDossier.logistics_order.pod_image_url}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: 'var(--slate-500)' }}>No external transport request linked to this transaction.</div>
              )}
            </div>

            {/* Sequential history */}
            <div>
              <div style={{ fontWeight: 700, marginBottom: '6px' }}>Sequential Transaction History Events:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {txnAuditDossier.history_events.map((h) => (
                  <div key={h.id} style={{ fontSize: '0.75rem', color: 'var(--slate-600)', borderLeft: '2px solid var(--primary-700)', paddingLeft: '8px' }}>
                    <strong>{h.event}</strong> ({h.previous_state} → {h.new_state}) by {h.actor_role} on {new Date(h.created_at).toLocaleString()}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <Button variant="secondary" onClick={() => setTxnAuditDossier(null)}>Close Dossier</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;
