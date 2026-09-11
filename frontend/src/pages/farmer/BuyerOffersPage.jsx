import React, { useState, useEffect, useCallback } from 'react';
import {
  PageHeader,
  Card,
  StatCard,
  Button,
  Badge,
  Input,
  Textarea,
  Modal,
  LoadingState,
  EmptyState,
} from '../../components/common';
import {
  Tag,
  CheckCircle2,
  XCircle,
  Clock,
  IndianRupee,
  Calendar,
  Building2,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  Send,
  Sliders,
} from 'lucide-react';
import api from '../../services/api';

const STATUS_TABS = ['ALL', 'PENDING', 'COUNTERED', 'ACCEPTED', 'REJECTED'];

export const BuyerOffersPage = ({ user, onNavigate }) => {
  const [offers, setOffers] = useState([]);
  const [activeStatus, setActiveStatus] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Counter Offer Modal State
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [activeOffer, setActiveOffer] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [isSubmittingCounter, setIsSubmittingCounter] = useState(false);

  // Accept Offer Confirmation Modal State
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const fetchOffers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sellerId = user?.id || 1;
      let url = `/api/offers?seller_id=${sellerId}`;
      if (activeStatus !== 'ALL') {
        url += `&status=${activeStatus}`;
      }
      const data = await api.get(url);
      setOffers(data.offers || []);
    } catch (err) {
      console.error('Failed to load offers:', err);
      setError(err.message || 'Error fetching buyer offers');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, activeStatus]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  // Handle Accept
  const handleOpenAccept = (offer) => {
    setActiveOffer(offer);
    setAcceptModalOpen(true);
  };

  const handleConfirmAccept = async () => {
    if (!activeOffer) return;
    setIsAccepting(true);
    try {
      const res = await api.patch(`/api/offers/${activeOffer.id}/accept`);
      if (res.success) {
        setActionFeedback({
          type: 'success',
          message: `Offer from ${activeOffer.buyer_name} accepted! Contract created and initialized in Transactions portal.`,
        });
        setAcceptModalOpen(false);
        fetchOffers();
      }
    } catch (err) {
      alert(`Failed to accept offer: ${err.message}`);
    } finally {
      setIsAccepting(false);
    }
  };

  // Handle Reject
  const handleRejectOffer = async (offer) => {
    if (!window.confirm(`Are you sure you want to decline the offer from ${offer.buyer_name}?`)) {
      return;
    }
    try {
      const res = await api.patch(`/api/offers/${offer.id}/reject`);
      if (res.success) {
        setActionFeedback({
          type: 'info',
          message: `Offer from ${offer.buyer_name} declined.`,
        });
        fetchOffers();
      }
    } catch (err) {
      alert(`Failed to decline offer: ${err.message}`);
    }
  };

  // Handle Counter
  const handleOpenCounter = (offer) => {
    setActiveOffer(offer);
    setCounterPrice((offer.offer_price * 1.08).toFixed(2));
    setCounterMessage(
      `We can deliver Grade A quality if rate is revised to ₹${(offer.offer_price * 1.08).toFixed(2)}/${offer.unit}.`
    );
    setCounterModalOpen(true);
  };

  const handleConfirmCounter = async (e) => {
    e.preventDefault();
    if (!activeOffer) return;

    setIsSubmittingCounter(true);
    try {
      const res = await api.patch(`/api/offers/${activeOffer.id}/counter`, {
        counter_price: parseFloat(counterPrice),
        counter_message: counterMessage,
      });

      if (res.success) {
        setActionFeedback({
          type: 'success',
          message: `Counter-offer of ₹${counterPrice}/${activeOffer.unit} dispatched to ${activeOffer.buyer_name}!`,
        });
        setCounterModalOpen(false);
        fetchOffers();
      }
    } catch (err) {
      alert(`Failed to submit counter offer: ${err.message}`);
    } finally {
      setIsSubmittingCounter(false);
    }
  };

  // Metrics
  const pendingCount = offers.filter((o) => o.status === 'PENDING').length;
  const acceptedCount = offers.filter((o) => o.status === 'ACCEPTED').length;
  const totalValue = offers.reduce((acc, o) => acc + (o.status === 'ACCEPTED' ? o.total_value : 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Farmer-Side Buyer Offers & Negotiations"
        subtitle="Review inbound procurement offers from verified corporate buyers, supermarket chains, and food processors."
        action={
          <Button variant="outline-primary" icon={RefreshCw} onClick={fetchOffers}>
            Refresh
          </Button>
        }
      />

      {/* 2. Feedback Alert */}
      {actionFeedback && (
        <div
          style={{
            backgroundColor: actionFeedback.type === 'success' ? '#ecfdf5' : '#f0f9ff',
            border: `1px solid ${actionFeedback.type === 'success' ? '#6ee7b7' : '#bae6fd'}`,
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: actionFeedback.type === 'success' ? '#065f46' : '#0369a1',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} />
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. Quick Stats */}
      <div className="three-col-grid">
        <StatCard
          label="Pending Review"
          value={`${pendingCount} Offers`}
          helper="Action required within 48h"
          icon={Clock}
          iconColor="var(--accent-amber)"
          iconBg="var(--accent-amber-light)"
        />
        <StatCard
          label="Accepted Contracts"
          value={`${acceptedCount} Contracts`}
          helper="Fulfillment via Escrow & Orders"
          icon={CheckCircle2}
          iconColor="var(--status-success-text)"
          iconBg="var(--status-success-bg)"
        />
        <StatCard
          label="Secured Revenue"
          value={`₹${totalValue.toLocaleString('en-IN')}`}
          helper="Across accepted buyer bids"
          icon={IndianRupee}
          iconColor="var(--primary-700)"
          iconBg="var(--primary-50)"
        />
      </div>

      {/* 4. Filter Status Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        {STATUS_TABS.map((st) => (
          <button
            key={st}
            onClick={() => setActiveStatus(st)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeStatus === st ? 'var(--primary-50)' : 'transparent',
              color: activeStatus === st ? 'var(--primary-800)' : 'var(--slate-600)',
              fontWeight: activeStatus === st ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            {st}
          </button>
        ))}
      </div>

      {/* 5. Loading State */}
      {isLoading && (
        <LoadingState message="Loading inbound buyer offers..." />
      )}

      {/* 6. Offers List */}
      {!isLoading && offers.length === 0 && (
        <EmptyState
          icon={Tag}
          title="No Offers in this View"
          description="Buyers discovering your active produce lots will submit direct procurement bids here."
          action={
            <Button variant="primary" onClick={() => onNavigate('my-lots')}>
              View My Produce Lots
            </Button>
          }
        />
      )}

      {!isLoading && offers.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {offers.map((offer) => {
            const isPending = offer.status === 'PENDING';
            const isCountered = offer.status === 'COUNTERED';
            const isAccepted = offer.status === 'ACCEPTED';
            const isRejected = offer.status === 'REJECTED';

            return (
              <div
                key={offer.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: isAccepted ? '2px solid #10b981' : isPending ? '1px solid var(--primary-600)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '22px 26px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: isPending ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Building2 size={16} color="var(--primary-700)" />
                      <strong style={{ fontSize: '1.1rem', color: 'var(--slate-900)' }}>
                        {offer.buyer_name}
                      </strong>
                      <Badge variant="success">✓ Verified Buyer</Badge>
                      <Badge
                        variant={
                          isAccepted
                            ? 'success'
                            : isCountered
                            ? 'warning'
                            : isRejected
                            ? 'danger'
                            : 'info'
                        }
                      >
                        {offer.status}
                      </Badge>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
                      Target Lot: <strong>{offer.lot_crop}</strong> ({offer.lot_variety}) • Expected Asking Rate: ₹{offer.lot_expected_price}/{offer.unit}
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-800)' }}>
                      ₹{offer.offer_price.toFixed(2)}
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--slate-500)' }}>
                        /{offer.unit}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--slate-600)' }}>
                      Total Contract: <strong>₹{offer.total_value.toLocaleString('en-IN')}</strong> ({offer.quantity} {offer.unit})
                    </div>
                  </div>
                </div>

                {/* Message Box */}
                {offer.message && (
                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 16px',
                      fontSize: '0.88rem',
                      color: 'var(--slate-700)',
                      lineHeight: 1.4,
                      borderLeft: '3px solid var(--primary-600)',
                    }}
                  >
                    <strong>Buyer Note:</strong> {offer.message}
                  </div>
                )}

                {/* Counter Offer Feedback if already countered */}
                {offer.counter_price && (
                  <div
                    style={{
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 16px',
                      fontSize: '0.88rem',
                      color: '#92400e',
                    }}
                  >
                    <strong>Your Submitted Counter-Offer:</strong> ₹{offer.counter_price}/{offer.unit}
                    {offer.counter_message && <div><em>"{offer.counter_message}"</em></div>}
                  </div>
                )}

                {/* Footer Logistics and Actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', display: 'flex', gap: '16px' }}>
                    <span>🗓 Proposed Delivery: <strong>{offer.delivery_date}</strong></span>
                    <span>📍 Farm-Gate Pickup</span>
                  </div>

                  {/* Actions for Pending / Countered */}
                  {(isPending || isCountered) && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        variant="outline-primary"
                        onClick={() => handleRejectOffer(offer)}
                      >
                        Decline
                      </Button>
                      <Button
                        variant="outline-primary"
                        onClick={() => handleOpenCounter(offer)}
                      >
                        Counter Offer
                      </Button>
                      <Button
                        variant="primary"
                        icon={CheckCircle2}
                        onClick={() => handleOpenAccept(offer)}
                      >
                        Accept Offer
                      </Button>
                    </div>
                  )}

                  {isAccepted && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge variant="success">Contract Signed</Badge>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => onNavigate('transactions')}
                      >
                        View in Transactions
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 7. Accept Confirmation Modal */}
      <Modal
        isOpen={acceptModalOpen}
        onClose={() => setAcceptModalOpen(false)}
        title="Accept Buyer Procurement Offer"
        footer={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="outline-primary" onClick={() => setAcceptModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmAccept} disabled={isAccepting}>
              {isAccepting ? 'Confirming...' : 'Confirm & Sign Trade'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem', color: 'var(--slate-700)' }}>
          <p>
            You are accepting the procurement offer from <strong>{activeOffer?.buyer_name}</strong> for{' '}
            <strong>
              {activeOffer?.quantity} {activeOffer?.unit} of {activeOffer?.lot_crop}
            </strong>{' '}
            at <strong>₹{activeOffer?.offer_price}/{activeOffer?.unit}</strong>.
          </p>

          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '14px' }}>
            <div style={{ fontWeight: 700, color: '#166534', marginBottom: '4px' }}>
              Total Gross Contract Value: ₹{activeOffer?.total_value.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#15803d' }}>
              Upon acceptance, this crop lot will be marked <strong>RESERVED</strong>. Formal digital trade agreement and 20% advance escrow deposit will be initialized in the Transactions portal.
            </div>
          </div>
        </div>
      </Modal>

      {/* 8. Counter-Offer Modal */}
      <Modal
        isOpen={counterModalOpen}
        onClose={() => setCounterModalOpen(false)}
        title={`Submit Counter-Offer to ${activeOffer?.buyer_name || 'Buyer'}`}
        footer={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="outline-primary" onClick={() => setCounterModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmCounter}
              disabled={isSubmittingCounter || !counterPrice}
            >
              {isSubmittingCounter ? 'Submitting...' : 'Send Counter Offer'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleConfirmCounter} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
            Original Buyer Offer: <strong>₹{activeOffer?.offer_price}/{activeOffer?.unit}</strong> for{' '}
            {activeOffer?.quantity} {activeOffer?.unit}.
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
              Your Proposed Counter Rate (₹/{activeOffer?.unit})
            </label>
            <Input
              type="number"
              step="0.10"
              value={counterPrice}
              onChange={(e) => setCounterPrice(e.target.value)}
              placeholder="e.g. 26.50"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
              Message / Quality Justification to Buyer
            </label>
            <Textarea
              value={counterMessage}
              onChange={(e) => setCounterMessage(e.target.value)}
              rows={3}
              placeholder="e.g. Produce is Grade A export certified with zero pesticide residue..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BuyerOffersPage;
