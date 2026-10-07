import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, StatusBadge, Modal, Input } from '../../components/common';
import { Package, Truck, CheckCircle2, ShieldCheck, MapPin, Eye, Clock, Phone, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export const TransactionsPage = ({ user, onNavigate }) => {
  const [transactions, setTransactions] = useState([]);
  const [logisticsMap, setLogisticsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(null);

  // Transport Request Modal
  const [requestModalTxn, setRequestModalTxn] = useState(null);
  const [preferredPickupAt, setPreferredPickupAt] = useState('');
  const [transportNotes, setTransportNotes] = useState('');
  const [requestingTransport, setRequestingTransport] = useState(false);

  // POD Image Preview
  const [previewPodUrl, setPreviewPodUrl] = useState(null);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/transactions');
      if (res.success) {
        const txns = res.transactions || [];
        setTransactions(txns);

        // Fetch linked transport order for each transaction
        const logMap = {};
        await Promise.all(
          txns.map(async (t) => {
            try {
              const logRes = await api.get(`/api/logistics/transaction/${t.id}`);
              if (logRes.success && logRes.transport_order) {
                logMap[t.id] = logRes.transport_order;
              }
            } catch (e) {
              // Ignore individual lookup errors
            }
          })
        );
        setLogisticsMap(logMap);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [user?.id]);

  // Handle Request Transport Submission
  const handleCreateTransportRequest = async (e) => {
    e.preventDefault();
    if (!requestModalTxn) return;

    setRequestingTransport(true);
    try {
      const res = await api.post('/api/logistics/request', {
        transaction_id: requestModalTxn.id,
        preferred_pickup_at: preferredPickupAt || undefined,
        notes: transportNotes || undefined,
      });

      if (res.success) {
        setBanner({
          type: 'success',
          message: `Transport request ${res.transport_order?.order_ref} submitted successfully. Transporters in the corridor have been notified.`,
        });
        setRequestModalTxn(null);
        setPreferredPickupAt('');
        setTransportNotes('');
        loadTransactions();
      }
    } catch (err) {
      alert(err.message || 'Failed to create transport request.');
    } finally {
      setRequestingTransport(false);
    }
  };

  const getStepActive = (currentStatus, stepName) => {
    const sequence = [
      'AWAITING_ADVANCE',
      'READY_FOR_LOGISTICS',
      'IN_DELIVERY',
      'DELIVERED',
      'BUYER_CONFIRMED',
      'COMPLETED'
    ];
    const normalizedMap = {
      'DEAL_CONFIRMED': 'AWAITING_ADVANCE',
      'OFFER_ACCEPTED': 'AWAITING_ADVANCE',
      'ADVANCE_PENDING': 'AWAITING_ADVANCE',
      'ADVANCE_PAID': 'READY_FOR_LOGISTICS',
      'ADVANCE_ESCROW_HELD': 'READY_FOR_LOGISTICS',
      'PREPARING': 'READY_FOR_LOGISTICS',
      'READY_FOR_PICKUP': 'READY_FOR_LOGISTICS',
      'IN_TRANSIT': 'IN_DELIVERY',
      'BALANCE_ESCROW_HELD': 'BUYER_CONFIRMED',
      'SETTLED': 'COMPLETED'
    };
    const norm = normalizedMap[currentStatus] || currentStatus;
    const currentIndex = sequence.indexOf(norm);
    const stepIndex = sequence.indexOf(stepName);
    return currentIndex >= stepIndex && currentIndex !== -1 && stepIndex !== -1;
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--slate-900)' }}>
            Contract Fulfillment & Orders
          </h1>
          <p style={{ color: 'var(--slate-600)', margin: '4px 0 0', fontSize: '0.9rem' }}>
            Unified live fulfillment, simulated escrow hold, and verified logistics dispatch
          </p>
        </div>

        <Badge variant="info" size="lg">
          Protected by Prototype Escrow
        </Badge>
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
          <button onClick={() => setBanner(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading contracts...</div>
      ) : transactions.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Package size={48} color="var(--slate-400)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '8px' }}>
            No Active Contracts Yet
          </h3>
          <p style={{ color: 'var(--slate-600)', maxWidth: '480px', margin: '0 auto 20px' }}>
            When a buyer offer is agreed and accepted, it is automatically converted into an official contract order here.
          </p>
          <Button variant="primary" onClick={() => onNavigate && onNavigate('dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {transactions.map((txn) => {
            const isSeller = user?.role === 'FARMER' || user?.role === 'FPO';
            const isBuyer = user?.role === 'BUYER';
            const transportOrder = logisticsMap[txn.id];

            return (
              <Card key={txn.id} style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                        {txn.crop} {txn.variety ? `(${txn.variety})` : ''} — {txn.quantity} {txn.unit}
                      </h3>
                      <StatusBadge status={txn.status} />
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginTop: '4px' }}>
                      Ref: <strong>{txn.transaction_ref}</strong> • Buyer: <strong>{txn.buyer_name || `Buyer #${txn.buyer_id}`}</strong> • Seller: <strong>{txn.seller_name || `Seller #${txn.seller_id}`}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                      ₹{txn.total_amount?.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>
                      Agreed Rate: ₹{txn.agreed_price_per_unit}/{txn.unit}
                    </div>
                  </div>
                </div>

                {/* Fulfillment Lifecycle Timeline */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '4px',
                    margin: '18px 0',
                    backgroundColor: 'var(--slate-50)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {[
                    { label: 'Deal Agreed', key: 'AWAITING_ADVANCE' },
                    { label: '20% Advance Escrow', key: 'READY_FOR_LOGISTICS' },
                    { label: 'In Delivery', key: 'IN_DELIVERY' },
                    { label: 'Delivered', key: 'DELIVERED' },
                    { label: 'Payment Settled', key: 'COMPLETED' },
                  ].map((step, idx) => {
                    const done = getStepActive(txn.status, step.key);
                    return (
                      <div key={idx} style={{ textAlign: 'center', position: 'relative' }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: done ? 'var(--primary-600)' : 'var(--slate-300)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {done ? '✓' : idx + 1}
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: done ? 700 : 500, color: done ? 'var(--slate-900)' : 'var(--slate-500)' }}>
                          {step.label}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Escrow & Logistics Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px', fontSize: '0.85rem', marginBottom: '14px' }}>
                  {/* Escrow Box */}
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--slate-800)', marginBottom: '6px' }}>
                      🔒 Prototype Escrow Vault:
                    </div>
                    <div>Advance (20%): <strong>₹{txn.advance_amount?.toLocaleString()}</strong> ({['AWAITING_ADVANCE', 'ADVANCE_PENDING', 'OFFER_ACCEPTED'].includes(txn.status) ? 'Pending Buyer Deposit' : 'Held in Prototype Escrow'})</div>
                    <div>Remaining Balance: <strong>₹{txn.balance_amount?.toLocaleString()}</strong> ({txn.status === 'COMPLETED' ? 'Settled to Seller' : 'Due upon physical delivery confirmation'})</div>
                  </div>

                  {/* Verified Logistics Box */}
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                        🚚 Verified Logistics Dispatch:
                      </div>
                      {transportOrder && (
                        <Badge variant={transportOrder.status === 'DELIVERED' ? 'success' : 'info'} size="sm">
                          {transportOrder.status.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>

                    {transportOrder ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.8rem' }}>
                        <div>Order Ref: <strong>{transportOrder.order_ref}</strong></div>
                        <div>Carrier: <strong>{transportOrder.provider_name || 'Transporter Assignment Pending'}</strong></div>
                        {transportOrder.vehicle_number && (
                          <div>Vehicle: <strong>{transportOrder.vehicle_number}</strong> ({transportOrder.vehicle_type})</div>
                        )}
                        {transportOrder.driver_name && (
                          <div>Driver: <strong>{transportOrder.driver_name}</strong> {transportOrder.driver_phone ? `(${transportOrder.driver_phone})` : ''}</div>
                        )}
                        <div>Approx Distance: <strong>{transportOrder.estimated_distance_km ? `${transportOrder.estimated_distance_km} km (Approximate distance)` : 'Unavailable'}</strong></div>
                        {transportOrder.refrigerated_recommended && (
                          <div style={{ color: '#1e40af', fontWeight: 600 }}>❄️ Refrigerated transport recommended</div>
                        )}
                        {transportOrder.pod_image_url && (
                          <div style={{ marginTop: '4px' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setPreviewPodUrl(transportOrder.pod_image_url)}
                              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                            >
                              <Eye size={12} style={{ marginRight: '4px' }} /> View Proof of Delivery (POD)
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                        <div>Pickup: {txn.pickup_address || 'Seller Farmgate'}</div>
                        <div>Delivery: {txn.delivery_address || 'Buyer Central Depot'}</div>
                        <div style={{ marginTop: '4px', fontStyle: 'italic', color: 'var(--slate-400)' }}>
                          No logistics order created yet.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Seller Actions (Phase 5: Real Logistics Workflow) */}
                {isSeller && (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {txn.status === 'READY_FOR_LOGISTICS' && !transportOrder && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setRequestModalTxn(txn);
                          setPreferredPickupAt('');
                          setTransportNotes('');
                        }}
                      >
                        🚚 Request Logistics Transport
                      </Button>
                    )}

                    {transportOrder && transportOrder.status === 'REQUESTED' && (
                      <Badge variant="warning" size="md">
                        Transporter Notification Sent • Awaiting Acceptance
                      </Badge>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onNavigate && onNavigate('payments')}
                    >
                      View Escrow Vault
                    </Button>
                  </div>
                )}

                {/* Buyer Actions */}
                {isBuyer && (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {txn.status === 'DELIVERED' && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={async () => {
                          if (!window.confirm('Confirm that produce has been physically inspected and received at your destination hub?')) return;
                          try {
                            const res = await api.post(`/api/transactions/${txn.id}/confirm-delivery`);
                            if (res.success) {
                              setBanner({ type: 'success', message: res.message });
                              loadTransactions();
                            }
                          } catch (e) {
                            alert(e.message || 'Confirmation failed');
                          }
                        }}
                      >
                        ✓ Inspect & Confirm Physical Delivery
                      </Button>
                    )}
                    {txn.status === 'BUYER_CONFIRMED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={async () => {
                          try {
                            const res = await api.post('/api/payments/pay-balance', {
                              transaction_id: txn.id,
                              payment_method: 'SIMULATED_ESCROW'
                            });
                            if (res.success) {
                              setBanner({ type: 'success', message: res.message });
                              loadTransactions();
                            }
                          } catch (e) {
                            alert(e.message || 'Payment failed');
                          }
                        }}
                      >
                        Pay Remaining Balance (Prototype) ₹{txn.balance_amount?.toLocaleString()}
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onNavigate && onNavigate('grievances')}
                    >
                      Report Quality Claim
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* REQUEST TRANSPORT MODAL */}
      {requestModalTxn && (
        <Modal
          isOpen={!!requestModalTxn}
          onClose={() => setRequestModalTxn(null)}
          title={`Request Transport — ${requestModalTxn.transaction_ref}`}
        >
          <form onSubmit={handleCreateTransportRequest}>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', margin: '0 0 14px 0' }}>
              Broadcast a transport dispatch request to verified commercial transporters.
            </p>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px', marginBottom: '14px', fontSize: '0.825rem' }}>
              <div>Produce Cargo: <strong>{requestModalTxn.crop} ({requestModalTxn.quantity} {requestModalTxn.unit})</strong></div>
              <div>Origin: <strong>{requestModalTxn.pickup_address} ({requestModalTxn.pickup_district})</strong></div>
              <div>Destination: <strong>{requestModalTxn.delivery_address} ({requestModalTxn.delivery_district})</strong></div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <Input
                label="Preferred Pickup Date & Time"
                type="datetime-local"
                value={preferredPickupAt}
                onChange={(e) => setPreferredPickupAt(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', display: 'block', marginBottom: '6px' }}>
                Special Handling Instructions (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Ventilated crates required. Pickup before noon."
                value={transportNotes}
                onChange={(e) => setTransportNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="secondary" onClick={() => setRequestModalTxn(null)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={requestingTransport}>
                Submit Transport Request
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* PROOF OF DELIVERY PREVIEW MODAL */}
      {previewPodUrl && (
        <Modal
          isOpen={!!previewPodUrl}
          onClose={() => setPreviewPodUrl(null)}
          title="Verified Proof of Delivery (POD)"
        >
          <div style={{ textAlign: 'center' }}>
            <img
              src={previewPodUrl}
              alt="Proof of Delivery"
              style={{
                maxWidth: '100%',
                maxHeight: '450px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                objectFit: 'contain',
              }}
            />
            <div style={{ marginTop: '16px' }}>
              <Button variant="primary" onClick={() => setPreviewPodUrl(null)}>Close Preview</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TransactionsPage;
