import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, StatusBadge } from '../../components/common';
import {
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Lock,
  Unlock,
  CreditCard,
  Building2,
  FileCheck
} from 'lucide-react';
import api from '../../services/api';

export const PaymentsEscrowPage = ({ user, onNavigate }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/payments?user_id=${user?.id || 1}`);
        if (res && res.payments) {
          setPayments(res.payments);
        }
      } catch (err) {
        console.error('[PaymentsEscrowPage Error]', err);
      } finally {
        setLoading(false);
      }
    };
    loadPayments();
  }, [user?.id]);

  const totalEscrow = payments
    .filter((p) => p.escrow_status === 'HELD_BY_GOVT_ESCROW')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalSettled = payments
    .filter((p) => p.escrow_status === 'RELEASED_TO_SELLER')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--slate-900)' }}>
            Government Escrow & Payments Vault
          </h1>
          <p style={{ color: 'var(--slate-600)', margin: '4px 0 0', fontSize: '0.9rem' }}>
            Maharashtra Agriculture Marketing Board Secured Escrow Settlement Engine
          </p>
        </div>

        <Badge variant="success" size="lg">
          State Escrow Lien Active
        </Badge>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <Card style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Locked in Government Escrow</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b' }}>
                ₹{totalEscrow.toLocaleString()}
              </div>
            </div>
            <Lock size={28} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '8px' }}>
            Advance secured. Releases upon verified delivery confirmation.
          </div>
        </Card>

        <Card style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Total Released & Settled</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669' }}>
                ₹{totalSettled.toLocaleString()}
              </div>
            </div>
            <Unlock size={28} color="#059669" />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success-700)', marginTop: '8px' }}>
            Direct benefit transfer (DBT) dispatched to bank account.
          </div>
        </Card>

        <Card style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Registered Bank Account</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-800)' }}>
                {user?.profile?.bank_account_masked || 'XXXXXX8812'}
              </div>
            </div>
            <Building2 size={28} color="var(--primary-600)" />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '8px' }}>
            IFSC: {user?.profile?.ifsc_code_masked || 'SBIN0001234'} (Verified)
          </div>
        </Card>
      </div>

      {/* Payment Records Table */}
      <Card style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 16px', color: 'var(--slate-900)' }}>
          Statutory Payment Receipts & Escrow Ledger
        </h3>

        {payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--slate-500)' }}>
            No payment records generated yet. Payments appear automatically when buyers lock deals.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--slate-50)', borderBottom: '1px solid var(--border-color)', color: 'var(--slate-700)' }}>
                  <th style={{ padding: '10px 14px' }}>Receipt / Ref</th>
                  <th style={{ padding: '10px 14px' }}>Stage</th>
                  <th style={{ padding: '10px 14px' }}>Amount</th>
                  <th style={{ padding: '10px 14px' }}>Escrow Status</th>
                  <th style={{ padding: '10px 14px' }}>Method</th>
                  <th style={{ padding: '10px 14px' }}>Audit Details</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{p.payment_ref}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <Badge variant="neutral">{p.stage}</Badge>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--primary-700)' }}>
                      ₹{p.amount?.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <Badge variant={p.escrow_status === 'HELD_BY_GOVT_ESCROW' ? 'warning' : 'success'}>
                        {p.escrow_status}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                      {p.payment_method}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.78rem', color: 'var(--slate-600)', maxWidth: '280px' }}>
                      {p.govt_audit_notes || 'Secured in Govt Escrow Vault.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PaymentsEscrowPage;
