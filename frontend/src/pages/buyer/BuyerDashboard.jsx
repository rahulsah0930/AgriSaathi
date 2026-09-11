import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, StatusBadge, Input, Select, Modal } from '../../components/common';
import {
  ShoppingCart,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Calendar,
  Phone,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  UserCheck,
  Eye,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  ChevronRight,
  BarChart3,
  Award,
  FileText,
  CheckCircle,
  ExternalLink,
  QrCode,
  Download,
  Building,
  Briefcase
} from 'lucide-react';
import { api, getImageUrl } from '../../services/api';

export const CROP_FALLBACK_IMAGES = {
  maize: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop',
  corn: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop',
  mango: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop',
  pomegranate: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop',
  wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop',
  onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop',
  grapes: 'https://images.unsplash.com/photo-1596363505729-4190a9506133?w=600&auto=format&fit=crop',
  grape: 'https://images.unsplash.com/photo-1596363505729-4190a9506133?w=600&auto=format&fit=crop',
  chilli: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop',
  chili: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop',
  turmeric: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&auto=format&fit=crop',
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop',
  soybean: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop',
  cotton: 'https://images.unsplash.com/photo-1594488518001-09419ebc5740?w=600&auto=format&fit=crop',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop',
  rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop',
  paddy: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop',
  sugarcane: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=600&auto=format&fit=crop',
};

export const getCropImage = (cropName, customUrl) => {
  const normCrop = (cropName || '').toLowerCase().trim();
  const fallback = CROP_FALLBACK_IMAGES[normCrop] ||
    Object.entries(CROP_FALLBACK_IMAGES).find(([k]) => normCrop.includes(k))?.[1] ||
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop';

  if (!customUrl) return fallback;

  const lowerUrl = customUrl.toLowerCase();
  // Prevent tomato fallback images or default lot placeholders on non-tomato crops
  if (!normCrop.includes('tomato') && (lowerUrl.includes('tomato') || lowerUrl.includes('default_lot'))) {
    return fallback;
  }

  // Check if it's an external URL or backend upload path
  if (customUrl.startsWith('http://') || customUrl.startsWith('https://')) {
    return customUrl;
  }

  const resolved = getImageUrl(customUrl);
  return resolved || fallback;
};

