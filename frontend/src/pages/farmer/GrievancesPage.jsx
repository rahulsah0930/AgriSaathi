import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, StatusBadge, Input, Select, Modal } from '../../components/common';
import {
  AlertTriangle,
  ShieldCheck,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  MapPin,
  Camera
} from 'lucide-react';
import api from '../../services/api';

export const GrievancesPage = ({ user, onNavigate }) => {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fileModalOpen, setFileModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('QUALITY_MISMATCH');
  const [description, setDescription] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState(null);

  const loadGrievances = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/grievances?user_id=${user?.id || 1}`);
      if (res && res.grievances) {
        setGrievances(res.grievances);
      }
    } catch (err) {
      console.error('[GrievancesPage Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrievances();
  }, [user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) return;

    setSubmitting(true);
    try {
      const res = await api.post('/api/grievances', {
        complainant_id: user?.id || 1,
        title,
        category,
        description,
        location_address: locationAddress || 'APMC Yard, Nashik',
        location_district: user?.profile?.district || 'Nashik',
      });

      if (res.success) {
        setBanner({ type: 'success', message: res.message });
        setFileModalOpen(false);
        setTitle('');
        setDescription('');
        loadGrievances();
      }
    } catch (err) {
      alert(err.message || 'Failed to file grievance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--slate-900)' }}>
            Grievance Redressal & Official Adjudication
          </h1>
          <p style={{ color: 'var(--slate-600)', margin: '4px 0 0', fontSize: '0.9rem' }}>
            Government Nodal Officer dispute arbitration for agricultural trade claims
          </p>
        </div>

        <Button variant="primary" onClick={() => setFileModalOpen(true)}>
          <PlusCircle size={16} style={{ marginRight: '6px' }} />
          File New Dispute Claim
        </Button>
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
          }}
        >
          {banner.message}
        </div>
      )}

      {/* Grievances List */}
      {grievances.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <ShieldCheck size={48} color="var(--success-600)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '8px' }}>
            Zero Active Disputes
          </h3>
          <p style={{ color: 'var(--slate-600)', maxWidth: '480px', margin: '0 auto 16px' }}>
            All your trade transactions and warehouse bookings are in good standing without any pending claims.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {grievances.map((g) => (
            <Card key={g.id} style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                      {g.title}
                    </h3>
                    <Badge variant={g.status === 'RESOLVED' ? 'success' : 'danger'}>
                      {g.status}
                    </Badge>
                    <Badge variant="warning">{g.category}</Badge>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', marginTop: '4px' }}>
                    Case Ref: <strong>{g.grievance_ref}</strong> • Filed on: {new Date(g.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <p style={{ margin: '12px 0', fontSize: '0.9rem', color: 'var(--slate-700)', lineHeight: '1.5' }}>
                {g.description}
              </p>

              {g.location_address && (
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                  <MapPin size={12} />
                  <span>Inspection Location: {g.location_address} ({g.location_district})</span>
                </div>
              )}

              {g.resolution_notes && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '6px',
                    fontSize: '0.825rem',
                    color: '#166534',
                    marginTop: '8px',
                  }}
                >
                  ✓ <strong>Official Government Resolution:</strong> {g.resolution_notes}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* FILE GRIEVANCE MODAL */}
      {fileModalOpen && (
        <Modal
          isOpen={fileModalOpen}
          onClose={() => setFileModalOpen(false)}
          title="File Official Trade Grievance / Claim"
        >
          <form onSubmit={handleSubmit}>
            <Input
              label="Claim Subject / Title *"
              placeholder="e.g. Quality Mismatch on Tomato Crates / Transit Delay"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <Select
              label="Claim Category *"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: 'QUALITY_MISMATCH', label: 'Quality Grade / Disparity Claim' },
                { value: 'QUANTITY_SHORTAGE', label: 'Quantity Shortage at Unloading' },
                { value: 'DELIVERY_DELAY', label: 'Transit & Delivery Delay' },
                { value: 'PAYMENT_ISSUE', label: 'Escrow Settlement Query' },
                { value: 'STORAGE_DAMAGE', label: 'Cold Storage Damage' },
                { value: 'OTHER', label: 'Other Statutory Complaint' },
              ]}
              required
            />

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '4px' }}>
                Detailed Statement of Facts *
              </label>
              <textarea
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the discrepancy, lot reference, and requested resolution..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <Input
              label="Inspection / Farm Gate Location"
              placeholder="e.g. APMC Yard Gate No. 2, Nashik"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
            />

            <div
              style={{
                backgroundColor: '#eff6ff',
                padding: '10px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#1e40af',
                marginBottom: '16px',
              }}
            >
              ⚖ <strong>Adjudication Notice:</strong> This submission will be formally escalated to the Taluka Agriculture Nodal Officer. An official inspection order will be scheduled within 24-48 hours.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="secondary" onClick={() => setFileModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={submitting}>
                Submit Formal Claim
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default GrievancesPage;
