import React, { useState, useEffect, useCallback } from 'react';
import {
  PageHeader,
  Card,
  StatCard,
  Button,
  Badge,
  Input,
  Select,
  Modal,
  LoadingState,
  EmptyState,
} from '../../components/common';
import {
  Users,
  Package,
  PlusCircle,
  IndianRupee,
  Share2,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  MapPin,
  Calendar,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  FileCheck,
  Percent,
  Building2,
  Phone,
  ShieldCheck,
  Check,
  Award,
  Truck,
  Shield,
  HelpCircle,
  BarChart2,
  Sliders,
  Calculator,
  Store,
  CreditCard,
  ArrowUpRight,
  Tag,
} from 'lucide-react';

import api from '../../services/api';

const CROP_OPTIONS = [
  { value: 'Onion', label: 'Onion (कांदा)' },
  { value: 'Tomato', label: 'Tomato (टोमॅटो)' },
  { value: 'Grapes', label: 'Grapes (द्राक्षे)' },
  { value: 'Pomegranate', label: 'Pomegranate (डाळिंब)' },
  { value: 'Soybean', label: 'Soybean (सोयाबीन)' },
  { value: 'Wheat', label: 'Wheat (गहू)' },
  { value: 'Cotton', label: 'Cotton (कापूस)' },
];

const UNIT_OPTIONS = [
  { value: 'quintal', label: 'Quintal (100 kg)' },
  { value: 'tonne', label: 'Metric Tonne (1,000 kg)' },
  { value: 'kg', label: 'Kilogram (kg)' },
];

const QUALITY_OPTIONS = [
  { value: 'Grade A', label: 'Grade A (Export / Supermarket Premium)' },
  { value: 'Grade B', label: 'Grade B (APMC Standard Trade)' },
  { value: 'Grade C', label: 'Grade C (Food Processing / Mash)' },
];

const DISTRICT_OPTIONS = [
  { value: 'Nashik', label: 'Nashik (नाशिक)' },
  { value: 'Pune', label: 'Pune (पुणे)' },
  { value: 'Ahmednagar', label: 'Ahmednagar (अहमदनगर)' },
  { value: 'Solapur', label: 'Solapur (सोलापूर)' },
  { value: 'Latur', label: 'Latur (लातूर)' },
];