export const BuyerDashboard = ({ user, onNavigate, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'marketplace' | 'my-orders' | 'negotiations' | 'profile'
  const [lots, setLots] = useState([]);
  const [orders, setOrders] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');

  // Modal states
  const [selectedLot, setSelectedLot] = useState(null);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerQty, setOfferQty] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);

  // Lot Details & Photos Modal
  const [detailModalLot, setDetailModalLot] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Contact Seller Modal
  const [contactModalLot, setContactModalLot] = useState(null);

  // Negotiation Modal
  const [selectedNegotiation, setSelectedNegotiation] = useState(null);
  const [counterInputPrice, setCounterInputPrice] = useState('');
  const [counterInputMsg, setCounterInputMsg] = useState('');

  // Escrow Payment Modal
  const [escrowModalTxn, setEscrowModalTxn] = useState(null);
  const [payingEscrow, setPayingEscrow] = useState(false);

  // Government Verification Certificate Modal
  const [govCertModalOpen, setGovCertModalOpen] = useState(false);

  // Banner message
  const [banner, setBanner] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lotsRes, txnsRes, offersRes] = await Promise.all([
        api.get('/api/lots'),
        api.get(`/api/transactions?user_id=${user?.id || 8}&role=BUYER`),
        api.get(`/api/offers?buyer_id=${user?.id || 8}`)
      ]);

      if (lotsRes && (lotsRes.lots || lotsRes.crop_lots)) {
        setLots(lotsRes.lots || lotsRes.crop_lots);
      }
      if (txnsRes && txnsRes.transactions) setOrders(txnsRes.transactions);
      if (offersRes && offersRes.offers) setMyOffers(offersRes.offers);
    } catch (err) {
      console.error('[BuyerDashboard Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handleOpenOfferModal = (lot) => {
    setSelectedLot(lot);
    setOfferPrice(lot.expected_price.toString());
    setOfferQty(lot.quantity.toString());
    setOfferMessage(`Procurement offer for ${lot.quantity} ${lot.unit} of ${lot.crop} (${lot.variety}).`);
    setOfferModalOpen(true);
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!selectedLot || !offerPrice || !offerQty) return;

    setSubmittingOffer(true);
    try {
      const res = await api.post('/api/offers', {
        crop_lot_id: selectedLot.id,
        buyer_id: user?.id || 8,
        offer_price: parseFloat(offerPrice),
        quantity: parseFloat(offerQty),
        message: offerMessage,
      });

      if (res.success) {
        setBanner({ type: 'success', message: 'Procurement offer submitted directly to seller.' });
        setOfferModalOpen(false);
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to submit offer');
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleAcceptDeal = async (offerId) => {
    try {
      const res = await api.post(`/api/offers/${offerId}/accept`, {
        actor_role: 'BUYER',
        actor_id: user?.id || 8,
      });
      if (res.success) {
        setBanner({ type: 'success', message: res.message });
        setSelectedNegotiation(null);
        loadData();
        setActiveTab('my-orders');
      }
    } catch (err) {
      alert(err.message || 'Failed to accept deal');
    }
  };

  const handleSendCounter = async (e) => {
    e.preventDefault();
    if (!selectedNegotiation || !counterInputPrice) return;

    try {
      const res = await api.post(`/api/offers/${selectedNegotiation.id}/counter`, {
        counter_price: parseFloat(counterInputPrice),
        counter_message: counterInputMsg,
        actor_role: 'BUYER',
        actor_id: user?.id || 8,
      });
      if (res.success) {
        setBanner({ type: 'success', message: `Counter-offer of ₹${counterInputPrice} sent to seller!` });
        setSelectedNegotiation(null);
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to submit counter');
    }
  };

  const handleDepositEscrow = async (txn) => {
    setPayingEscrow(true);
    try {
      const res = await api.post('/api/payments/pay-advance', {
        transaction_id: txn.id,
        payment_method: 'UPI_SIMULATED',
      });
      if (res.success) {
        setBanner({ type: 'success', message: res.message });
        setEscrowModalTxn(null);
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Payment simulation failed');
    } finally {
      setPayingEscrow(false);
    }
  };

  const handleConfirmDelivery = async (txnId) => {
    if (!window.confirm('Confirm that produce has been physically received and inspected at your delivery hub? This will release the final payment.')) return;

    try {
      const res = await api.post(`/api/transactions/${txnId}/status`, {
        status: 'BUYER_CONFIRMED',
      });
      if (res.success) {
        setBanner({ type: 'success', message: 'Delivery confirmed! Escrow funds released to the seller.' });
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Delivery confirmation failed');
    }
  };

  // Filter lots
  const filteredLots = lots.filter((lot) => {
    const matchesSearch =
      lot.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.seller_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.district.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCrop = selectedCrop === 'ALL' || lot.crop.toUpperCase() === selectedCrop.toUpperCase();
    const matchesDistrict = selectedDistrict === 'ALL' || lot.district.toUpperCase() === selectedDistrict.toUpperCase();

    return matchesSearch && matchesCrop && matchesDistrict;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          color: '#ffffff',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <ShoppingCart size={24} color="#93c5fd" />
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>Wholesale Buyer Portal</h1>
              <button
                type="button"
                onClick={() => setGovCertModalOpen(true)}
                style={{
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  border: '1px solid #34d399',
                  transition: 'all 0.2s ease',
                }}
                title="Click to view Official Government MSAMB Accreditation Certificate"
              >
                <ShieldCheck size={15} color="#a7f3d0" />
                <span>Govt Verified Buyer</span>
                <ExternalLink size={12} color="#a7f3d0" />
              </button>
            </div>
            <p style={{ color: '#bfdbfe', margin: 0, fontSize: '0.9rem' }}>
              {user?.profile?.company_name || user?.name || 'Mahalaxmi Agro Wholesale & Retail Pvt. Ltd.'} • GSTIN: {user?.profile?.gst_number || '27AAACM1234F1Z5'} • MSAMB Direct Purchase Exemption #MH-8842
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                padding: '8px 14px',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#93c5fd' }}>Verified Lots</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{lots.length}</div>
            </div>
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                padding: '8px 14px',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#93c5fd' }}>Active Contracts</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{orders.length}</div>
            </div>
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                padding: '8px 14px',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#93c5fd' }}>In Negotiations</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{myOffers.length}</div>
            </div>
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
                    height: '100%',
                    padding: '8px 14px',
                  }}
                >
                  Exit / Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {banner && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: banner.type === 'success' ? '#f0fdf4' : '#eff6ff',
            border: `1px solid ${banner.type === 'success' ? '#bbf7d0' : '#bfdbfe'}`,
            color: banner.type === 'success' ? '#166534' : '#1e40af',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{banner.message}</span>
          <button
            onClick={() => setBanner(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            ×
          </button>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid var(--border-color)',
          marginBottom: '20px',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'dashboard' ? '3px solid var(--primary-700)' : '3px solid transparent',
            color: activeTab === 'dashboard' ? 'var(--primary-800)' : 'var(--slate-600)',
            fontWeight: activeTab === 'dashboard' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <BarChart3 size={18} />
          <span>Buyer Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('marketplace')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'marketplace' ? '3px solid var(--primary-700)' : '3px solid transparent',
            color: activeTab === 'marketplace' ? 'var(--primary-800)' : 'var(--slate-600)',
            fontWeight: activeTab === 'marketplace' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <ShoppingCart size={18} />
          <span>Verified Marketplace ({filteredLots.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my-orders')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'my-orders' ? '3px solid var(--primary-700)' : '3px solid transparent',
            color: activeTab === 'my-orders' ? 'var(--primary-800)' : 'var(--slate-600)',
            fontWeight: activeTab === 'my-orders' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <Package size={18} />
          <span>Contracts & Escrow Orders ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('negotiations')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'negotiations' ? '3px solid var(--primary-700)' : '3px solid transparent',
            color: activeTab === 'negotiations' ? 'var(--primary-800)' : 'var(--slate-600)',
            fontWeight: activeTab === 'negotiations' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <MessageSquare size={18} />
          <span>Live Negotiations ({myOffers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'profile' ? '3px solid var(--primary-700)' : '3px solid transparent',
            color: activeTab === 'profile' ? 'var(--primary-800)' : 'var(--slate-600)',
            fontWeight: activeTab === 'profile' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <Building2 size={18} />
          <span>Buyer Profile</span>
          <span style={{ backgroundColor: '#10b981', color: '#fff', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
            Govt Verified
          </span>
        </button>
      </div>

      {/* TAB 0: BUYER DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Government Verified Institutional Status Ribbon */}
          <div
            style={{
              background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
              borderRadius: 'var(--radius-md)',
              padding: '18px 24px',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: '0 4px 12px rgba(6, 78, 59, 0.15)',
              border: '1px solid #10b981',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: '2px solid #a7f3d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Award size={26} color="#fef08a" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff' }}>
                    Government of Maharashtra — MSAMB Accredited Wholesale Buyer
                  </span>
                  <span style={{ backgroundColor: '#fef08a', color: '#854d0e', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>
                    ACTIVE & LICENSED
                  </span>
                </div>
                <div style={{ fontSize: '0.825rem', color: '#d1fae5', marginTop: '3px' }}>
                  License #<strong>MSAMB/BUYER/DIRECT/2024/MH-8842</strong> • Direct APMC Section 30A Farmgate Purchase Exemption • 100% State Escrow Guarantee
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setGovCertModalOpen(true)}
              style={{
                backgroundColor: '#ffffff',
                color: '#065f46',
                fontWeight: 700,
                border: 'none',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FileText size={15} />
              <span>View Accreditation Certificate</span>
            </Button>
          </div>

          {/* 4 Core Procurement KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <Card style={{ padding: '18px', borderLeft: '4px solid #16a34a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Total Procurement Volume
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '4px' }}>
                    52.4 MT
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <TrendingUp size={13} />
                    <span>+14.2% direct sourcing vs last month</span>
                  </div>
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={22} color="#16a34a" />
                </div>
              </div>
            </Card>

            <Card style={{ padding: '18px', borderLeft: '4px solid #2563eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Active Escrow Pool
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1d4ed8', marginTop: '4px' }}>
                    ₹8,45,000
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-600)', marginTop: '4px' }}>
                    🔒 State Bank of India Institutional Escrow
                  </div>
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={22} color="#2563eb" />
                </div>
              </div>
            </Card>

            <Card style={{ padding: '18px', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Active Procurement Orders
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '4px' }}>
                    {orders.length} Contracts
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600, marginTop: '4px' }}>
                    In transit / Farmgate Weighment
                  </div>
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={22} color="#f59e0b" />
                </div>
              </div>
            </Card>

            <Card style={{ padding: '18px', borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Verified Supplier Network
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '4px' }}>
                    18 FPOs / 142
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600, marginTop: '4px' }}>
                    Nashik, Pune, Solapur & Ahmednagar
                  </div>
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={22} color="#8b5cf6" />
                </div>
              </div>
            </Card>
          </div>

          {/* Sourcing Funnel Pipeline */}
          <Card style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--slate-900)' }}>
                  Procurement Pipeline & Sourcing Workflow
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)', margin: '2px 0 0' }}>
                  Real-time tracking of agricultural procurement from farm gate verification to depot settlement
                </p>
              </div>
              <Badge variant="info">Live Sync</Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div
                onClick={() => setActiveTab('marketplace')}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Stage 1: Farm Lots
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '4px' }}>
                  {lots.length} Available
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary-700)', marginTop: '4px', fontWeight: 600 }}>
                  Browse Marketplace →
                </div>
              </div>

              <div
                onClick={() => setActiveTab('negotiations')}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Stage 2: Live Bids
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '4px' }}>
                  {myOffers.length} Active Offers
                </div>
                <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '4px', fontWeight: 600 }}>
                  View Negotiations →
                </div>
              </div>

              <div
                onClick={() => setActiveTab('my-orders')}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Stage 3: Escrow Locked
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '4px' }}>
                  {orders.length} Contracts
                </div>
                <div style={{ fontSize: '0.75rem', color: '#1d4ed8', marginTop: '4px', fontWeight: 600 }}>
                  Track Escrows →
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '14px',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 600, textTransform: 'uppercase' }}>
                  Stage 4: Settled & Delivered
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
                  24 Lots Settled
                </div>
                <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '4px', fontWeight: 600 }}>
                  ✓ Instant Payouts Released
                </div>
              </div>
            </div>
          </Card>

          {/* Commodity Procurement & Mandi Benchmark Comparison */}
          <Card style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--slate-900)' }}>
                  Commodity Procurement Watch & APMC Mandi Benchmark
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)', margin: '2px 0 0' }}>
                  Direct farmgate acquisition rates compared with Maharashtra APMC official modal market prices
                </p>
              </div>
              <Badge variant="success">Govt APMC Benchmark Linked</Badge>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--slate-500)' }}>
                    <th style={{ padding: '10px 8px', fontWeight: 600 }}>Crop / Commodity</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600 }}>Sourced Volume</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600 }}>Avg. Buyer Rate</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600 }}>APMC Mandi Modal</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600 }}>Direct Sourcing Advantage</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600 }}>Quality Standard</th>
                    <th style={{ padding: '10px 8px', fontWeight: 600 }}>Procurement Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { crop: 'Maize (Sweet Corn / Hybrid)', icon: '🌽', vol: '14.5 MT', buyerPrice: '₹24.5 - ₹30/kg', mandiPrice: '₹32.0/kg', diff: '8 - 12% Cost Savings', grade: 'Grade A (Moisture < 12%)', status: 'Active Procurement' },
                    { crop: 'Mango (Hybrid / Alphonso)', icon: '🥭', vol: '6.2 MT', buyerPrice: '₹15 - ₹18/kg', mandiPrice: '₹22.5/kg', diff: 'Direct Farmgate Fresh', grade: 'Grade A (Visual Score 92%)', status: 'Peak Harvest' },
                    { crop: 'Pomegranate (Bhagwa)', icon: '🍎', vol: '8.4 MT', buyerPrice: '₹120 - ₹128/kg', mandiPrice: '₹140.0/kg', diff: 'Export Quality Selection', grade: 'Export Grade (>250g)', status: 'High Sourcing Demand' },
                    { crop: 'Onion (Red Nashik)', icon: '🧅', vol: '12.0 MT', buyerPrice: '₹28.0/kg', mandiPrice: '₹34.5/kg', diff: '14% Direct Margin', grade: 'Grade A (55mm+)', status: 'Active Bulk Sourcing' },
                    { crop: 'Wheat (Lok-1 / Sharbati)', icon: '🌾', vol: '7.8 MT', buyerPrice: '₹32.5/kg', mandiPrice: '₹36.0/kg', diff: 'Direct FPO Aggregated', grade: 'Grade A (Clean Sharbati)', status: 'Steady Demand' },
                    { crop: 'Tomato (Hybrid Cherry)', icon: '🍅', vol: '3.5 MT', buyerPrice: '₹26 - ₹28/kg', mandiPrice: '₹33.0/kg', diff: 'Farm Cold-Chain Direct', grade: 'Grade A (AI Passed 96%)', status: 'Active Daily Dispatch' },
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 700, color: 'var(--slate-900)' }}>
                        <span style={{ marginRight: '6px' }}>{row.icon}</span>
                        {row.crop}
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--slate-700)', fontWeight: 600 }}>{row.vol}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 700, color: '#15803d' }}>{row.buyerPrice}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--slate-500)' }}>{row.mandiPrice}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                          {row.diff}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--slate-600)', fontSize: '0.8rem' }}>{row.grade}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0284c7', fontSize: '0.78rem', fontWeight: 600 }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0284c7' }}></span>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Quick Action Procurement Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            <Card
              onClick={() => setActiveTab('marketplace')}
              style={{
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShoppingCart size={24} color="#16a34a" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '1rem' }}>Browse Verified Lots</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                  Inspect AI-quality checked produce and place direct bids
                </div>
              </div>
              <ChevronRight size={18} color="var(--slate-400)" />
            </Card>

            <Card
              onClick={() => setActiveTab('my-orders')}
              style={{
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Package size={24} color="#2563eb" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '1rem' }}>Escrow Orders & Transit</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                  Manage advances, physical delivery confirmation and payouts
                </div>
              </div>
              <ChevronRight size={18} color="var(--slate-400)" />
            </Card>

            <Card
              onClick={() => setActiveTab('profile')}
              style={{
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building2 size={24} color="#059669" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '1rem' }}>Buyer Profile & Verification</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                  View MSAMB license, GSTIN credentials & escrow vault
                </div>
              </div>
              <ChevronRight size={18} color="var(--slate-400)" />
            </Card>
          </div>
        </div>
      )}

      {/* TAB 1: VERIFIED MARKETPLACE */}
      {activeTab === 'marketplace' && (
        <div>
          {/* Search & Filter Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr',
              gap: '12px',
              marginBottom: '20px',
              backgroundColor: '#ffffff',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ position: 'relative' }}>
              <Input
                placeholder="Search crops, varieties, sellers, or districts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px' }}
              />
              <Search
                size={16}
                color="var(--slate-400)"
                style={{ position: 'absolute', left: '10px', top: '12px' }}
              />
            </div>

            <Select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Crops' },
                { value: 'MAIZE', label: 'Maize / Corn' },
                { value: 'MANGO', label: 'Mango' },
                { value: 'POMEGRANATE', label: 'Pomegranate' },
                { value: 'ONION', label: 'Onion' },
                { value: 'GRAPES', label: 'Grapes' },
                { value: 'WHEAT', label: 'Wheat' },
                { value: 'TOMATO', label: 'Tomato' },
                { value: 'CHILLI', label: 'Chilli' },
                { value: 'TURMERIC', label: 'Turmeric' },
              ]}
            />

            <Select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Maharashtra Districts' },
                { value: 'NASHIK', label: 'Nashik' },
                { value: 'PUNE', label: 'Pune' },
                { value: 'SOLAPUR', label: 'Solapur' },
                { value: 'AHMEDNAGAR', label: 'Ahmednagar' },
              ]}
            />
          </div>

          {/* Produce Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {filteredLots.map((lot) => {
              const qReport = lot.quality_report;
              const aiStatus = qReport?.ai_verification_status || 'PASSED';
              const aiScore = qReport?.ai_score ? Math.round(qReport.ai_score * 100) : 92;

              return (
                <Card key={lot.id} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {/* Produce Image Header */}
                  <div
                    onClick={() => {
                      setDetailModalLot(lot);
                      setActivePhotoIdx(0);
                    }}
                    style={{ position: 'relative', height: '170px', backgroundColor: '#e2e8f0', cursor: 'pointer' }}
                    title="Click to view full photos and details"
                  >
                    <img
                      src={getCropImage(lot.crop, lot.image_url)}
                      alt={lot.crop}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getCropImage(lot.crop);
                      }}
                    />
                    <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <Badge variant="neutral">{lot.quality_grade || 'Grade A'}</Badge>
                      <Badge variant={lot.seller_type === 'FPO' ? 'info' : 'success'}>
                        {lot.seller_type === 'FPO' ? 'FPO Aggregated' : 'Verified Farmer'}
                      </Badge>
                      {(lot.is_new || lot.id > 4) && (
                        <span
                          style={{
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            border: '1px solid #fde68a',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          }}
                        >
                          ✨ Newly Added
                        </span>
                      )}
                    </div>

                    {lot.images && lot.images.length > 1 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          backgroundColor: 'rgba(15, 23, 42, 0.75)',
                          backdropFilter: 'blur(2px)',
                          color: '#ffffff',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>📷 {lot.images.length} Photos</span>
                      </div>
                    )}

                    {/* AI Visual Quality Verification Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '10px',
                        backgroundColor: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(4px)',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <Sparkles size={12} color="#34d399" />
                      <span>AI Visual Check: {aiStatus} ({aiScore}%)</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3
                          onClick={() => {
                            setDetailModalLot(lot);
                            setActivePhotoIdx(0);
                          }}
                          style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--slate-900)', cursor: 'pointer' }}
                        >
                          {lot.crop} ({lot.variety})
                        </h3>
                        <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <MapPin size={12} />
                          <span>{lot.address || lot.location}, {lot.district}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                          ₹{lot.expected_price}/{lot.unit}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>Expected Rate</span>
                      </div>
                    </div>

                    {/* Lot Details Bar */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        backgroundColor: 'var(--slate-50)',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div>
                        <span style={{ color: 'var(--slate-500)' }}>Available: </span>
                        <strong>{lot.quantity} {lot.unit}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--slate-500)' }}>Harvested: </span>
                        <strong>{lot.harvest_date}</strong>
                      </div>
                    </div>

                    {/* Seller Identity Row */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--border-color)',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-800)' }}>
                          {lot.seller_name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--success-700)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <ShieldCheck size={12} />
                          <span>Government 7/12 Land Record Verified</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setContactModalLot(lot)}
                        style={{
                          background: 'none',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          color: 'var(--primary-700)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Phone size={12} />
                        <span>Contact</span>
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', gap: '8px' }}>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          setDetailModalLot(lot);
                          setActivePhotoIdx(0);
                        }}
                        style={{ flex: 1, padding: '8px 10px', fontSize: '0.82rem' }}
                      >
                        <Eye size={14} style={{ marginRight: '4px' }} />
                        Photos ({lot.images?.length || (lot.image_url ? 1 : 0)})
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenOfferModal(lot)}
                        style={{ flex: 1.2, padding: '8px 10px', fontSize: '0.82rem' }}
                      >
                        Submit Offer
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CONTRACTS & ESCROW ORDERS */}
      {activeTab === 'my-orders' && (
        <div>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Active Procurement Contracts</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
              Protected by <strong>Maharashtra State Agritech Escrow Vault</strong>
            </div>
          </div>

          {orders.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '40px' }}>
              <Package size={40} color="var(--slate-400)" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--slate-600)' }}>No active contracts found. Browse the marketplace and make an offer to start procurement.</p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {orders.map((order) => {
                const advancePct = order.advance_percentage || 20;
                const isAdvancePaid = order.status !== 'ADVANCE_PENDING';
                const canConfirmDelivery = order.status === 'IN_TRANSIT' || order.status === 'DELIVERED';

                return (
                  <Card key={order.id} style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--slate-900)' }}>
                            {order.crop} ({order.variety}) — {order.quantity} {order.unit}
                          </h3>
                          <Badge variant={order.status === 'COMPLETED' ? 'success' : 'info'}>
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', marginTop: '4px' }}>
                          Contract Ref: <strong>{order.transaction_ref}</strong> • Seller: <strong>{order.seller_name}</strong>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                          ₹{order.total_amount?.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--slate-600)' }}>
                          Agreed Rate: ₹{order.agreed_price_per_unit}/{order.unit}
                        </div>
                      </div>
                    </div>

                    {/* Escrow Progress Bar */}
                    <div
                      style={{
                        margin: '14px 0',
                        backgroundColor: 'var(--slate-50)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                          Two-Stage Escrow Protection ({advancePct}% Advance / {100 - advancePct}% Balance)
                        </span>
                        <span style={{ color: isAdvancePaid ? 'var(--success-700)' : 'var(--warning-700)', fontWeight: 600 }}>
                          {isAdvancePaid ? '✓ Advance Secured in Escrow' : '⚠ Advance Payment Pending'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
                        <div style={{ padding: '8px', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                          <span style={{ color: 'var(--slate-500)' }}>Stage 1 (Advance {advancePct}%): </span>
                          <strong>₹{order.advance_amount?.toLocaleString()}</strong>
                          <div style={{ fontSize: '0.72rem', color: isAdvancePaid ? 'var(--success-600)' : 'var(--error-600)' }}>
                            {isAdvancePaid ? 'Secured in Govt Escrow' : 'Action Required'}
                          </div>
                        </div>

                        <div style={{ padding: '8px', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                          <span style={{ color: 'var(--slate-500)' }}>Stage 2 (Balance {100 - advancePct}%): </span>
                          <strong>₹{order.balance_amount?.toLocaleString()}</strong>
                          <div style={{ fontSize: '0.72rem', color: order.status === 'COMPLETED' ? 'var(--success-600)' : 'var(--slate-500)' }}>
                            {order.status === 'COMPLETED' ? 'Settled to Seller' : 'Released upon delivery sign-off'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Locations & Logistics */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem', marginBottom: '12px' }}>
                      <div>
                        <span style={{ color: 'var(--slate-500)' }}>Pickup Farm Gate: </span>
                        <div>{order.pickup_address} ({order.pickup_district})</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--slate-500)' }}>Delivery Destination: </span>
                        <div>{order.delivery_address}</div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {!isAdvancePaid && (
                        <Button
                          variant="primary"
                          onClick={() => setEscrowModalTxn(order)}
                          style={{ fontSize: '0.85rem' }}
                        >
                          Deposit ₹{order.advance_amount?.toLocaleString()} into Govt Escrow
                        </Button>
                      )}

                      {canConfirmDelivery && (
                        <Button
                          variant="success"
                          onClick={() => handleConfirmDelivery(order.id)}
                          style={{ fontSize: '0.85rem' }}
                        >
                          ✓ Confirm Delivery & Release Escrow
                        </Button>
                      )}

                      <Button
                        variant="secondary"
                        onClick={() => onNavigate && onNavigate('transactions')}
                        style={{ fontSize: '0.85rem' }}
                      >
                        View Timeline
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LIVE NEGOTIATIONS */}
      {activeTab === 'negotiations' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Two-Way Offer Negotiation History</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', margin: '4px 0 0' }}>
              Transparent negotiation logs. When both parties agree on a rate, a contract is auto-created.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {myOffers.map((offer) => (
              <Card key={offer.id} style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                        {offer.lot_crop} ({offer.lot_variety}) — {offer.quantity} {offer.unit}
                      </h4>
                      <Badge variant={offer.status === 'ACCEPTED' ? 'success' : (offer.status === 'COUNTERED' ? 'warning' : 'info')}>
                        {offer.status}
                      </Badge>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', marginTop: '3px' }}>
                      Seller: <strong>{offer.seller_name}</strong> • Expected by Seller: ₹{offer.lot_expected_price}/{offer.unit}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-800)' }}>
                      Current Bid: ₹{offer.counter_price || offer.offer_price}/{offer.unit}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                      Total: ₹{((offer.counter_price || offer.offer_price) * offer.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Negotiation trail entries */}
                <div
                  style={{
                    margin: '12px 0',
                    padding: '10px 14px',
                    backgroundColor: 'var(--slate-50)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.825rem',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--slate-700)', marginBottom: '4px' }}>Latest Update:</div>
                  <div>{offer.counter_message || offer.message}</div>
                </div>

                {/* Counter / Accept Action if seller countered */}
                {offer.status === 'COUNTERED' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedNegotiation(offer);
                        setCounterInputPrice(offer.counter_price?.toString() || '');
                        setCounterInputMsg('Buyer revised counter offer.');
                      }}
                    >
                      Counter Again
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAcceptDeal(offer.id)}
                    >
                      ✓ Accept Deal at ₹{offer.counter_price}/{offer.unit}
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BUYER PROFILE & GOVT VERIFICATION */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Main Official Verification Status Card */}
          <Card
            style={{
              padding: '24px',
              border: '2px solid #10b981',
              background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.12)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                    flexShrink: 0,
                  }}
                >
                  <ShieldCheck size={38} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#047857', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                      Government of Maharashtra • MSAMB Accredited
                    </span>
                    <span style={{ backgroundColor: '#10b981', color: '#ffffff', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>
                      ✓ VERIFIED INSTITUTIONAL BUYER
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--slate-900)', margin: '4px 0' }}>
                    Mahalaxmi Agro Wholesale & Retail Pvt. Ltd.
                  </h2>
                  <p style={{ color: 'var(--slate-600)', margin: 0, fontSize: '0.875rem' }}>
                    Direct Farm Gate Agricultural Procurement License • Section 30A Maharashtra APMC Act Authorized
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={() => setGovCertModalOpen(true)}
                style={{
                  backgroundColor: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                }}
              >
                <Award size={16} />
                <span>View Official Government Certificate</span>
              </Button>
            </div>

            {/* Verification Details Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid #d1fae5',
              }}
            >
              <div style={{ backgroundColor: '#ffffff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                  MSAMB License ID
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-900)', marginTop: '2px' }}>
                  MSAMB/BUYER/DIRECT/2024/MH-8842
                </div>
                <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>
                  Valid till: 31-Dec-2028 (Active)
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                  GSTIN (GST Portal Verified)
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-900)', marginTop: '2px' }}>
                  27AAACM1234F1ZS
                </div>
                <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>
                  Status: Active & 3B Compliant
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Central FSSAI License
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-900)', marginTop: '2px' }}>
                  11522036000412
                </div>
                <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>
                  Category: Wholesale & Agri Trade
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Aadhaar / e-KYC Verification
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-900)', marginTop: '2px' }}>
                  UIDAI Verified (XXXX-XXXX-4812)
                </div>
                <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>
                  Authorized Officer Linked
                </div>
              </div>
            </div>
          </Card>

          {/* Company Details & Sourcing Profile */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            <Card style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Building size={20} color="var(--primary-700)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--slate-900)' }}>
                  Corporate Entity & Headquarters
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>
                    Legal Registered Entity Name:
                  </span>
                  <strong style={{ color: 'var(--slate-800)' }}>Mahalaxmi Agro Wholesale & Retail Pvt. Ltd.</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>
                    Corporate Identity Number (CIN):
                  </span>
                  <strong style={{ color: 'var(--slate-800)' }}>U01100MH2019PTC328901</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>
                    Permanent Account Number (PAN):
                  </span>
                  <strong style={{ color: 'var(--slate-800)' }}>AAACM1234F</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>
                    Registered Corporate Address:
                  </span>
                  <span style={{ color: 'var(--slate-700)' }}>
                    Unit 402, APMC Agricultural Trade Tower, Sector 19, Vashi, Navi Mumbai, Maharashtra - 400703
                  </span>
                </div>

                <div>
                  <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>
                    Business Classification:
                  </span>
                  <Badge variant="info">Institutional Bulk Procurements & Food Processing (Class A)</Badge>
                </div>
              </div>
            </Card>

            <Card style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <UserCheck size={20} color="var(--primary-700)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--slate-900)' }}>
                  Authorized Sourcing Representative
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>
                    Primary Sourcing Officer:
                  </span>
                  <strong style={{ color: 'var(--slate-800)' }}>Vikramaditya Shinde</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Head of Direct Sourcing & Farmgate Supply Chain</div>
                </div>

                <div>
                  <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>
                    Official Contact Number:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ color: 'var(--slate-800)' }}>+91 98230 45678</strong>
                    <span style={{ color: '#16a34a', fontSize: '0.72rem', fontWeight: 700 }}>✓ OTP Verified</span>
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>
                    Official Corporate Email:
                  </span>
                  <strong style={{ color: 'var(--slate-800)' }}>procurements@mahalaxmiagro.in</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>
                    Operating Mandis & Procurement Hubs:
                  </span>
                  <span style={{ color: 'var(--slate-700)' }}>
                    Nashik APMC, Pune Market Yard, Pimpalgaon Baswant, Lasalgaon, Solapur APMC, Chhatrapati Sambhajinagar APMC
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Escrow Settlement & Cold Chain Capabilities */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            <Card style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <ShieldCheck size={20} color="#2563eb" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--slate-900)' }}>
                  State Bank Smart Escrow Vault
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--slate-500)' }}>Escrow Custodian:</span>
                  <strong>State Bank of India (Commercial Agri Banking Hub)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--slate-500)' }}>Escrow Virtual Account:</span>
                  <strong>AGRI-ESCROW-2024-0084</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--slate-500)' }}>IFSC Code:</span>
                  <strong>SBIN0004821</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--slate-500)' }}>Settlement Guarantee:</span>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>100% Tripartite Protection</span>
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--slate-600)', lineHeight: '1.4' }}>
                  Smart Escrow ensures 20% advance is deposited into the State Vault before farm dispatch. The remaining 80% is automatically released directly to the farmer/FPO upon digital weighment and AI quality inspection.
                </p>
              </div>
            </Card>

            <Card style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Package size={20} color="#059669" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--slate-900)' }}>
                  Cold Storage & Logistics Infrastructure
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--slate-500)' }}>Controlled Atmosphere (CA) Storage:</span>
                  <strong>2,500 MT Capacity (Vashi & Nashik)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--slate-500)' }}>Reefer Cold Chain Fleet:</span>
                  <strong>14 Temperature-Controlled Trucks</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--slate-500)' }}>Testing & Grading Lab:</span>
                  <strong>NABL Accredited Farm Gate Checkpoints</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--slate-500)' }}>Annual Sourcing Target:</span>
                  <strong>5,000 MT Direct Horticultural Produce</strong>
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--slate-600)', lineHeight: '1.4' }}>
                  Direct procurement helps partner farmers eliminate commission agents, while ensuring fresh harvest reach modern retail and food processing lines within 24 hours of harvest.
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* PRODUCT DETAILS & PHOTOS MODAL */}
      {detailModalLot && (() => {
        const photos = (detailModalLot.images && detailModalLot.images.length > 0)
          ? detailModalLot.images.map((img) => typeof img === 'string' ? img : img.image_url)
          : [detailModalLot.image_url].filter(Boolean);
        const currentPhoto = photos[activePhotoIdx] || photos[0] || detailModalLot.image_url;
        const qReport = detailModalLot.quality_report;
        const aiStatus = qReport?.ai_verification_status || 'PASSED';
        const aiScore = qReport?.ai_score ? Math.round(qReport.ai_score * 100) : 92;

        return (
          <Modal
            isOpen={!!detailModalLot}
            onClose={() => setDetailModalLot(null)}
            title={`${detailModalLot.crop} (${detailModalLot.variety}) — Visual Inspection & Details`}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Main Image */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '280px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                }}
              >
                <img
                  src={getCropImage(detailModalLot.crop, currentPhoto)}
                  alt={`Produce photo ${activePhotoIdx + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    e.currentTarget.src = getCropImage(detailModalLot.crop);
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    color: '#ffffff',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  Photo {activePhotoIdx + 1} of {photos.length || 1}
                </div>
              </div>

              {/* Thumbnails Underneath */}
              {photos.length > 1 && (
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', marginBottom: '6px' }}>
                    Click thumbnail to preview:
                  </div>
                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {photos.map((p, idx) => (
                      <button
                        key={p || idx}
                        type="button"
                        onClick={() => setActivePhotoIdx(idx)}
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: activePhotoIdx === idx ? '2.5px solid #16a34a' : '1.5px solid #cbd5e1',
                          padding: 0,
                          cursor: 'pointer',
                          flexShrink: 0,
                          boxShadow: activePhotoIdx === idx ? '0 0 0 2px rgba(22, 163, 74, 0.25)' : 'none',
                          backgroundColor: '#f8fafc',
                          position: 'relative',
                        }}
                      >
                        <img
                          src={getCropImage(detailModalLot.crop, p)}
                          alt={`Thumbnail ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.currentTarget.src = getCropImage(detailModalLot.crop);
                          }}
                        />
                        {idx === 0 && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '2px',
                              left: '2px',
                              backgroundColor: '#16a34a',
                              color: '#ffffff',
                              fontSize: '0.55rem',
                              padding: '1px 3px',
                              borderRadius: '2px',
                              fontWeight: 700,
                            }}
                          >
                            Main
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Visual Check Banner */}
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '12px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#166534', fontSize: '0.9rem' }}>
                    <Sparkles size={16} color="#16a34a" /> AI Visual Quality Screening: {aiStatus} ({aiScore}%)
                  </span>
                  <Badge variant="success">Audited Photo Evidence</Badge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.8rem', color: '#334155' }}>
                  <div><strong>Grade:</strong> {detailModalLot.quality_grade || 'Grade A'}</div>
                  <div><strong>Freshness:</strong> {detailModalLot.freshness_status || 'FRESH'}</div>
                  <div><strong>Moisture:</strong> {detailModalLot.moisture_percentage || '12'}%</div>
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
                  Disclaimer: AI-assisted visual screening evaluates surface condition, color uniformity, and basic visual defects. It is an advisory aid and not a substitute for statutory AGMARK or official government laboratory quality certification.
                </div>
              </div>

              {/* Key Details Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  backgroundColor: 'var(--slate-50)',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--slate-500)' }}>Available Volume:</span>{' '}
                  <strong>{detailModalLot.quantity} {detailModalLot.unit}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--slate-500)' }}>Expected Rate:</span>{' '}
                  <strong style={{ color: 'var(--primary-700)', fontSize: '1rem' }}>₹{detailModalLot.expected_price}/{detailModalLot.unit}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--slate-500)' }}>Harvest Date:</span>{' '}
                  <strong>{detailModalLot.harvest_date}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--slate-500)' }}>Storage State:</span>{' '}
                  <strong>{detailModalLot.storage_status === 'IN_STORAGE' ? 'Cold Storage' : 'At Farm'}</strong>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--slate-500)' }}>Pickup Location:</span>{' '}
                  <strong>{detailModalLot.address || detailModalLot.location}, {detailModalLot.district}</strong>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--slate-500)' }}>Seller:</span>{' '}
                  <strong>{detailModalLot.seller_name}</strong> ({detailModalLot.seller_type}) • 7/12 Verified
                </div>
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <Button variant="secondary" onClick={() => setDetailModalLot(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    const lotToOffer = detailModalLot;
                    setDetailModalLot(null);
                    handleOpenOfferModal(lotToOffer);
                  }}
                >
                  Submit Firm Offer / Negotiate
                </Button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* MAKE OFFER MODAL */}
      {offerModalOpen && selectedLot && (
        <Modal
          isOpen={offerModalOpen}
          onClose={() => setOfferModalOpen(false)}
          title={`Submit Procurement Offer for ${selectedLot.crop}`}
        >
          <form onSubmit={handleSubmitOffer}>
            <div
              style={{
                backgroundColor: 'var(--slate-50)',
                padding: '10px 12px',
                borderRadius: '6px',
                marginBottom: '14px',
                fontSize: '0.85rem',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              {selectedLot.image_url && (
                <img
                  src={getImageUrl(selectedLot.image_url)}
                  alt={selectedLot.crop}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '6px',
                    objectFit: 'cover',
                    flexShrink: 0,
                    border: '1px solid var(--border-color)',
                  }}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&q=80';
                  }}
                />
              )}
              <div>
                <div><strong>Seller:</strong> {selectedLot.seller_name} ({selectedLot.district})</div>
                <div><strong>Available Quantity:</strong> {selectedLot.quantity} {selectedLot.unit}</div>
                <div><strong>Seller Expected Price:</strong> ₹{selectedLot.expected_price}/{selectedLot.unit}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label={`Offer Price (₹/${selectedLot.unit}) *`}
                type="number"
                step="0.1"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                required
              />
              <Input
                label={`Procurement Quantity (${selectedLot.unit}) *`}
                type="number"
                value={offerQty}
                onChange={(e) => setOfferQty(e.target.value)}
                required
              />
            </div>

            <Input
              label="Message / Delivery Terms to Seller"
              value={offerMessage}
              onChange={(e) => setOfferMessage(e.target.value)}
            />

            <div
              style={{
                backgroundColor: '#eff6ff',
                padding: '10px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#1e40af',
                marginBottom: '16px',
              }}
            >
              <strong>Escrow Protection Notice:</strong> When the seller accepts your offer, an order contract will be created. You will then deposit a 20% advance into Government Escrow to lock the deal.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="secondary" onClick={() => setOfferModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={submittingOffer}>
                Submit Firm Offer
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* COUNTER OFFER MODAL */}
      {selectedNegotiation && (
        <Modal
          isOpen={!!selectedNegotiation}
          onClose={() => setSelectedNegotiation(null)}
          title={`Counter-Offer for ${selectedNegotiation.lot_crop}`}
        >
          <form onSubmit={handleSendCounter}>
            <div style={{ marginBottom: '12px', fontSize: '0.85rem' }}>
              Seller's latest rate: <strong>₹{selectedNegotiation.counter_price}/{selectedNegotiation.unit}</strong>
            </div>

            <Input
              label={`Your Proposed Rate (₹/${selectedNegotiation.unit}) *`}
              type="number"
              step="0.1"
              value={counterInputPrice}
              onChange={(e) => setCounterInputPrice(e.target.value)}
              required
            />

            <Input
              label="Counter-Offer Message"
              value={counterInputMsg}
              onChange={(e) => setCounterInputMsg(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button variant="secondary" onClick={() => setSelectedNegotiation(null)}>Cancel</Button>
              <Button type="submit" variant="primary">Send Counter to Seller</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* CONTACT SELLER MODAL */}
      {contactModalLot && (
        <Modal
          isOpen={!!contactModalLot}
          onClose={() => setContactModalLot(null)}
          title={`Contact ${contactModalLot.seller_name}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} color="var(--primary-700)" />
              <div>
                <strong>Seller Name:</strong> {contactModalLot.seller_name} ({contactModalLot.seller_type})
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={18} color="var(--primary-700)" />
              <div>
                <strong>Verified Contact:</strong> +91 98230 12345 (Direct Farm Gate Line)
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="var(--primary-700)" />
              <div>
                <strong>Collection Address:</strong> {contactModalLot.address || contactModalLot.location}, {contactModalLot.district}
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--slate-50)',
                padding: '10px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: 'var(--slate-600)',
              }}
            >
              🔒 <strong>Privacy Protected:</strong> Direct verified seller coordinates are provided to Government-verified buyers for harvest inspection and transport scheduling. Sensitive bank documents remain masked.
            </div>

            <Button variant="primary" onClick={() => setContactModalLot(null)} style={{ marginTop: '10px' }}>
              Close
            </Button>
          </div>
        </Modal>
      )}

      {/* ESCROW PAYMENT SIMULATION MODAL */}
      {escrowModalTxn && (
        <Modal
          isOpen={!!escrowModalTxn}
          onClose={() => setEscrowModalTxn(null)}
          title="Government Escrow Advance Deposit"
        >
          <div>
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>Contract Reference:</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '8px' }}>
                {escrowModalTxn.transaction_ref}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                <span>Total Value:</span>
                <strong>₹{escrowModalTxn.total_amount?.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, color: 'var(--primary-800)' }}>
                <span>Required Advance (20%):</span>
                <span>₹{escrowModalTxn.advance_amount?.toLocaleString()}</span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '0.825rem',
                color: '#1e40af',
              }}
            >
              <strong>Government Escrow Security:</strong> Funds are locked under the Maharashtra State Agriculture Marketing Board Escrow protocol. The seller cannot withdraw these funds until you inspect and confirm delivery at your depot.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="secondary" onClick={() => setEscrowModalTxn(null)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => handleDepositEscrow(escrowModalTxn)}
                isLoading={payingEscrow}
              >
                Deposit ₹{escrowModalTxn.advance_amount?.toLocaleString()} into Escrow
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* GOVERNMENT ACCREDITATION CERTIFICATE MODAL */}
      {govCertModalOpen && (
        <Modal
          isOpen={govCertModalOpen}
          onClose={() => setGovCertModalOpen(false)}
          title="Government of Maharashtra — Institutional Buyer Accreditation"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Formal Certificate Frame */}
            <div
              style={{
                border: '4px double #047857',
                padding: '24px',
                borderRadius: '8px',
                backgroundColor: '#fbfdfb',
                position: 'relative',
                boxShadow: 'inset 0 0 20px rgba(4, 120, 87, 0.04)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {/* Header */}
              <div
                style={{
                  textAlign: 'center',
                  borderBottom: '2px solid #047857',
                  paddingBottom: '14px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#047857', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                  Government of Maharashtra
                </div>
                <div style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: 600 }}>
                  Department of Cooperation, Marketing & Textiles
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#064e3b', margin: '6px 0 2px', letterSpacing: '0.5px' }}>
                  MAHARASHTRA STATE AGRICULTURAL MARKETING BOARD (MSAMB)
                </h2>
                <div style={{ fontSize: '0.72rem', color: '#047857', fontStyle: 'italic' }}>
                  Directorate of Agricultural Marketing, Central Building, Pune - 411001
                </div>
              </div>

              {/* Certificate Title */}
              <div style={{ textAlign: 'center', margin: '14px 0' }}>
                <span
                  style={{
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #10b981',
                    color: '#065f46',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    padding: '4px 16px',
                    borderRadius: '20px',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    display: 'inline-block',
                  }}
                >
                  Certificate of Direct Farmgate Wholesale Buyer Accreditation
                </span>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                  Registration No: <strong>MSAMB/DIR-BUYER/2024/MH-8842</strong>
                </div>
              </div>

              {/* Legal Text */}
              <div style={{ fontSize: '0.85rem', color: '#1e293b', lineHeight: '1.6', margin: '14px 0' }}>
                This is to officially certify that <strong>MAHALAXMI AGRO WHOLESALE & RETAIL PVT. LTD.</strong> (CIN: U01100MH2019PTC328901, GSTIN: 27AAACM1234F1ZS) is duly registered and verified as a <strong>Class 'A' Institutional Buyer & Direct Processor</strong> under Section 30A of the Maharashtra Agricultural Produce Marketing (Development and Regulation) Act, 1963.
                <br /><br />
                The accredited entity is authorized to undertake direct procurement of horticultural and field crops from Farmers and Farmer Producer Organizations (FPOs) across Maharashtra without mandatory physical APMC market yard intervention, backed by State Escrow settlement protocols.
              </div>

              {/* Certificate Badges Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  backgroundColor: '#ffffff',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #d1fae5',
                  fontSize: '0.78rem',
                  margin: '14px 0',
                }}
              >
                <div>
                  <span style={{ color: '#64748b' }}>Date of Issue: </span>
                  <strong>14-Jan-2024</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Valid Till: </span>
                  <strong>31-Dec-2028</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Verification Hash: </span>
                  <code style={{ fontSize: '0.72rem', color: '#047857' }}>MH-GOV-AGRI-992147-SEC</code>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Escrow Guarantee: </span>
                  <strong style={{ color: '#16a34a' }}>Active & Tripartite</strong>
                </div>
              </div>

              {/* Signature & QR Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', margin: '0 auto 4px', border: '1px dashed #059669', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}>
                    <QrCode size={36} color="#065f46" />
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Scan for Live Verification</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Shri R. V. Kadam</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Joint Director of Agricultural Marketing</div>
                  <div style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 700 }}>Digitally Signed on Behalf of MSAMB Pune</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.print()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} />
                <span>Print / Download</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setGovCertModalOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BuyerDashboard;
