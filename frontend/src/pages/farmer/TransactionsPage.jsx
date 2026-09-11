import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, StatusBadge, Modal, Input } from '../../components/common';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Building2,
  UserCheck,
  MapPin,
  Calendar,
  DollarSign,
  FileText
} from 'lucide-react';
import api from '../../services/api';

export const TransactionsPage = ({ user, onNavigate }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [banner, setBanner] = useState(null);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/transactions?user_id=${user?.id || 1}&role=${user?.role || 'FARMER'}`);
      if (res && res.transactions) {
        setTransactions(res.transactions);
      }
    } catch (err) {
      console.error('[TransactionsPage Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [user?.id]);

  const handleUpdateStatus = async (txnId, newStatus) => {
    try {
      const res = await api.post(`/api/transactions/${txnId}/status`, {
        status: newStatus,
      });
      if (res.success) {
        setBanner({ type: 'success', message: res.message });
        loadTransactions();
      }
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  const getStepActive = (currentStatus, stepName) => {
    const sequence = [
      'DEAL_CONFIRMED',
      'ADVANCE_PENDING',
      'ADVANCE_PAID',
      'PREPARING',
      'READY_FOR_PICKUP',
      'IN_TRANSIT',
      'DELIVERED',
      'BUYER_CONFIRMED',
      'COMPLETED'
    ];
    const currentIndex = sequence.indexOf(currentStatus);
    const stepIndex = sequence.indexOf(stepName);
    return currentIndex >= stepIndex;
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--slate-900)' }}>
            Contract Fulfillment & Orders
          </h1>
          <p style={{ color: 'var(--slate-600)', margin: '4px 0 0', fontSize: '0.9rem' }}>
            Unified live fulfillment, GPS transit tracking, and Government Escrow settlement
          </p>
        </div>

        <Badge variant="success" size="lg">
          Protected by Govt Escrow
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
          }}
        >
          {banner.message}
        </div>
      )}

      {transactions.length === 0 ? (
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

            return (
              <Card key={txn.id} style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                        {txn.crop} ({txn.variety}) — {txn.quantity} {txn.unit}
                      </span>
                      <Badge variant={txn.status === 'COMPLETED' ? 'success' : 'info'}>
                        {txn.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginTop: '4px' }}>
                      Contract Ref: <strong>{txn.transaction_ref}</strong> • Seller: <strong>{txn.seller_name}</strong> • Buyer: <strong>{txn.buyer_name}</strong>
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
                    { label: 'Deal Agreed', key: 'DEAL_CONFIRMED' },
                    { label: '20% Escrow Paid', key: 'ADVANCE_PAID' },
                    { label: 'Ready / In Transit', key: 'IN_TRANSIT' },
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginBottom: '14px' }}>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '6px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--slate-800)', marginBottom: '4px' }}>
                      🔒 Government Escrow Status:
                    </div>
                    <div>Advance Amount: <strong>₹{txn.advance_amount?.toLocaleString()}</strong> ({txn.status === 'ADVANCE_PENDING' ? 'Pending Buyer Deposit' : 'Held in Govt Escrow'})</div>
                    <div>Remaining Balance: <strong>₹{txn.balance_amount?.toLocaleString()}</strong> (Due upon delivery)</div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '6px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--slate-800)', marginBottom: '4px' }}>
                      🚚 Transit & Logistics:
                    </div>
                    <div>Pickup: <strong>{txn.pickup_address}</strong></div>
                    <div>Delivery: <strong>{txn.delivery_address}</strong></div>
                    {txn.tracking_number && <div>Tracking: <strong>{txn.tracking_number}</strong> ({txn.carrier_name})</div>}
                  </div>
                </div>

                {/* Seller Actions */}
                {isSeller && (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {txn.status === 'ADVANCE_PAID' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateStatus(txn.id, 'IN_TRANSIT')}
                      >
                        🚚 Dispatch Shipment / Mark In-Transit
                      </Button>
                    )}
                    {txn.status === 'IN_TRANSIT' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateStatus(txn.id, 'DELIVERED')}
                      >
                        Mark Reached Buyer Depot
                      </Button>
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
                    {txn.status === 'IN_TRANSIT' || txn.status === 'DELIVERED' ? (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleUpdateStatus(txn.id, 'BUYER_CONFIRMED')}
                      >
                        ✓ Inspect & Confirm Delivery
                      </Button>
                    ) : null}
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
    </div>
  );
};

export default TransactionsPage;