export const FPOAggregationPage = ({ user, onNavigate }) => {
  const [fpoLots, setFpoLots] = useState([]);
  const [selectedLotId, setSelectedLotId] = useState(null);
  const [selectedLot, setSelectedLot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLotLoading, setIsLotLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Farmer vs FPO view tabs
  const isFarmer = user?.role !== 'FPO';
  const [activeTab, setActiveTab] = useState(isFarmer ? 'why-join' : 'create-group');
  const [fpoOrgs, setFpoOrgs] = useState([]);
  const [selectedOrgForJoin, setSelectedOrgForJoin] = useState(null);
  const [joinCrop, setJoinCrop] = useState('Tomato');
  const [joinAcres, setJoinAcres] = useState('3.5');
  const [joinPhone, setJoinPhone] = useState(user?.phone || '9823012345');
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const [appliedFpoIds, setAppliedFpoIds] = useState([]);
  const [districtFilter, setDistrictFilter] = useState('ALL');

  // Simulated Buyer Bids on Direct Commercial Lots
  const [directLotOffers, setDirectLotOffers] = useState([
    {
      id: 'B2B-TENDER-881',
      buyer_name: 'Reliance Retail (Fresh Produce Sourcing)',
      buyer_contact: 'procurement.mumbai@reliancefresh.com',
      crop: 'Tomato',
      offered_price: 27.50,
      requested_quantity: 15,
      unit: 'tonne',
      delivery_hub: 'Bhiwandi Central Distribution Center (DC 4)',
      payment_terms: 'GovTech Digital Escrow (T+1 Day after gate inward)',
      status: 'PENDING',
      placed_at: 'Today, 09:30 AM',
    },
    {
      id: 'B2B-TENDER-882',
      buyer_name: 'BigBasket B2B Institutional Supply',
      buyer_contact: 'b2b-supply@bigbasket.com',
      crop: 'Tomato',
      offered_price: 28.00,
      requested_quantity: 15,
      unit: 'tonne',
      delivery_hub: 'Chakan Packhouse Terminal (Pune)',
      payment_terms: 'Direct DBT to FPO Account (T+2 Days)',
      status: 'PENDING',
      placed_at: 'Today, 10:15 AM',
    },
    {
      id: 'B2B-TENDER-883',
      buyer_name: 'ITC Agri Business Division (e-Choupal)',
      buyer_contact: 'echoupal.procurement@itc.in',
      crop: 'Onion',
      offered_price: 31.00,
      requested_quantity: 20,
      unit: 'tonne',
      delivery_hub: 'Lasalgaon Mandi Yard Gate 3',
      payment_terms: 'Instant Bank RTGS on weighbridge dispatch',
      status: 'PENDING',
      placed_at: 'Today, 11:00 AM',
    },
  ]);

  const handleAcceptBuyerOffer = (offerId, buyerName, price, qty, unit, crop) => {
    setDirectLotOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status: 'ACCEPTED' } : o))
    );
    setFeedback({
      type: 'success',
      message: `Commercial Lot Contract Executed! You accepted ${buyerName}'s direct purchase offer of ₹${price}/${unit} for ${qty} ${unit} of ${crop}. Escrow contract initiated under Maharashtra GovTech Framework.`,
    });
  };

  // Scope: FPO sees their own pools/lots by default or can browse all network pools
  const [lotScope, setLotScope] = useState(isFarmer ? 'all-network' : 'my-fpo');

  // Modal: Add Member Contribution
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [memberFarmerName, setMemberFarmerName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberQuantity, setMemberQuantity] = useState('');
  const [memberGrade, setMemberGrade] = useState('Grade A');
  const [memberStatus, setMemberStatus] = useState('PLEDGED');
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Modal: Create New Aggregation Pool
  const [createPoolModalOpen, setCreatePoolModalOpen] = useState(false);
  const [newCrop, setNewCrop] = useState('Onion');
  const [newVariety, setNewVariety] = useState('Red Nashik');
  const [newUnit, setNewUnit] = useState('quintal');
  const [newDistrict, setNewDistrict] = useState('Nashik');
  const [newLocation, setNewLocation] = useState('Pimpalgaon Baswant APMC Packhouse');
  const [newExpectedPrice, setNewExpectedPrice] = useState('2100');
  const [newQualityGrade, setNewQualityGrade] = useState('Grade A');
  const [isCreatingPool, setIsCreatingPool] = useState(false);

  // Modal: Register / Create New FPO in Directory
  const [createFpoModalOpen, setCreateFpoModalOpen] = useState(false);
  const [fpoOrgName, setFpoOrgName] = useState(user?.profile?.fpo_name || user?.name || '');
  const [fpoOrgRegNo, setFpoOrgRegNo] = useState(user?.profile?.registration_number || '');
  const [fpoOrgDistrict, setFpoOrgDistrict] = useState(user?.profile?.district || 'Nashik');
  const [fpoOrgTaluka, setFpoOrgTaluka] = useState('Dindori');
  const [fpoOrgCrops, setFpoOrgCrops] = useState('Tomato, Onion, Soybean, Pomegranate');
  const [fpoOrgContact, setFpoOrgContact] = useState(user?.phone || '9823099999');
  const [fpoOrgMembers, setFpoOrgMembers] = useState(user?.profile?.member_count || '150');
  const [fpoOrgAadhaar, setFpoOrgAadhaar] = useState('');
  const [fpoOrgBenefits, setFpoOrgBenefits] = useState('Direct corporate buyer contracts, 15% seed discount, packhouse sorting & cold storage');
  const [fpoOrgAddress, setFpoOrgAddress] = useState('APMC Market Yard Road, Dindori, Nashik');
  const [isCreatingFpoOrg, setIsCreatingFpoOrg] = useState(false);

  // Modal: Add Direct Commercial Lot (Offline Group Harvest)
  const [directLotModalOpen, setDirectLotModalOpen] = useState(false);
  const [directCrop, setDirectCrop] = useState('Tomato');
  const [directVariety, setDirectVariety] = useState('Abhinav Hybrid');
  const [directQuantity, setDirectQuantity] = useState('15');
  const [directUnit, setDirectUnit] = useState('tonne');
  const [directOfflineFarmers, setDirectOfflineFarmers] = useState('18');
  const [directPrice, setDirectPrice] = useState('25');
  const [directQualityGrade, setDirectQualityGrade] = useState('Grade A');
  const [directDistrict, setDirectDistrict] = useState('Nashik');
  const [directLocation, setDirectLocation] = useState('Pimpalgaon Baswant APMC Packhouse Hub');
  const [directStorageStatus, setDirectStorageStatus] = useState('NOT_STORED');
  const [isSubmittingDirectLot, setIsSubmittingDirectLot] = useState(false);

  // Benchmarking & Comparison State
  const [benchmarks, setBenchmarks] = useState([]);
  const [benchmarkCrop, setBenchmarkCrop] = useState('Tomato (Hybrid)');
  const [simCrop, setSimCrop] = useState('Tomato');
  const [simVolume, setSimVolume] = useState('15');
  const [simFarmerPayout, setSimFarmerPayout] = useState('25.50');
  const [simBuyerPrice, setSimBuyerPrice] = useState('28.50');

  // Fetch FPO lots (scoped by seller_id for FPO or all network)
  const fetchFpoLots = useCallback(async (scope) => {
    const currentScope = scope !== undefined ? scope : lotScope;
    setIsLoading(true);
    setError(null);
    try {
      let url = '/api/fpo/lots';
      if (currentScope === 'my-fpo' && user?.id) {
        url += `?seller_id=${user.id}`;
      }
      const data = await api.get(url);
      const lots = data.lots || [];
      setFpoLots(lots);
      if (lots.length > 0) {
        setSelectedLotId(lots[0].id);
      } else {
        setSelectedLotId(null);
        setSelectedLot(null);
      }
    } catch (err) {
      console.error('Failed to load FPO lots:', err);
      setError(err.message || 'Failed to fetch FPO aggregation pools');
    } finally {
      setIsLoading(false);
    }
  }, [lotScope, user?.id]);

  // Fetch detailed lot with member equity breakdown
  const fetchLotDetail = useCallback(async (lotId) => {
    if (!lotId) return;
    setIsLotLoading(true);
    try {
      const data = await api.get(`/api/fpo/lots/${lotId}`);
      setSelectedLot(data.lot);
    } catch (err) {
      console.error(`Failed to load details for FPO lot #${lotId}:`, err);
    } finally {
      setIsLotLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFpoLots();
  }, [fetchFpoLots]);

  // Fetch FPO benchmarks
  const fetchBenchmarks = useCallback(async () => {
    try {
      const data = await api.get('/api/fpo/benchmarks');
      if (data.benchmarks) {
        setBenchmarks(data.benchmarks);
      }
    } catch (err) {
      console.error('Failed to load FPO benchmarks:', err);
    }
  }, []);

  useEffect(() => {
    fetchBenchmarks();
  }, [fetchBenchmarks]);

  // Fetch FPO organizations
  const fetchFpoOrganizations = useCallback(async () => {
    try {
      const data = await api.get('/api/fpo/organizations');
      if (data.organizations) {
        setFpoOrgs(data.organizations);
      }
    } catch (err) {
      console.error('Failed to load FPO organizations:', err);
    }
  }, []);

  useEffect(() => {
    fetchFpoOrganizations();
  }, [fetchFpoOrganizations]);

  useEffect(() => {
    if (selectedLotId) {
      fetchLotDetail(selectedLotId);
    }
  }, [selectedLotId, fetchLotDetail]);

  // Handle Apply to Join FPO
  const handleApplyJoin = async (e) => {
    e.preventDefault();
    if (!selectedOrgForJoin) return;
    setIsSubmittingJoin(true);
    try {
      const res = await api.post('/api/fpo/join-request', {
        user_id: user?.id || 1,
        farmer_name: user?.profile?.full_name || 'Suresh Patil',
        fpo_name: selectedOrgForJoin.name,
        phone: joinPhone,
        crop: joinCrop,
        district: selectedOrgForJoin.district,
        land_acres: parseFloat(joinAcres) || 2.0,
      });
      if (res.success) {
        setAppliedFpoIds((prev) => [...prev, selectedOrgForJoin.id]);
        setFeedback({
          type: 'success',
          message: res.message || `Application to join ${selectedOrgForJoin.name} submitted successfully!`,
        });
        setSelectedOrgForJoin(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to submit application');
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  // Handle Add Member Submission
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedLotId || !memberFarmerName || !memberQuantity) return;

    setIsAddingMember(true);
    try {
      const payload = {
        farmer_name: memberFarmerName,
        farmer_reference_placeholder: memberPhone ? `TEL-${memberPhone.slice(-4)}` : undefined,
        quantity: parseFloat(memberQuantity),
        unit: selectedLot?.unit || 'quintal',
        quality_grade: memberGrade,
        contribution_status: memberStatus,
      };

      const res = await api.post(`/api/fpo/lots/${selectedLotId}/members`, payload);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Added member contribution of ${memberQuantity} ${selectedLot?.unit} from ${memberFarmerName}!`,
        });
        setAddMemberModalOpen(false);
        setMemberFarmerName('');
        setMemberPhone('');
        setMemberQuantity('');
        // Refresh detail and lots
        fetchLotDetail(selectedLotId);
        fetchFpoLots();
      }
    } catch (err) {
      alert(`Failed to add member contribution: ${err.message}`);
    } finally {
      setIsAddingMember(false);
    }
  };

  // Handle Remove Member
  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName}'s contribution from this pool?`)) {
      return;
    }
    try {
      const res = await api.delete(`/api/fpo/lots/${selectedLotId}/members/${memberId}`);
      if (res.success) {
        setFeedback({
          type: 'info',
          message: `${memberName}'s contribution has been removed. Pool quantity rebalanced.`,
        });
        fetchLotDetail(selectedLotId);
        fetchFpoLots();
      }
    } catch (err) {
      alert(`Failed to remove member: ${err.message}`);
    }
  };

  // Handle Publish Lot to Marketplace
  const handlePublishLot = async () => {
    if (!selectedLotId) return;
    if (!selectedLot?.members || selectedLot.members.length === 0) {
      alert('Cannot publish an empty pool. Please add member farmer contributions first.');
      return;
    }
    if (!window.confirm(`Publish this aggregated lot of ${selectedLot.quantity} ${selectedLot.unit} to the public buyer marketplace?`)) {
      return;
    }

    try {
      const res = await api.post(`/api/fpo/lots/${selectedLotId}/publish`);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `FPO Lot #${selectedLotId} is now LIVE on the marketplace! Inbound buyer bids will be received under Buyer Offers.`,
        });
        fetchLotDetail(selectedLotId);
        fetchFpoLots();
      }
    } catch (err) {
      alert(`Publishing failed: ${err.message}`);
    }
  };

  // Handle Create New Aggregation Pool
  const handleCreatePool = async (e) => {
    e.preventDefault();
    setIsCreatingPool(true);
    try {
      const payload = {
        seller_id: user?.id || 3,
        crop: newCrop,
        variety: newVariety,
        unit: newUnit,
        district: newDistrict,
        location: newLocation,
        expected_price: parseFloat(newExpectedPrice) || 2000,
        quality_grade: newQualityGrade,
      };

      const res = await api.post('/api/fpo/lots', payload);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `New aggregation pool for ${newCrop} initiated in DRAFT state! Add your member contributions now.`,
        });
        setCreatePoolModalOpen(false);
        fetchFpoLots();
        if (res.lot?.id) {
          setSelectedLotId(res.lot.id);
        }
      }
    } catch (err) {
      alert(`Pool creation failed: ${err.message}`);
    } finally {
      setIsCreatingPool(false);
    }
  };

  // Handle Create / Register FPO in Directory
  const handleCreateFpoOrg = async (e) => {
    e.preventDefault();
    if (!fpoOrgName) {
      alert('Please enter FPO Organization legal name');
      return;
    }
    setIsCreatingFpoOrg(true);
    try {
      const payload = {
        user_id: user?.id,
        fpo_name: fpoOrgName,
        registration_number: fpoOrgRegNo,
        district: fpoOrgDistrict,
        taluka: fpoOrgTaluka,
        crops: fpoOrgCrops,
        members_count: fpoOrgMembers,
        contact: fpoOrgContact,
        address: fpoOrgAddress,
        aadhaar: fpoOrgAadhaar,
      };
      const res = await api.post('/api/fpo/organizations', payload);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message || 'FPO successfully listed in Maharashtra Farmer Discovery Directory!',
        });
        setCreateFpoModalOpen(false);
        fetchFpoOrganizations();
      } else {
        alert(res.message || 'Failed to list FPO');
      }
    } catch (err) {
      alert(`Error registering FPO: ${err.message}`);
    } finally {
      setIsCreatingFpoOrg(false);
    }
  };

  // Handle Add Direct Commercial Lot
  const handleCreateDirectLot = async (e) => {
    e.preventDefault();
    if (!directCrop || !directQuantity || !directPrice) {
      alert('Please enter crop, quantity, and expected price');
      return;
    }
    setIsSubmittingDirectLot(true);
    try {
      const payload = {
        seller_id: user?.id,
        fpo_name: user?.profile?.fpo_name || user?.name || 'FPO Organization',
        crop: directCrop,
        variety: directVariety,
        quantity: parseFloat(directQuantity),
        unit: directUnit,
        offline_farmers_count: parseInt(directOfflineFarmers || '12'),
        expected_price: parseFloat(directPrice),
        quality_grade: directQualityGrade,
        district: directDistrict,
        location: directLocation,
        storage_status: directStorageStatus,
      };
      const res = await api.post('/api/fpo/direct-lot', payload);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message || 'Direct commercial lot successfully listed on marketplace!',
        });
        setDirectLotModalOpen(false);
        fetchFpoLots(lotScope);
        if (res.lot?.id) {
          setSelectedLotId(res.lot.id);
        }
      } else {
        alert(res.message || 'Failed to list direct lot');
      }
    } catch (err) {
      alert(`Error creating direct lot: ${err.message}`);
    } finally {
      setIsSubmittingDirectLot(false);
    }
  };

  // Aggregated KPIs
  const totalVolume = fpoLots.reduce((acc, lot) => acc + (lot.quantity || 0), 0);
  const totalMembers = fpoLots.reduce((acc, lot) => acc + (lot.members_count || 0), 0);
  const totalLivePools = fpoLots.filter((lot) => lot.status === 'ACTIVE').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Page Header */}
      <PageHeader
        title={isFarmer ? "Join FPO & Collective Produce Pooling" : "FPO Aggregation, Direct Sales & Market Intelligence"}
        subtitle={isFarmer 
          ? "Unite with fellow farmers across Maharashtra to achieve +15% to +25% higher profit, eliminate middleman cuts, and access bulk corporate buyers." 
          : "Create farmer aggregation groups so online farmers can join, list direct commercial lots for buyer sales, and compare market benchmarks against other Maharashtra FPOs."}
        action={
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              variant="outline-primary"
              icon={ArrowLeft}
              onClick={() => onNavigate && onNavigate('dashboard')}
            >
              Back to Dashboard
            </Button>
            <Button
              variant="outline-primary"
              icon={RefreshCw}
              onClick={() => {
                fetchFpoLots();
                fetchFpoOrganizations();
                if (selectedLotId) fetchLotDetail(selectedLotId);
              }}
            >
              Refresh
            </Button>
            {!isFarmer && (
              <>
                <Button
                  variant="outline-primary"
                  icon={BarChart2}
                  onClick={() => setActiveTab('benchmarks')}
                >
                  Compare FPOs
                </Button>
                <Button
                  variant="outline-primary"
                  icon={Layers}
                  onClick={() => setDirectLotModalOpen(true)}
                >
                  + Add Direct Lot
                </Button>
                <Button
                  variant="primary"
                  icon={PlusCircle}
                  onClick={() => setCreatePoolModalOpen(true)}
                >
                  + Create Aggregation Group
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* 2. Farmer / FPO Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border-color)', marginBottom: '4px', flexWrap: 'wrap' }}>
        {!isFarmer ? (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('create-group')}
              style={{
                padding: '10px 18px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'create-group' ? '3px solid var(--primary-700)' : '3px solid transparent',
                color: activeTab === 'create-group' ? 'var(--primary-800)' : 'var(--slate-600)',
                fontWeight: activeTab === 'create-group' ? 700 : 500,
                cursor: 'pointer',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Users size={18} color={activeTab === 'create-group' ? 'var(--primary-700)' : 'currentColor'} />
              <span>Aggregation Groups (Online Farmers Join) ({fpoLots.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('direct-lots')}
              style={{
                padding: '10px 18px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'direct-lots' ? '3px solid var(--primary-700)' : '3px solid transparent',
                color: activeTab === 'direct-lots' ? 'var(--primary-800)' : 'var(--slate-600)',
                fontWeight: activeTab === 'direct-lots' ? 700 : 500,
                cursor: 'pointer',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Layers size={18} color={activeTab === 'direct-lots' ? 'var(--primary-700)' : 'currentColor'} />
              <span>Direct Lots (Direct Sell to Buyers) ({fpoLots.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('benchmarks')}
              style={{
                padding: '10px 18px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'benchmarks' ? '3px solid var(--primary-700)' : '3px solid transparent',
                color: activeTab === 'benchmarks' ? 'var(--primary-800)' : 'var(--slate-600)',
                fontWeight: activeTab === 'benchmarks' ? 700 : 500,
                cursor: 'pointer',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <BarChart2 size={18} color={activeTab === 'benchmarks' ? 'var(--primary-700)' : 'currentColor'} />
              <span>Compare with Other FPOs (Market Benchmarks)</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('why-join')}
              style={{
                padding: '10px 18px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'why-join' ? '3px solid var(--primary-700)' : '3px solid transparent',
                color: activeTab === 'why-join' ? 'var(--primary-800)' : 'var(--slate-600)',
                fontWeight: activeTab === 'why-join' ? 700 : 500,
                cursor: 'pointer',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Award size={18} color={activeTab === 'why-join' ? 'var(--primary-700)' : 'currentColor'} />
              <span>Why Join an FPO? (+22% Profit)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('explore-fpos')}
              style={{
                padding: '10px 18px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'explore-fpos' ? '3px solid var(--primary-700)' : '3px solid transparent',
                color: activeTab === 'explore-fpos' ? 'var(--primary-800)' : 'var(--slate-600)',
                fontWeight: activeTab === 'explore-fpos' ? 700 : 500,
                cursor: 'pointer',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Building2 size={18} color={activeTab === 'explore-fpos' ? 'var(--primary-700)' : 'currentColor'} />
              <span>Explore & Join Nearby FPOs ({fpoOrgs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pools')}
              style={{
                padding: '10px 18px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'pools' ? '3px solid var(--primary-700)' : '3px solid transparent',
                color: activeTab === 'pools' ? 'var(--primary-800)' : 'var(--slate-600)',
                fontWeight: activeTab === 'pools' ? 700 : 500,
                cursor: 'pointer',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Package size={18} color={activeTab === 'pools' ? 'var(--primary-700)' : 'currentColor'} />
              <span>Active Aggregation Pools & Direct Lots ({fpoLots.length})</span>
            </button>
          </>
        )}
      </div>

      {/* 3. Feedback Alert */}
      {feedback && (
        <div
          style={{
            backgroundColor: feedback.type === 'success' ? '#ecfdf5' : '#f0f9ff',
            border: `1px solid ${feedback.type === 'success' ? '#6ee7b7' : '#bae6fd'}`,
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: feedback.type === 'success' ? '#065f46' : '#0369a1',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color={feedback.type === 'success' ? '#10b981' : '#0284c7'} />
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: WHY JOIN AN FPO? */}
      {activeTab === 'why-join' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Hero Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 60%, #eff6ff 100%)',
              border: '1.5px solid #86efac',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    marginBottom: '8px',
                  }}
                >
                  <Sparkles size={14} /> MAHARASHTRA GOVTECH FPO COLLECTIVE POWER
                </div>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#14532d', margin: '0 0 8px' }}>
                  Why Join a Farmer Producer Organization (FPO)?
                </h2>
                <p style={{ color: '#334155', fontSize: '0.92rem', margin: 0, maxWidth: '780px', lineHeight: 1.55 }}>
                  When you sell alone, you are forced to accept spot mandi rates dictated by local middlemen, pay high individual transport fees, and absorb distress price crashes. By joining an FPO, smallholder farmers aggregate harvests to negotiate directly with corporate institutional buyers and exporters.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => setActiveTab('explore-fpos')}
                icon={Building2}
                style={{ padding: '10px 18px', fontWeight: 700 }}
              >
                Browse & Join Nearby FPOs
              </Button>
            </div>

            {/* 4 Stat Highlights */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginTop: '6px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Average Profit Uplift</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>+18% to +25%</div>
                <div style={{ fontSize: '0.78rem', color: '#166534', marginTop: '2px' }}>Higher net in-hand return</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Logistics Savings</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>35% Cheaper</div>
                <div style={{ fontSize: '0.78rem', color: '#1e40af', marginTop: '2px' }}>Pooled trucks & packhouses</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Input Cost Savings</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>12% - 18% Off</div>
                <div style={{ fontSize: '0.78rem', color: '#92400e', marginTop: '2px' }}>Wholesale seeds & fertilizer</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Post-Harvest Loss</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7c3aed', marginTop: '2px' }}>&lt; 3% Spoilage</div>
                <div style={{ fontSize: '0.78rem', color: '#6d28d9', marginTop: '2px' }}>Pre-cooling & cold storage access</div>
              </div>
            </div>
          </div>

          {/* 4 Core Pillars of How FPO Increases Profit */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <Card style={{ padding: '20px', borderTop: '4px solid #16a34a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ backgroundColor: '#dcfce7', padding: '8px', borderRadius: '8px', color: '#15803d' }}>
                  <TrendingUp size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                  1. Bulk Bargaining Power (+₹400/Qtl)
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                When an individual farmer sells 1-2 tonnes, you must accept whatever wholesale price traders quote. When your FPO aggregates 50-100 tonnes into full truckloads, large corporate buyers (Reliance Fresh, ITC, BigBasket) bid directly for institutional procurement at premium contracts.
              </p>
            </Card>

            <Card style={{ padding: '20px', borderTop: '4px solid #2563eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ backgroundColor: '#dbeafe', padding: '8px', borderRadius: '8px', color: '#1d4ed8' }}>
                  <Truck size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                  2. 35% Lower Transport Costs
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                Instead of hiring private small tempos and paying retail rates to haul produce individually to distant mandis, FPO members pool shipments. Shared multi-axle freight and localized collection centres save up to ₹1,200 per tonne in transport.
              </p>
            </Card>

            <Card style={{ padding: '20px', borderTop: '4px solid #d97706' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ backgroundColor: '#fef3c7', padding: '8px', borderRadius: '8px', color: '#b45309' }}>
                  <Percent size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                  3. Cheaper Seeds, Fertilizer & Inputs
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                FPOs buy certified hybrid seeds, fertilizers, bio-pesticides, and drip equipment in bulk directly from registered manufacturers. Members receive authentic inputs with 12% to 18% savings compared to local retail agro-dealers.
              </p>
            </Card>

            <Card style={{ padding: '20px', borderTop: '4px solid #7c3aed' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ backgroundColor: '#ede9fe', padding: '8px', borderRadius: '8px', color: '#6d28d9' }}>
                  <ShieldCheck size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                  4. Cold Storage & No Distress Sales
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                During harvest gluts when market prices drop below production costs, FPOs have reserved quotas in certified cold storages and packhouses. Your crop is pre-cooled and safely stored until market rates rebound, completely preventing distress sales.
              </p>
            </Card>
          </div>

          {/* Side-by-Side Financial Comparison Table */}
          <Card title="Financial Profit Breakdown: Solo Farmer vs FPO Member (1 Acre Harvest Example)">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--slate-100)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>Financial Parameter</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', color: '#dc2626' }}>Solo Farmer (APMC Mandi)</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', color: '#15803d' }}>FPO Member (Collective Pooling)</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', color: 'var(--primary-800)' }}>Your Net Benefit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>Harvest Volume (Tomato / Onion)</td>
                    <td style={{ padding: '12px 16px' }}>15 Tonnes (150 Quintals)</td>
                    <td style={{ padding: '12px 16px' }}>15 Tonnes (150 Quintals)</td>
                    <td style={{ padding: '12px 16px', color: 'var(--slate-500)' }}>Equal Harvest</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>Average Realization Rate</td>
                    <td style={{ padding: '12px 16px', color: '#b91c1c' }}>₹22.00 / kg (Spot Mandi Rate)</td>
                    <td style={{ padding: '12px 16px', color: '#15803d', fontWeight: 700 }}>₹27.00 / kg (Corporate Contract)</td>
                    <td style={{ padding: '12px 16px', color: '#15803d', fontWeight: 700 }}>+₹5.00/kg (+22.7%)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>Gross Crop Revenue</td>
                    <td style={{ padding: '12px 16px' }}>₹3,30,000</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>₹4,05,000</td>
                    <td style={{ padding: '12px 16px', color: '#15803d', fontWeight: 700 }}>+₹75,000 Gross</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>Mandi Commission & Adat (6%)</td>
                    <td style={{ padding: '12px 16px', color: '#b91c1c' }}>-₹19,800 (Deducted at yard)</td>
                    <td style={{ padding: '12px 16px', color: '#15803d', fontWeight: 600 }}>₹0 (Direct Buyer Escrow)</td>
                    <td style={{ padding: '12px 16px', color: '#15803d', fontWeight: 700 }}>+₹19,800 Saved</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>Transport & Handling Cost</td>
                    <td style={{ padding: '12px 16px', color: '#b91c1c' }}>-₹22,500 (Individual tempo trips)</td>
                    <td style={{ padding: '12px 16px', color: '#15803d' }}>-₹14,000 (Shared pooled freight)</td>
                    <td style={{ padding: '12px 16px', color: '#15803d', fontWeight: 700 }}>+₹8,500 Saved</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>Input Savings (Seeds & Fertilisers)</td>
                    <td style={{ padding: '12px 16px' }}>₹0 (Retail purchases)</td>
                    <td style={{ padding: '12px 16px', color: '#15803d' }}>+₹11,500 (15% wholesale rebate)</td>
                    <td style={{ padding: '12px 16px', color: '#15803d', fontWeight: 700 }}>+₹11,500 Saved</td>
                  </tr>
                  <tr style={{ backgroundColor: '#ecfdf5', fontWeight: 800 }}>
                    <td style={{ padding: '16px', fontSize: '0.98rem', color: '#14532d' }}>Net In-Hand Profit to Farmer</td>
                    <td style={{ padding: '16px', fontSize: '1.05rem', color: '#b91c1c' }}>₹1,87,700</td>
                    <td style={{ padding: '16px', fontSize: '1.15rem', color: '#15803d' }}>₹2,52,500</td>
                    <td style={{ padding: '16px', fontSize: '1.15rem', color: '#15803d' }}>
                      👉 +₹64,800 Extra Cash in Hand!
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)' }}>
                * Based on actual field benchmarks from Maharashtra SMART Project & Sahyadri Farmer Producer Co.
              </div>
              <Button
                variant="primary"
                onClick={() => setActiveTab('explore-fpos')}
                icon={Building2}
              >
                Apply to Join a Maharashtra FPO
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: EXPLORE & JOIN NEARBY FPOS */}
      {activeTab === 'explore-fpos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Bar with Back Button & District Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Button
                variant="outline-primary"
                size="sm"
                icon={ArrowLeft}
                onClick={() => setActiveTab('pools')}
              >
                Back to Pools & Lots
              </Button>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                  Registered FPOs in Maharashtra ({fpoOrgs.filter((o) => districtFilter === 'ALL' || o.district === districtFilter).length})
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--slate-500)' }}>
                  Select a verified FPO in your district to join their produce pooling collective.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['ALL', 'Nashik', 'Pune', 'Solapur', 'Ahmednagar'].map((dist) => (
                <button
                  key={dist}
                  type="button"
                  onClick={() => setDistrictFilter(dist)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: districtFilter === dist ? 'var(--primary-700)' : '#ffffff',
                    color: districtFilter === dist ? '#ffffff' : 'var(--slate-700)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {dist === 'ALL' ? 'All Districts' : dist}
                </button>
              ))}
            </div>
          </div>

          {/* FPO Registration Banner */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1.5px dashed var(--primary-300)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={20} color="var(--primary-700)" />
                <strong style={{ color: 'var(--slate-900)', fontSize: '0.98rem' }}>
                  Are you an FPO or Farmer Producer Company in Maharashtra?
                </strong>
              </div>
              <p style={{ margin: '4px 0 0 0', color: 'var(--slate-600)', fontSize: '0.85rem' }}>
                Register your FPO in this directory so farmers in your district can discover your benefits and apply to join your aggregation pools.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={PlusCircle}
              onClick={() => setCreateFpoModalOpen(true)}
            >
              + Register / List FPO Profile
            </Button>
          </div>

          {/* FPO Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
            {fpoOrgs
              .filter((o) => districtFilter === 'ALL' || o.district === districtFilter)
              .map((org) => {
                const isApplied = appliedFpoIds.includes(org.id);
                const cropsList = Array.isArray(org.crops)
                  ? org.crops
                  : typeof org.crops === 'string'
                    ? org.crops.split(',').map((c) => c.trim()).filter(Boolean)
                    : ['Tomato', 'Onion'];
                const benefitsList = Array.isArray(org.benefits)
                  ? org.benefits
                  : typeof org.benefits === 'string'
                    ? org.benefits.split(',').map((b) => b.trim()).filter(Boolean)
                    : ['Direct collective market access & bulk contracts'];
                const memberCount = typeof org.members_count === 'number'
                  ? org.members_count
                  : parseInt(org.members_count) || 0;
                const profitBoost = org.avg_profit_uplift || '+20%';
                const fpoRating = org.rating || 4.8;

                return (
                  <Card key={org.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                            {org.name}
                          </h4>
                          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={13} color="var(--primary-700)" />
                            <span>{org.taluka || 'Main Hub'}, {org.district}</span>
                          </div>
                        </div>
                        <Badge variant="success">Govt Registered</Badge>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', margin: '12px 0', backgroundColor: 'var(--slate-50)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
                        <div>
                          <span style={{ color: 'var(--slate-500)', fontSize: '0.72rem', display: 'block' }}>MEMBERS</span>
                          <strong>{memberCount.toLocaleString()} Farmers</strong>
                        </div>
                        <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '12px' }}>
                          <span style={{ color: 'var(--slate-500)', fontSize: '0.72rem', display: 'block' }}>PROFIT BOOST</span>
                          <strong style={{ color: 'var(--primary-700)' }}>{profitBoost}</strong>
                        </div>
                        <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '12px' }}>
                          <span style={{ color: 'var(--slate-500)', fontSize: '0.72rem', display: 'block' }}>RATING</span>
                          <strong>⭐ {fpoRating} / 5.0</strong>
                        </div>
                      </div>

                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                          Primary Crops:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                          {cropsList.map((c) => (
                            <Badge key={c} variant="neutral">{c}</Badge>
                          ))}
                        </div>
                      </div>

                      <div style={{ marginBottom: '14px', fontSize: '0.82rem', color: '#334155' }}>
                        <span style={{ fontWeight: 700, display: 'block', marginBottom: '4px' }}>Key Member Advantages:</span>
                        <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.45 }}>
                          {benefitsList.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--slate-600)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={13} />
                        <span>{org.contact || '+91 98000 00000'}</span>
                      </div>

                      {isApplied ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', fontWeight: 700, fontSize: '0.85rem' }}>
                          <CheckCircle2 size={16} color="#16a34a" />
                          <span>Application Sent</span>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedOrgForJoin(org);
                            if (cropsList.length > 0) setJoinCrop(cropsList[0]);
                          }}
                        >
                          Apply to Join FPO
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVE AGGREGATION POOLS / FPO AGGREGATION GROUPS */}
      {(activeTab === 'pools' || activeTab === 'create-group') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* FPO Group Creation Explainer Banner */}
          {!isFarmer && (
            <div
              style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 60%, #eff6ff 100%)',
                border: '1.5px solid #86efac',
                borderRadius: '12px',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '16px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                  <Sparkles size={14} /> FPO HARVEST AGGREGATION GROUPS
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#14532d', margin: '0 0 4px' }}>
                  Create Aggregation Groups & Onboard Online Farmers
                </h3>
                <p style={{ color: '#334155', fontSize: '0.88rem', margin: 0, maxWidth: '720px', lineHeight: 1.5 }}>
                  Create crop aggregation groups with guaranteed floor prices and volume quotas. Smallholder farmers across Maharashtra can discover your group online and pledge their harvests into your truckload batches.
                </p>
              </div>
              <Button
                variant="primary"
                icon={PlusCircle}
                onClick={() => setCreatePoolModalOpen(true)}
                style={{ padding: '10px 18px', fontWeight: 700 }}
              >
                + Create Aggregation Group
              </Button>
            </div>
          )}

          {/* 3. KPI Stat Cards */}
          <div className="four-col-grid">
            <StatCard
              label="Aggregated Volume"
              value={`${totalVolume.toLocaleString('en-IN')} Units`}
              helper="Across all active & draft pools"
              icon={Package}
              iconColor="var(--primary-700)"
              iconBg="var(--primary-50)"
            />
            <StatCard
              label="Contributing Farmers"
              value={`${totalMembers} Farmers`}
              helper="Pledged & verified members"
              icon={Users}
              iconColor="var(--status-info-text)"
              iconBg="var(--status-info-bg)"
            />
            <StatCard
              label="Live Marketplace Pools"
              value={`${totalLivePools} Active`}
              helper="Receiving buyer bids"
              icon={FileCheck}
              iconColor="var(--status-success-text)"
              iconBg="var(--status-success-bg)"
            />
            <StatCard
              label="Target Valuation"
              value={`₹${(selectedLot?.total_valuation || 0).toLocaleString('en-IN')}`}
              helper="Selected pool expected revenue"
              icon={IndianRupee}
              iconColor="var(--accent-amber)"
              iconBg="var(--accent-amber-light)"
            />
          </div>

          {/* FPO Scope Controls & Direct Lot Action Bar */}
          {!isFarmer && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: 'var(--slate-50)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-600)' }}>View:</span>
                <button
                  type="button"
                  onClick={() => {
                    setLotScope('my-fpo');
                    fetchFpoLots('my-fpo');
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: '1px solid ' + (lotScope === 'my-fpo' ? 'var(--primary-700)' : 'var(--border-color)'),
                    backgroundColor: lotScope === 'my-fpo' ? 'var(--primary-700)' : '#ffffff',
                    color: lotScope === 'my-fpo' ? '#ffffff' : 'var(--slate-700)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  My FPO Pools & Lots ({lotScope === 'my-fpo' ? fpoLots.length : '...'})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLotScope('all-network');
                    fetchFpoLots('all-network');
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: '1px solid ' + (lotScope === 'all-network' ? 'var(--primary-700)' : 'var(--border-color)'),
                    backgroundColor: lotScope === 'all-network' ? 'var(--primary-700)' : '#ffffff',
                    color: lotScope === 'all-network' ? '#ffffff' : 'var(--slate-700)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  All Maharashtra Network Pools
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  size="sm"
                  variant="outline-primary"
                  icon={Layers}
                  onClick={() => setDirectLotModalOpen(true)}
                >
                  + Add Direct Offline Lot
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  icon={PlusCircle}
                  onClick={() => setCreatePoolModalOpen(true)}
                >
                  + Create Aggregation Pool
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <LoadingState message="Loading FPO aggregation pools..." />
          ) : fpoLots.length === 0 ? (
            <div style={{ textAlign: 'center' }}>
              <EmptyState
                icon={Package}
                title={lotScope === 'my-fpo' ? 'No Pools or Lots Listed Yet' : 'No Aggregation Pools Found'}
                description={
                  lotScope === 'my-fpo'
                    ? 'Your FPO has not created any aggregation pools or direct lots yet. You can create a structured member aggregation pool or directly list bulk produce collected from offline farmer groups.'
                    : 'No active aggregation pools found across the Maharashtra network.'
                }
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
                <Button variant="primary" icon={PlusCircle} onClick={() => setCreatePoolModalOpen(true)}>
                  Create Aggregation Pool
                </Button>
                <Button variant="outline-primary" icon={Layers} onClick={() => setDirectLotModalOpen(true)}>
                  Add Direct Lot (Offline Group Harvest)
                </Button>
              </div>
            </div>
          ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
          {/* Left Column: Pools List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-800)', margin: 0 }}>
                Aggregation Pools ({fpoLots.length})
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Select to view members</span>
            </div>

            {fpoLots.map((lot) => {
              const isSelected = selectedLotId === lot.id;
              return (
                <div
                  key={lot.id}
                  onClick={() => setSelectedLotId(lot.id)}
                  style={{
                    backgroundColor: isSelected ? 'var(--primary-50)' : '#ffffff',
                    border: `1px solid ${isSelected ? 'var(--primary-600)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 2px 8px rgba(16, 185, 129, 0.15)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 2px' }}>
                        {lot.crop} ({lot.variety || 'Bulk'})
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                        Lot #{lot.id} • {lot.location || lot.district}
                      </span>
                    </div>
                    <Badge variant={lot.status === 'ACTIVE' ? 'success' : lot.status === 'DRAFT' ? 'warning' : 'info'}>
                      {lot.status}
                    </Badge>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--slate-700)' }}>
                      {lot.quantity} {lot.unit}
                    </span>
                    <span style={{ color: 'var(--primary-800)', fontWeight: 700 }}>
                      ₹{lot.expected_price}/{lot.unit}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                    <Users size={13} />
                    <span>{lot.members_count || 0} contributing farmers</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Pool Detail & Member Equity Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {isLotLoading ? (
              <LoadingState message="Loading pool details..." />
            ) : selectedLot ? (
              <>
                {/* Pool Overview Banner */}
                <Card>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>
                          {selectedLot.crop} Bulk Pool — {selectedLot.variety}
                        </h2>
                        <Badge variant={selectedLot.status === 'ACTIVE' ? 'success' : 'warning'}>
                          {selectedLot.status}
                        </Badge>
                        <Badge variant="info">{selectedLot.quality_grade}</Badge>
                      </div>
                      <p style={{ color: 'var(--slate-600)', fontSize: '0.875rem', margin: 0 }}>
                        FPO Hub: <strong>{selectedLot.seller_name}</strong> • Location: <strong>{selectedLot.location}</strong> ({selectedLot.district})
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      {selectedLot.status === 'DRAFT' && (
                        <Button
                          variant="primary"
                          icon={FileCheck}
                          onClick={handlePublishLot}
                        >
                          Publish to Marketplace
                        </Button>
                      )}
                      <Button
                        variant={selectedLot.status === 'DRAFT' ? 'outline-primary' : 'primary'}
                        icon={PlusCircle}
                        onClick={() => setAddMemberModalOpen(true)}
                      >
                        Add Member Contribution
                      </Button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '16px',
                      marginTop: '20px',
                      paddingTop: '16px',
                      borderTop: '1px solid var(--border-color)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginBottom: '2px' }}>Total Aggregated Volume</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                        {selectedLot.quantity} {selectedLot.unit}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginBottom: '2px' }}>Expected Benchmark Rate</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                        ₹{selectedLot.expected_price}/{selectedLot.unit}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginBottom: '2px' }}>Total Pool Valuation</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                        ₹{selectedLot.total_valuation?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginBottom: '2px' }}>Contributing Members</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                        {selectedLot.members?.length || 0} Farmers
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Quality Disparity Alert Banner */}
                {selectedLot.quality_audit?.has_mismatch && (
                  <div
                    style={{
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: 'var(--radius-lg)',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <AlertTriangle size={22} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 800, color: '#92400e' }}>
                        FPO Quality Disparity Warning — Mixed Produce Grades
                      </h4>
                      <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#b45309', lineHeight: 1.45 }}>
                        {selectedLot.quality_audit.warning_message}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e' }}>
                          Member Grade Breakdown:
                        </span>
                        {Object.entries(selectedLot.quality_audit.grade_distribution || {}).map(([grade, qty]) => (
                          <span
                            key={grade}
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #fcd34d',
                              borderRadius: 'var(--radius-sm)',
                              padding: '2px 8px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              color: grade === selectedLot.quality_grade ? '#059669' : '#d97706',
                            }}
                          >
                            {grade}: {qty} {selectedLot.unit}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Member Farmers Equity Table */}
                <Card>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 2px' }}>
                        Member Farmer Payout & Equity Breakdown
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', margin: 0 }}>
                        Transparent distribution of sale revenues based on delivered weights and agreed quality grades.
                      </p>
                    </div>

                    <Button
                      variant="outline-primary"
                      size="sm"
                      icon={PlusCircle}
                      onClick={() => setAddMemberModalOpen(true)}
                    >
                      Add Farmer
                    </Button>
                  </div>

                  {!selectedLot.members || selectedLot.members.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--slate-500)' }}>
                      <Users size={36} color="var(--slate-400)" style={{ margin: '0 auto 12px' }} />
                      <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '8px' }}>
                        No Member Contributions Yet
                      </p>
                      <p style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
                        Add harvest commitments from your farmers to build this commercial batch.
                      </p>
                      <Button variant="primary" size="sm" onClick={() => setAddMemberModalOpen(true)}>
                        Add First Member
                      </Button>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--slate-50)', borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--slate-700)' }}>Farmer Name & ID</th>
                            <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--slate-700)' }}>Delivered Quantity</th>
                            <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--slate-700)' }}>Grade</th>
                            <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--slate-700)' }}>Equity Share (%)</th>
                            <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--slate-700)' }}>Estimated Payout</th>
                            <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--slate-700)' }}>Status</th>
                            {selectedLot.status === 'DRAFT' && (
                              <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--slate-700)', textAlign: 'right' }}>Actions</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {selectedLot.members.map((m) => (
                            <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{m.farmer_name}</div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                                  {m.farmer_reference_placeholder || `MEM-${m.id}`}
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--slate-800)' }}>
                                {m.quantity} {m.unit}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <Badge variant={m.quality_grade === 'Grade A' ? 'success' : 'default'}>
                                  {m.quality_grade}
                                </Badge>
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div
                                    style={{
                                      width: '60px',
                                      height: '8px',
                                      backgroundColor: 'var(--slate-200)',
                                      borderRadius: '4px',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: `${m.percentage_share}%`,
                                        height: '100%',
                                        backgroundColor: 'var(--primary-600)',
                                      }}
                                    />
                                  </div>
                                  <span style={{ fontWeight: 700, color: 'var(--slate-800)', fontSize: '0.85rem' }}>
                                    {m.percentage_share}%
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--primary-800)' }}>
                                ₹{(m.estimated_payout || 0).toLocaleString('en-IN')}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <Badge
                                  variant={
                                    m.contribution_status === 'VERIFIED'
                                      ? 'success'
                                      : m.contribution_status === 'RECEIVED'
                                      ? 'info'
                                      : 'warning'
                                  }
                                >
                                  {m.contribution_status}
                                </Badge>
                              </td>
                              {selectedLot.status === 'DRAFT' && (
                                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                  <button
                                    onClick={() => handleRemoveMember(m.id, m.farmer_name)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      color: 'var(--status-danger-text)',
                                      padding: '4px',
                                    }}
                                    title="Remove from pool"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </>
            ) : null}
          </div>
        </div>
      )}
      </div>
    )}

    {/* TAB: DIRECT COMMERCIAL LOTS (DIRECT SELL TO BUYERS) */}
    {!isFarmer && activeTab === 'direct-lots' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 55%, #eff6ff 100%)',
              border: '1.5px solid #86efac',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    marginBottom: '8px',
                  }}
                >
                  <Layers size={14} /> DIRECT COMMERCIAL SALE TO INSTITUTIONAL BUYERS
                </div>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#14532d', margin: '0 0 6px' }}>
                  Direct Lots & Institutional Buyer Procurement
                </h2>
                <p style={{ color: '#334155', fontSize: '0.92rem', margin: 0, maxWidth: '780px', lineHeight: 1.55 }}>
                  Directly list bulk produce collected from offline farmer groups or internal warehouse storage so you can immediately sell to verified corporate buyers (Reliance Fresh, BigBasket, ITC Agri) without waiting for online farmer digital pooling pledges.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Button
                  variant="primary"
                  icon={PlusCircle}
                  onClick={() => setDirectLotModalOpen(true)}
                  style={{ fontWeight: 700 }}
                >
                  + Add Direct Commercial Lot
                </Button>
                <Button
                  variant="outline-primary"
                  icon={BarChart2}
                  onClick={() => setActiveTab('benchmarks')}
                >
                  Compare Other FPO Rates
                </Button>
              </div>
            </div>

            {/* 4 Stat KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '6px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Direct Commercial Lots</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
                  {fpoLots.length} Lots Active
                </div>
                <div style={{ fontSize: '0.78rem', color: '#166534', marginTop: '2px' }}>Listed on B2B Exchange</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Direct Volume Available</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
                  {totalVolume.toLocaleString('en-IN')} Units
                </div>
                <div style={{ fontSize: '0.78rem', color: '#1e40af', marginTop: '2px' }}>Aggregated offline harvest</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Inbound Buyer Bids</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>
                  {directLotOffers.filter(o => o.status === 'PENDING').length} Active Tenders
                </div>
                <div style={{ fontSize: '0.78rem', color: '#92400e', marginTop: '2px' }}>Corporate buyers ready</div>
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Settlement Guarantee</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7c3aed', marginTop: '2px' }}>100% Escrow</div>
                <div style={{ fontSize: '0.78rem', color: '#6d28d9', marginTop: '2px' }}>Instant payout to FPO</div>
              </div>
            </div>
          </div>

          {/* Direct Lots & Buyer Tenders Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                  Active Direct Produce Lots & Incoming Buyer Tenders
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: 'var(--slate-500)' }}>
                  Review institutional buyer tenders submitted for your lots and execute binding digital sale contracts.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                icon={PlusCircle}
                onClick={() => setDirectLotModalOpen(true)}
              >
                + Add Another Direct Lot
              </Button>
            </div>

            {/* Render Direct Lots with Buyer Tender Bids */}
            {fpoLots.length === 0 ? (
              <Card style={{ padding: '36px', textAlign: 'center' }}>
                <EmptyState
                  icon={Layers}
                  title="No Direct Commercial Lots Listed"
                  description="You can directly list produce aggregated from offline member farmers or packhouse inventory to attract corporate buyer bids immediately."
                />
                <Button
                  variant="primary"
                  icon={PlusCircle}
                  onClick={() => setDirectLotModalOpen(true)}
                  style={{ marginTop: '16px' }}
                >
                  Add Your First Direct Lot
                </Button>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {fpoLots.map((lot) => {
                  const matchingOffers = directLotOffers.filter(
                    (o) => o.crop.toLowerCase() === lot.crop.toLowerCase() || directLotOffers.indexOf(o) === 0
                  );

                  return (
                    <Card key={lot.id} style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                              {lot.crop} ({lot.variety || 'Commercial Bulk'})
                            </span>
                            <Badge variant="success">DIRECT LOT #{lot.id}</Badge>
                            <Badge variant={lot.status === 'ACTIVE' ? 'success' : 'info'}>{lot.status}</Badge>
                          </div>

                          <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            <span>📍 Location: <strong>{lot.location || lot.district}</strong></span>
                            <span>📦 Quality: <strong>{lot.quality_grade || 'Grade A'}</strong></span>
                            <span>🌾 Origin: <strong>Collected from Offline Farmer Group ({lot.members_count || 14} smallholders)</strong></span>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>Asking Reserve Rate</div>
                          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-800)' }}>
                            ₹{lot.expected_price} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--slate-500)' }}>/ {lot.unit}</span>
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-700)', marginTop: '2px' }}>
                            Total Volume: {lot.quantity} {lot.unit} (Valuation: ₹{(lot.quantity * lot.expected_price).toLocaleString('en-IN')})
                          </div>
                        </div>
                      </div>

                      {/* Inbound Buyer Bids Section */}
                      <div style={{ marginTop: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-800)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Tag size={16} color="var(--primary-700)" />
                            Inbound Institutional Buyer Bids & Commercial Tenders ({matchingOffers.length})
                          </h4>
                          <span style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>
                            Protected by Maharashtra GovTech Escrow Framework
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {matchingOffers.map((offer) => {
                            const isAccepted = offer.status === 'ACCEPTED';

                            return (
                              <div
                                key={offer.id}
                                style={{
                                  backgroundColor: isAccepted ? '#ecfdf5' : '#f8fafc',
                                  border: `1px solid ${isAccepted ? '#86efac' : 'var(--border-color)'}`,
                                  borderRadius: '8px',
                                  padding: '14px 18px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: '14px',
                                }}
                              >
                                <div style={{ flex: 1, minWidth: '280px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <strong style={{ fontSize: '0.96rem', color: 'var(--slate-900)' }}>{offer.buyer_name}</strong>
                                    <Badge variant={isAccepted ? 'success' : 'warning'}>
                                      {isAccepted ? 'CONTRACT EXECUTED' : 'PENDING ACCEPTANCE'}
                                    </Badge>
                                  </div>
                                  <div style={{ fontSize: '0.84rem', color: 'var(--slate-600)', marginBottom: '4px' }}>
                                    🚚 Delivery Point: <strong>{offer.delivery_hub}</strong> • 💳 Terms: <strong>{offer.payment_terms}</strong>
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>
                                    Tender ID: {offer.id} • Placed: {offer.placed_at} • Buyer Contact: {offer.buyer_contact}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>Offered Bid Rate</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isAccepted ? '#15803d' : '#0369a1' }}>
                                      ₹{offer.offered_price} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>/ {lot.unit === 'tonne' ? 'kg' : lot.unit}</span>
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
                                      Volume: {offer.requested_quantity} {offer.unit}
                                    </div>
                                  </div>

                                  <div>
                                    {isAccepted ? (
                                      <div
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          backgroundColor: '#dcfce7',
                                          color: '#15803d',
                                          padding: '8px 14px',
                                          borderRadius: '6px',
                                          fontWeight: 700,
                                          fontSize: '0.86rem',
                                        }}
                                      >
                                        <CheckCircle2 size={16} /> Sold via Escrow
                                      </div>
                                    ) : (
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        icon={CheckCircle2}
                                        onClick={() =>
                                          handleAcceptBuyerOffer(
                                            offer.id,
                                            offer.buyer_name,
                                            offer.offered_price,
                                            offer.requested_quantity,
                                            offer.unit,
                                            lot.crop
                                          )
                                        }
                                      >
                                        Accept Buyer Bid (Sell Directly)
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: FPO MARKET BENCHMARKS & COMPETITIVE COMPARISON */}
      {activeTab === 'benchmarks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
              border: '1.5px solid #7dd3fc',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#bae6fd',
                    color: '#0369a1',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    marginBottom: '8px',
                  }}
                >
                  <BarChart2 size={14} /> MAHARASHTRA FPO MARKET BENCHMARK & PRICING INTELLIGENCE
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0c4a6e', margin: '0 0 6px' }}>
                  Compare FPOs & Optimize Your Farmer & Buyer Offers
                </h2>
                <p style={{ color: '#334155', fontSize: '0.9rem', margin: 0, maxWidth: '780px', lineHeight: 1.5 }}>
                  Real-time market comparison between APMC Mandi spot rates, leading Maharashtra FPO member payout rates, and corporate institutional procurement prices. Use these benchmarks to price your aggregated lots competitively to attract both farmers and bulk buyers.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Button
                  variant="outline-primary"
                  icon={ArrowLeft}
                  onClick={() => setActiveTab(!isFarmer ? 'create-group' : 'pools')}
                >
                  Back to {!isFarmer ? 'Groups' : 'Pools'}
                </Button>
                <Button
                  variant="primary"
                  icon={Layers}
                  onClick={() => setActiveTab('direct-lots')}
                >
                  View Direct Lots
                </Button>
              </div>
            </div>

            {/* Crop Selector Bar */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
              {benchmarks.map((b) => (
                <button
                  key={b.crop}
                  type="button"
                  onClick={() => {
                    setBenchmarkCrop(b.crop);
                    setSimCrop(b.crop.split(' ')[0]);
                    setSimFarmerPayout((b.fpo_avg_payout || 25).toFixed(2));
                    setSimBuyerPrice((b.buyer_bulk_rate || 28).toFixed(2));
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid ' + (benchmarkCrop === b.crop ? 'var(--primary-700)' : 'var(--border-color)'),
                    backgroundColor: benchmarkCrop === b.crop ? 'var(--primary-700)' : '#ffffff',
                    color: benchmarkCrop === b.crop ? '#ffffff' : 'var(--slate-800)',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  {b.crop}
                </button>
              ))}
            </div>
          </div>

          {/* Benchmark 4-Card Summary Bar */}
          {(() => {
            const currentB = benchmarks.find((b) => b.crop === benchmarkCrop) || benchmarks[0] || {
              crop: 'Tomato (Hybrid)',
              apmc_mandi_avg: 22.5,
              fpo_avg_payout: 25.2,
              top_fpo_payout: 26.5,
              buyer_bulk_rate: 28.0,
              fpo_operating_margin: 2.8,
              avg_settlement_days: 'T+2 Days',
            };

            const apmcRate = currentB.apmc_mandi_avg || 22.5;
            const avgPayout = currentB.fpo_avg_payout || 25.2;
            const topPayout = currentB.top_fpo_payout || 26.5;
            const buyerRate = currentB.buyer_bulk_rate || 28.0;
            const margin = currentB.fpo_operating_margin || (buyerRate - avgPayout);
            const upliftPct = Math.round(((avgPayout - apmcRate) / apmcRate) * 100);

            return (
              <>
                <div className="four-col-grid">
                  <StatCard
                    label="APMC Mandi Spot Baseline"
                    value={`₹${apmcRate.toFixed(2)}/kg`}
                    helper="Local yard auction price"
                    icon={TrendingUp}
                    iconColor="#b91c1c"
                    iconBg="#fee2e2"
                  />
                  <StatCard
                    label="Average FPO Farmer Payout"
                    value={`₹${avgPayout.toFixed(2)}/kg`}
                    helper={`+${upliftPct}% higher than Mandi`}
                    trend={{ isUp: true, text: `+₹${(avgPayout - apmcRate).toFixed(2)}/kg` }}
                    icon={CheckCircle2}
                    iconColor="var(--status-success-text)"
                    iconBg="var(--status-success-bg)"
                  />
                  <StatCard
                    label="Top FPO Benchmark Payout"
                    value={`₹${topPayout.toFixed(2)}/kg`}
                    helper="Paid by leading exporter FPOs"
                    icon={Award}
                    iconColor="var(--primary-700)"
                    iconBg="var(--primary-50)"
                  />
                  <StatCard
                    label="Institutional Buyer Contract Rate"
                    value={`₹${buyerRate.toFixed(2)}/kg`}
                    helper={`FPO Spread: ₹${margin.toFixed(2)}/kg (${currentB.avg_settlement_days})`}
                    icon={IndianRupee}
                    iconColor="var(--accent-blue)"
                    iconBg="var(--accent-blue-light)"
                  />
                </div>

                {/* Side-by-Side Comparison Matrix Table */}
                <Card title={`FPO Competitor Benchmark Matrix: ${benchmarkCrop}`}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--slate-100)', textAlign: 'left' }}>
                          <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>FPO Name & Hub</th>
                          <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>Farmer Payout</th>
                          <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>Buyer Bulk Rate</th>
                          <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>FPO Margin</th>
                          <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>Settlement</th>
                          <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>Competitive Advantage</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <strong>Sahyadri Farmers Producer Co. Ltd.</strong>
                            <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>Dindori, Nashik</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: '#15803d' }}>₹{topPayout.toFixed(2)}/kg</td>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>₹{(buyerRate + 1.0).toFixed(2)}/kg</td>
                          <td style={{ padding: '12px 16px', color: 'var(--slate-600)' }}>₹{(buyerRate + 1.0 - topPayout).toFixed(2)}/kg</td>
                          <td style={{ padding: '12px 16px' }}><Badge variant="success">T+2 Days</Badge></td>
                          <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--slate-700)' }}>Global G.A.P. Packhouse & Direct Europe Export</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <strong>Dindori Agro Producer Company</strong>
                            <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>Dindori, Nashik</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: '#15803d' }}>₹{avgPayout.toFixed(2)}/kg</td>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>₹{buyerRate.toFixed(2)}/kg</td>
                          <td style={{ padding: '12px 16px', color: 'var(--slate-600)' }}>₹{(buyerRate - avgPayout).toFixed(2)}/kg</td>
                          <td style={{ padding: '12px 16px' }}><Badge variant="info">T+3 Days</Badge></td>
                          <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--slate-700)' }}>Reliance Retail & BigBasket Long-term Contracts</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <strong>Junnar Agro Producer Org</strong>
                            <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>Junnar, Pune</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: '#15803d' }}>₹{(avgPayout - 0.5).toFixed(2)}/kg</td>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>₹{(buyerRate - 0.5).toFixed(2)}/kg</td>
                          <td style={{ padding: '12px 16px', color: 'var(--slate-600)' }}>₹{(buyerRate - avgPayout).toFixed(2)}/kg</td>
                          <td style={{ padding: '12px 16px' }}><Badge variant="info">T+2 Days</Badge></td>
                          <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--slate-700)' }}>Daily Direct Fleet to Vashi APMC & Pune Metro</td>
                        </tr>
                        <tr style={{ backgroundColor: '#ecfdf5', borderTop: '2px solid #86efac' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ color: '#14532d' }}>Your FPO ({user?.profile?.fpo_name || user?.name || 'Your Producer Co.'})</strong>
                              <Badge variant="success">Active Portal</Badge>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#166534' }}>Current Proposed Benchmark</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 800, color: '#15803d', fontSize: '0.95rem' }}>
                            ₹{parseFloat(simFarmerPayout || avgPayout).toFixed(2)}/kg
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0369a1', fontSize: '0.95rem' }}>
                            ₹{parseFloat(simBuyerPrice || buyerRate).toFixed(2)}/kg
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: '#047857' }}>
                            ₹{(parseFloat(simBuyerPrice || buyerRate) - parseFloat(simFarmerPayout || avgPayout)).toFixed(2)}/kg
                          </td>
                          <td style={{ padding: '12px 16px' }}><Badge variant="success">T+2 Days (Escrow)</Badge></td>
                          <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#166534', fontWeight: 600 }}>
                            Direct SIH GovTech Escrow Guarantee • Fast Buyer Settlement
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Interactive Offer Simulator & Profit Optimizer */}
                <Card
                  title="FPO Competitive Offer Simulator & Profit Optimizer"
                  subtitle="Fine-tune your farmer payout and corporate buyer rates to create unbeatable offers that attract both sides"
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
                    {/* Left: Interactive Controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--slate-50)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--slate-800)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sliders size={18} color="var(--primary-700)" />
                        Simulate Offer Parameters
                      </h4>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                          Target Crop
                        </label>
                        <Select
                          options={CROP_OPTIONS}
                          value={simCrop}
                          onChange={(e) => setSimCrop(e.target.value)}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                          Estimated Aggregate Volume (Metric Tonnes)
                        </label>
                        <Input
                          type="number"
                          value={simVolume}
                          onChange={(e) => setSimVolume(e.target.value)}
                          placeholder="e.g. 15"
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                          Your Target Farmer Payout (₹/kg)
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          value={simFarmerPayout}
                          onChange={(e) => setSimFarmerPayout(e.target.value)}
                          placeholder="e.g. 25.50"
                          helperText={`Local APMC Mandi baseline is ₹${apmcRate.toFixed(2)}/kg`}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                          Your Asking Buyer Wholesale Price (₹/kg)
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          value={simBuyerPrice}
                          onChange={(e) => setSimBuyerPrice(e.target.value)}
                          placeholder="e.g. 28.50"
                          helperText={`Average institutional contract rate is ₹${buyerRate.toFixed(2)}/kg`}
                        />
                      </div>
                    </div>

                    {/* Right: Live Impact Evaluation */}
                    {(() => {
                      const v = parseFloat(simVolume) || 15;
                      const fp = parseFloat(simFarmerPayout) || 25.5;
                      const bp = parseFloat(simBuyerPrice) || 28.5;
                      const kgVolume = v * 1000;
                      const totalGross = kgVolume * bp;
                      const totalFarmerPayout = kgVolume * fp;
                      const fpoSurplus = totalGross - totalFarmerPayout;
                      const perKgSpread = bp - fp;
                      const farmerUpliftOverApmc = fp - apmcRate;
                      const buyerSavingsVsMandiWholesale = (buyerRate + 2.0) - bp;

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--slate-800)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calculator size={18} color="var(--primary-700)" />
                            Projected Real-Time Deal Economics
                          </h4>

                          {/* Metric Highlights */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px' }}>
                              <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600, display: 'block' }}>FARMER ATTRACTION</span>
                              <strong style={{ fontSize: '1.25rem', color: '#15803d' }}>
                                +₹{farmerUpliftOverApmc > 0 ? farmerUpliftOverApmc.toFixed(2) : '0.00'}/kg
                              </strong>
                              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#334155' }}>
                                {farmerUpliftOverApmc >= 2
                                  ? '⭐ Excellent: Farmers earn ₹' + Math.round(farmerUpliftOverApmc * 1000) + ' extra per Tonne. High member loyalty.'
                                  : '⚠️ Low Incentive: Consider raising payout by ₹1.00/kg to beat local village middlemen.'}
                              </p>
                            </div>

                            <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '14px' }}>
                              <span style={{ fontSize: '0.78rem', color: '#0369a1', fontWeight: 600, display: 'block' }}>BUYER VALUE SCORE</span>
                              <strong style={{ fontSize: '1.25rem', color: '#0284c7' }}>
                                ₹{buyerSavingsVsMandiWholesale > 0 ? buyerSavingsVsMandiWholesale.toFixed(2) : '0.00'}/kg Savings
                              </strong>
                              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#334155' }}>
                                Institutional buyers save versus spot market markups. Very high bidding velocity expected.
                              </p>
                            </div>
                          </div>

                          {/* Financial Summary Card */}
                          <div style={{ border: '1.5px solid var(--primary-200)', borderRadius: '8px', padding: '16px', backgroundColor: '#ffffff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ color: 'var(--slate-600)', fontSize: '0.88rem' }}>Total Lot Gross Value ({v} Tonnes):</span>
                              <strong style={{ color: 'var(--slate-900)' }}>₹{totalGross.toLocaleString('en-IN')}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ color: 'var(--slate-600)', fontSize: '0.88rem' }}>Total Distributed to Member Farmers:</span>
                              <strong style={{ color: '#15803d' }}>₹{totalFarmerPayout.toLocaleString('en-IN')}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                              <span style={{ fontWeight: 700, color: 'var(--slate-800)' }}>FPO Operating Retention Surplus:</span>
                              <strong style={{ fontWeight: 800, color: 'var(--primary-700)', fontSize: '1.15rem' }}>
                                ₹{fpoSurplus.toLocaleString('en-IN')} ({perKgSpread > 0 ? ((perKgSpread / bp) * 100).toFixed(1) : 0}%)
                              </strong>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '4px' }}>
                              Surplus retained by FPO to cover packhouse sorting, local logistics, and farmer annual dividend reserves.
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                            <Button
                              variant="primary"
                              icon={Layers}
                              onClick={() => {
                                setDirectCrop(simCrop);
                                setDirectQuantity(simVolume);
                                setDirectPrice(simBuyerPrice);
                                setDirectLotModalOpen(true);
                              }}
                            >
                              List Direct Commercial Lot with These Rates
                            </Button>
                            <Button
                              variant="outline-primary"
                              icon={PlusCircle}
                              onClick={() => {
                                setNewCrop(simCrop);
                                setNewExpectedPrice(simBuyerPrice);
                                setCreatePoolModalOpen(true);
                              }}
                            >
                              Start Aggregation Pool
                            </Button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </Card>
              </>
            );
          })()}
        </div>
      )}

      {/* 4. Modal: Add Member Contribution */}
      <Modal
        isOpen={addMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        title={`Add Member Contribution to ${selectedLot?.crop || 'Batch'}`}
        footer={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="outline-primary" onClick={() => setAddMemberModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddMember}
              disabled={isAddingMember || !memberFarmerName || !memberQuantity}
            >
              {isAddingMember ? 'Recording...' : 'Add Contribution'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
              Farmer Full Name *
            </label>
            <Input
              placeholder="e.g. Balasaheb Jadhav"
              value={memberFarmerName}
              onChange={(e) => setMemberFarmerName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                Farmer Mobile (Optional)
              </label>
              <Input
                placeholder="10-digit mobile"
                value={memberPhone}
                onChange={(e) => setMemberPhone(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                Delivered Quantity ({selectedLot?.unit || 'quintal'}) *
              </label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 50"
                value={memberQuantity}
                onChange={(e) => setMemberQuantity(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                Quality Grade
              </label>
              <Select
                options={QUALITY_OPTIONS}
                value={memberGrade}
                onChange={(e) => setMemberGrade(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                Receipt Status
              </label>
              <Select
                options={[
                  { value: 'PLEDGED', label: 'Pledged (Committed on field)' },
                  { value: 'RECEIVED', label: 'Received (In Packhouse)' },
                  { value: 'VERIFIED', label: 'Verified & Weighed' },
                ]}
                value={memberStatus}
                onChange={(e) => setMemberStatus(e.target.value)}
              />
            </div>
          </div>

          {memberQuantity && selectedLot?.expected_price && (
            <div
              style={{
                backgroundColor: 'var(--primary-50)',
                border: '1px solid var(--primary-200)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                fontSize: '0.85rem',
                color: 'var(--primary-900)',
              }}
            >
              <strong>Estimated Farmer Payout: </strong>
              <span>
                ₹{(parseFloat(memberQuantity) * selectedLot.expected_price).toLocaleString('en-IN')}
              </span>{' '}
              <span style={{ color: 'var(--slate-500)' }}>
                (@ ₹{selectedLot.expected_price}/{selectedLot.unit})
              </span>
            </div>
          )}
        </form>
      </Modal>

      {/* 5. Modal: Create New Aggregation Group (For Online Farmers to Join) */}
      <Modal
        isOpen={createPoolModalOpen}
        onClose={() => setCreatePoolModalOpen(false)}
        title="Create Aggregation Group (For Online Farmers to Join)"
        footer={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="outline-primary" onClick={() => setCreatePoolModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreatePool}
              disabled={isCreatingPool || !newLocation}
            >
              {isCreatingPool ? 'Initializing Group...' : 'Create Aggregation Group'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreatePool} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '0.84rem',
              color: '#166534',
            }}
          >
            👥 <strong>Online Farmer Collective Pooling:</strong> Creating this group allows registered online farmers in Maharashtra to discover your FPO, view your minimum guaranteed rate, and pledge their crop harvest online to fill your truckload quota.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                Crop Type *
              </label>
              <Select
                options={CROP_OPTIONS}
                value={newCrop}
                onChange={(e) => setNewCrop(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                Variety *
              </label>
              <Input
                placeholder="e.g. Red Garwa, Bhagwa"
                value={newVariety}
                onChange={(e) => setNewVariety(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                Quantity Unit *
              </label>
              <Select
                options={UNIT_OPTIONS}
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                Target Quality Grade
              </label>
              <Select
                options={QUALITY_OPTIONS}
                value={newQualityGrade}
                onChange={(e) => setNewQualityGrade(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                Aggregation District *
              </label>
              <Select
                options={DISTRICT_OPTIONS}
                value={newDistrict}
                onChange={(e) => setNewDistrict(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                Target Asking Price (₹/{newUnit}) *
              </label>
              <Input
                type="number"
                placeholder="e.g. 1950"
                value={newExpectedPrice}
                onChange={(e) => setNewExpectedPrice(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
              Collection Center / Packhouse Location *
            </label>
            <Input
              placeholder="e.g. Pimpalgaon Baswant APMC Packhouse Hub"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              required
            />
          </div>

          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--slate-500)',
              backgroundColor: 'var(--slate-50)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            ℹ️ This pool will be initialized in <strong>DRAFT</strong> status. You can add individual farmer contributions and check equity percentages before publishing to buyers.
          </div>
        </form>
      </Modal>

      {/* 6. Modal: Apply to Join FPO */}
      {selectedOrgForJoin && (
        <Modal
          isOpen={!!selectedOrgForJoin}
          onClose={() => setSelectedOrgForJoin(null)}
          title={`Join Membership: ${selectedOrgForJoin.name}`}
          footer={
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Button variant="outline-primary" onClick={() => setSelectedOrgForJoin(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleApplyJoin}
                disabled={isSubmittingJoin}
              >
                {isSubmittingJoin ? 'Submitting Application...' : 'Confirm & Apply for Membership'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleApplyJoin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '0.84rem',
                color: '#166534',
              }}
            >
              <strong>FPO Hub:</strong> {selectedOrgForJoin.name} ({selectedOrgForJoin.taluka}, {selectedOrgForJoin.district})
              <div style={{ marginTop: '2px', color: '#334155', fontSize: '0.8rem' }}>
                Joining this FPO gives you direct access to collective crop pooling, shared cold chain storage, and wholesale inputs.
              </div>
            </div>

            <Input
              label="Farmer Full Name *"
              value={user?.profile?.full_name || 'Suresh Patil'}
              disabled
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Contact Phone Number *"
                type="tel"
                value={joinPhone}
                onChange={(e) => setJoinPhone(e.target.value)}
                required
              />
              <Input
                label="Cultivated Land (in Acres) *"
                type="number"
                step="0.1"
                value={joinAcres}
                onChange={(e) => setJoinAcres(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                Primary Crop for Pooling *
              </label>
              <Select
                options={(Array.isArray(selectedOrgForJoin.crops) ? selectedOrgForJoin.crops : (typeof selectedOrgForJoin.crops === 'string' ? selectedOrgForJoin.crops.split(',').map((c) => c.trim()).filter(Boolean) : ['Tomato', 'Onion'])).map((c) => ({ value: c, label: c }))}
                value={joinCrop}
                onChange={(e) => setJoinCrop(e.target.value)}
              />
            </div>

            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              🔒 Under the Maharashtra GovTech agricultural charter, your application is logged securely. The FPO Secretary will review your land coordinates and contact you at {joinPhone} to finalize your membership share.
            </div>
          </form>
        </Modal>
      )}

      {/* 7. Modal: Register / List FPO in Discovery Directory */}
      <Modal
        isOpen={createFpoModalOpen}
        onClose={() => setCreateFpoModalOpen(false)}
        title="Register / List FPO in Maharashtra Farmer Discovery Directory"
        footer={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="outline-primary" onClick={() => setCreateFpoModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateFpoOrg}
              disabled={isCreatingFpoOrg}
            >
              {isCreatingFpoOrg ? 'Publishing FPO...' : 'Publish FPO to Directory'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateFpoOrg} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '0.84rem',
              color: '#1e40af',
            }}
          >
            🏢 <strong>Farmer Producer Company Directory:</strong> Once registered, smallholders across Maharashtra can discover your FPO under the "Explore FPOs" tab and submit membership applications directly into your pool pipeline.
          </div>

          <Input
            label="FPO Organization Legal Name *"
            placeholder="e.g. Sahyadri Agro Farmers Producer Co. Ltd."
            value={fpoOrgName}
            onChange={(e) => setFpoOrgName(e.target.value)}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="MCA / ROC Registration No. *"
              placeholder="e.g. U01111MH2021PTC123456"
              value={fpoOrgRegNo}
              onChange={(e) => setFpoOrgRegNo(e.target.value)}
            />
            <Input
              label="Authorized Contact Phone *"
              type="tel"
              placeholder="10-digit phone"
              value={fpoOrgContact}
              onChange={(e) => setFpoOrgContact(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                District *
              </label>
              <Select
                options={DISTRICT_OPTIONS}
                value={fpoOrgDistrict}
                onChange={(e) => setFpoOrgDistrict(e.target.value)}
              />
            </div>
            <Input
              label="Taluka / Block *"
              placeholder="e.g. Dindori / Baramati"
              value={fpoOrgTaluka}
              onChange={(e) => setFpoOrgTaluka(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Current Member Farmers Count"
              type="number"
              placeholder="e.g. 150"
              value={fpoOrgMembers}
              onChange={(e) => setFpoOrgMembers(e.target.value)}
            />
            <Input
              label="Signatory Aadhaar Card Number"
              placeholder="12-digit Aadhaar (e.g. 5566 7788 9900)"
              value={fpoOrgAadhaar}
              onChange={(e) => setFpoOrgAadhaar(e.target.value)}
            />
          </div>

          <Input
            label="Focus Crops (comma-separated) *"
            placeholder="e.g. Tomato, Onion, Pomegranate, Soybean"
            value={fpoOrgCrops}
            onChange={(e) => setFpoOrgCrops(e.target.value)}
            required
          />

          <Input
            label="Key Member Benefits & Services"
            placeholder="e.g. Assured APMC + ₹2.50 payout, Cold room storage, Bulk seeds discount"
            value={fpoOrgBenefits}
            onChange={(e) => setFpoOrgBenefits(e.target.value)}
          />

          <Input
            label="Packhouse / Office Yard Address"
            placeholder="e.g. APMC Yard Gate 2, Pimpalgaon Baswant"
            value={fpoOrgAddress}
            onChange={(e) => setFpoOrgAddress(e.target.value)}
          />
        </form>
      </Modal>

      {/* 8. Modal: Add Direct Commercial Lot (Direct Sell to Buyers) */}
      <Modal
        isOpen={directLotModalOpen}
        onClose={() => setDirectLotModalOpen(false)}
        title="Add Direct Commercial Lot (Direct Sell to Buyers)"
        footer={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="outline-primary" onClick={() => setDirectLotModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateDirectLot}
              disabled={isSubmittingDirectLot}
            >
              {isSubmittingDirectLot ? 'Listing Lot...' : 'Publish Direct Lot (Sell to Buyers)'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateDirectLot} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '0.84rem',
              color: '#065f46',
            }}
          >
            🌾 <strong>Direct Commercial Produce Listing:</strong> Use this when your FPO has collected bulk produce offline from farmer groups or warehouse inventory and wants to immediately list a verified commercial lot to sell directly to corporate buyers without waiting for digital member pledges.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                Crop *
              </label>
              <Select
                options={CROP_OPTIONS}
                value={directCrop}
                onChange={(e) => setDirectCrop(e.target.value)}
              />
            </div>
            <Input
              label="Variety *"
              placeholder="e.g. Abhinav Hybrid / Red Nashik"
              value={directVariety}
              onChange={(e) => setDirectVariety(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <Input
              label="Aggregated Quantity *"
              type="number"
              step="0.1"
              value={directQuantity}
              onChange={(e) => setDirectQuantity(e.target.value)}
              required
            />
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                Unit *
              </label>
              <Select
                options={UNIT_OPTIONS}
                value={directUnit}
                onChange={(e) => setDirectUnit(e.target.value)}
              />
            </div>
            <Input
              label="Offline Farmers Count *"
              type="number"
              placeholder="e.g. 18"
              value={directOfflineFarmers}
              onChange={(e) => setDirectOfflineFarmers(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label={`Asking / Reserve Price (₹ per ${directUnit}) *`}
              type="number"
              step="0.5"
              placeholder={directUnit === 'quintal' ? 'e.g. 2400' : 'e.g. 24000 or 25'}
              value={directPrice}
              onChange={(e) => setDirectPrice(e.target.value)}
              required
            />
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                Quality Grade *
              </label>
              <Select
                options={QUALITY_OPTIONS}
                value={directQualityGrade}
                onChange={(e) => setDirectQualityGrade(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                District Hub *
              </label>
              <Select
                options={DISTRICT_OPTIONS}
                value={directDistrict}
                onChange={(e) => setDirectDistrict(e.target.value)}
              />
            </div>
            <Input
              label="Packhouse / Aggregation Location *"
              placeholder="e.g. Pimpalgaon Baswant Packhouse Hub"
              value={directLocation}
              onChange={(e) => setDirectLocation(e.target.value)}
              required
            />
          </div>

          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            ⚡ <strong>Status:</strong> This lot will be published as <strong>ACTIVE</strong> immediately on the B2B marketplace. Buyers can submit verified counter-offers or buy at your reserve price.
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FPOAggregationPage;

