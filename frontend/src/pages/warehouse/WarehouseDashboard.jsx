import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, StatusBadge, Input, Select, Modal } from '../../components/common';
import {
  Warehouse as WarehouseIcon,
  Thermometer,
  Droplets,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  User,
  CreditCard,
  FileText,
  Users,
  Layers,
  PieChart,
  ArrowUpRight,
  Download,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ChevronRight,
  Check,
  Activity,
  Landmark,
  Lock,
  Eye,
  RefreshCw,
  Printer
} from 'lucide-react';
import api from '../../services/api';

export const WarehouseDashboard = ({ user, onNavigate, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'occupancy' | 'requests' | 'transactions' | 'profile'
  const [warehouseData, setWarehouseData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(null);

  // Filters & Search for Occupancy
  const [occupancyFilter, setOccupancyFilter] = useState('ALL'); // 'ALL' | 'FARMER' | 'FPO' | 'BUYER'
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Transaction for Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  // Owner Profile Edit State
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Add Cold Storage Facility Modal State
  const [addFacilityModalOpen, setAddFacilityModalOpen] = useState(false);
  const [facilityForm, setFacilityForm] = useState({
    name: '',
    district: 'Nashik',
    location: '',
    storage_type: 'COLD_STORAGE',
    capacity_mt: '1500',
    price_per_kg_per_day: '0.02',
    supported_crops: 'Tomato, Onion, Grapes, Pomegranate',
    temperature_range: '0°C to 4°C'
  });

  const handleAddFacility = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/warehouses', {
        name: facilityForm.name,
        district: facilityForm.district,
        location: facilityForm.location || `${facilityForm.district} Agro Logistics Hub`,
        storage_type: facilityForm.storage_type,
        total_capacity: parseFloat(facilityForm.capacity_mt),
        price_per_kg_per_day: parseFloat(facilityForm.price_per_kg_per_day),
        supported_crops: facilityForm.supported_crops,
        temperature_range: facilityForm.temperature_range
      });
      if (res.success) {
        setAddFacilityModalOpen(false);
        setBanner({
          type: 'success',
          message: `Cold storage facility "${facilityForm.name}" added successfully! It is now instantly visible to Farmers & FPOs in Storage Discovery.`
        });
        setFacilityForm({
          name: '',
          district: 'Nashik',
          location: '',
          storage_type: 'COLD_STORAGE',
          capacity_mt: '1500',
          price_per_kg_per_day: '0.02',
          supported_crops: 'Tomato, Onion, Grapes, Pomegranate',
          temperature_range: '0°C to 4°C'
        });
        loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to add facility');
    }
  };

  // Real-time Occupancy Data by Client (Farmer, FPO, Buyer)
  const [occupancyList, setOccupancyList] = useState([
    {
      id: 'OCC-01',
      clientName: 'Suresh Patil',
      clientType: 'FARMER',
      phone: '+91 98230 12345',
      district: 'Nashik (Dindori)',
      commodity: 'Tomato (Hybrid Cherry & Shivam)',
      chamber: 'Chamber 1 (Bay A & B)',
      temperature: '2.0°C',
      humidity: '90%',
      occupiedTonnage: 450,
      occupiedQuintals: 4500,
      capacityPctOfTotal: 12.8,
      inwardDate: '01 Sep 2026',
      durationDays: 30,
      remainingDays: 20,
      expiryDate: '01 Oct 2026',
      receiptId: 'e-NWR-MH-2026-8812',
      monthlyTariff: 60,
      totalAccruedFee: 27000,
      paymentStatus: 'SETTLED',
      payoutReference: 'UTR-MAHB26248871109'
    },
    {
      id: 'OCC-02',
      clientName: 'Ramesh Khot',
      clientType: 'FARMER',
      phone: '+91 98224 88392',
      district: 'Nashik (Lasalgaon)',
      commodity: 'Red Onion (Export Grade)',
      chamber: 'Chamber 2 (Bay C)',
      temperature: '3.5°C',
      humidity: '85%',
      occupiedTonnage: 380,
      occupiedQuintals: 3800,
      capacityPctOfTotal: 10.9,
      inwardDate: '04 Sep 2026',
      durationDays: 30,
      remainingDays: 23,
      expiryDate: '04 Oct 2026',
      receiptId: 'e-NWR-MH-2026-8940',
      monthlyTariff: 60,
      totalAccruedFee: 22800,
      paymentStatus: 'SETTLED',
      payoutReference: 'UTR-MAHB26247790321'
    },
    {
      id: 'OCC-03',
      clientName: 'Sahyadri Farmers Producer Co. Ltd.',
      clientType: 'FPO',
      phone: '+91 98233 44556',
      district: 'Nashik (Mohadi)',
      commodity: 'Pomegranate (Bhagwa) & Export Grapes',
      chamber: 'Chamber 3 & 4 (Controlled Atmosphere)',
      temperature: '1.5°C',
      humidity: '92%',
      occupiedTonnage: 850,
      occupiedQuintals: 8500,
      capacityPctOfTotal: 24.3,
      inwardDate: '28 Aug 2026',
      durationDays: 45,
      remainingDays: 31,
      expiryDate: '12 Oct 2026',
      receiptId: 'e-NWR-MH-2026-7731',
      monthlyTariff: 60,
      totalAccruedFee: 51000,
      paymentStatus: 'SETTLED',
      payoutReference: 'UTR-MAHB26252904812'
    },
    {
      id: 'OCC-04',
      clientName: 'MahaFresh Wholesale Foods Pvt. Ltd.',
      clientType: 'BUYER',
      phone: '+91 98200 11223',
      district: 'Navi Mumbai (Vashi APMC)',
      commodity: 'Export Table Grapes (Sonaka & Thompson)',
      chamber: 'Chamber 5 (Bay A)',
      temperature: '0.8°C',
      humidity: '88%',
      occupiedTonnage: 400,
      occupiedQuintals: 4000,
      capacityPctOfTotal: 11.4,
      inwardDate: '06 Sep 2026',
      durationDays: 15,
      remainingDays: 10,
      expiryDate: '21 Sep 2026',
      receiptId: 'e-NWR-MH-2026-9204',
      monthlyTariff: 60,
      totalAccruedFee: 24000,
      paymentStatus: 'IN_ESCROW',
      payoutReference: 'ESCROW-DEP-992014'
    }
  ]);

  // Transaction History & Settlement Ledger
  const [transactions, setTransactions] = useState([
    {
      id: 'TXN-ST-2026-904',
      date: '08 Sep 2026, 14:30',
      clientName: 'Sahyadri Farmers Producer Co.',
      clientType: 'FPO',
      commodity: 'Pomegranate & Grapes',
      duration: '30 Days Batch Advance',
      amount: 51000,
      method: 'NABARD Nodal Escrow Transfer',
      status: 'SETTLED_TO_BANK',
      bankRef: 'MAHB26252904812',
      accountCredited: 'Bank of Maharashtra (XXXX-7741)',
      chamber: 'Chamber 3 & 4'
    },
    {
      id: 'TXN-ST-2026-871',
      date: '05 Sep 2026, 11:15',
      clientName: 'Suresh Patil',
      clientType: 'FARMER',
      commodity: 'Tomato (Hybrid)',
      duration: '14 Days Pre-Cooling',
      amount: 27000,
      method: 'UPI / Gov Subsidized Escrow',
      status: 'SETTLED_TO_BANK',
      bankRef: 'MAHB26248871109',
      accountCredited: 'Bank of Maharashtra (XXXX-7741)',
      chamber: 'Chamber 1'
    },
    {
      id: 'TXN-ST-2026-845',
      date: '06 Sep 2026, 16:45',
      clientName: 'MahaFresh Wholesale Foods',
      clientType: 'BUYER',
      commodity: 'Table Grapes',
      duration: '15 Days Export Holding',
      amount: 24000,
      method: 'Corporate Buyer Escrow Deposit',
      status: 'IN_ESCROW',
      bankRef: 'ESCROW-DEP-992014',
      accountCredited: 'Escrow Account (Pending Dispatch)',
      chamber: 'Chamber 5'
    },
    {
      id: 'TXN-ST-2026-790',
      date: '04 Sep 2026, 09:20',
      clientName: 'Ramesh Khot',
      clientType: 'FARMER',
      commodity: 'Red Onion',
      duration: '30 Days Storage',
      amount: 22800,
      method: 'Kisan Credit Card (KCC) NetBanking',
      status: 'SETTLED_TO_BANK',
      bankRef: 'MAHB26247790321',
      accountCredited: 'Bank of Maharashtra (XXXX-7741)',
      chamber: 'Chamber 2'
    },
    {
      id: 'TXN-ST-2026-650',
      date: '25 Aug 2026, 17:00',
      clientName: 'Nashik Citrus Growers FPO',
      clientType: 'FPO',
      commodity: 'Sweet Orange / Mosambi',
      duration: '21 Days Storage',
      amount: 37600,
      method: 'Direct Bank Transfer (NEFT)',
      status: 'SETTLED_TO_BANK',
      bankRef: 'MAHB26237650493',
      accountCredited: 'Bank of Maharashtra (XXXX-7741)',
      chamber: 'Chamber 1 & 2'
    },
    {
      id: 'TXN-ST-2026-512',
      date: '18 Aug 2026, 10:45',
      clientName: 'Kisan Vikas Producer Co.',
      clientType: 'FPO',
      commodity: 'Ginger & Turmeric',
      duration: '15 Days Storage',
      amount: 24000,
      method: 'Escrow Direct Settlement',
      status: 'SETTLED_TO_BANK',
      bankRef: 'MAHB26230512994',
      accountCredited: 'Bank of Maharashtra (XXXX-7741)',
      chamber: 'Chamber 3'
    }
  ]);

  // Operator & Facility Profile
  const [profileData, setProfileData] = useState({
    operatorName: user?.profile?.operator_name || user?.name || 'Rajesh Deshpande',
    facilityName: 'Nashik Agro Cold Storage & Logistics Ltd.',
    wdraLicense: 'WDRA-MH-NSK-2023-441',
    wdraGrade: 'Class-A Accredited Multi-Commodity Cold Chain',
    phone: user?.phone || '+91 98300 22334',
    email: 'rajesh.deshpande@nashikcoldchain.in',
    district: 'Nashik',
    state: 'Maharashtra',
    address: 'Plot 42, MIDC Agro Food Park, Dindori Road, Nashik - 422004',
    // Aadhaar Details
    aadhaarMasked: user?.profile?.aadhaar_masked || 'XXXX-XXXX-3321',
    aadhaarStatus: 'VERIFIED_UIDAI',
    // Bank Account Details for Payouts
    bankName: user?.profile?.bank_name || 'Bank of Maharashtra',
    accountHolder: user?.profile?.account_holder_name || 'Rajesh V. Deshpande / Nashik Agro',
    bankAccountMasked: user?.profile?.bank_account_masked || 'XXXX-XXXX-7741',
    ifscCode: user?.profile?.ifsc_code_masked || 'MAHB0000412',
    bankBranch: 'MIDC Dindori Industrial Branch, Nashik',
    payoutMode: 'Direct Benefit Transfer (DBT) & Automated Escrow Clearance',
    // Technical Specifications
    chambersCount: 6,
    totalCapacityTonnes: 3500,
    tempRange: '-5°C to 15°C',
    humidityRange: '85% - 95% RH',
    powerBackup: '250 kVA Auto-Synchronized Genset (100% Zero-Loss Backup)',
    insurancePolicy: 'Oriental Insurance Agri-Commodity Floater #OIC-AG-2026-881'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/warehouses');
      if (res && res.warehouses && res.warehouses.length > 0) {
        setWarehouseData(res.warehouses[0]);
      }
      // Demo Inbound Booking Requests
      setBookings([
        {
          id: 101,
          farmer_name: 'Bhaskar Jadhav',
          entity_type: 'FARMER',
          crop: 'Green Capsicum & Chili',
          quantity: 2500,
          unit: 'kg',
          duration_days: 14,
          requested_date: '2026-09-10',
          status: 'PENDING',
          preferred_temp: '7°C - 10°C',
          suggested_chamber: 'Chamber 6 (Bay A)'
        },
        {
          id: 102,
          farmer_name: 'Godavari Krushi FPO',
          entity_type: 'FPO',
          crop: 'Pomegranate (Export Grade)',
          quantity: 12000,
          unit: 'kg',
          duration_days: 30,
          requested_date: '2026-09-09',
          status: 'PENDING',
          preferred_temp: '4.0°C',
          suggested_chamber: 'Chamber 6 (Bay B)'
        },
        {
          id: 103,
          farmer_name: 'Reliance Retail Wholesale',
          entity_type: 'BUYER',
          crop: 'Cold-Chain Stored Seed Potatoes',
          quantity: 35000,
          unit: 'kg',
          duration_days: 21,
          requested_date: '2026-09-08',
          status: 'APPROVED',
          allocated_chamber: 'Chamber 5 (Pre-Cooling)'
        }
      ]);
    } catch (err) {
      console.error('[WarehouseDashboard Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBookingAction = (bookingId, action) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' } : b))
    );
    setBanner({
      type: 'success',
      message: `Booking #${bookingId} has been ${action === 'APPROVE' ? 'approved and bay reserved' : 'declined'}.`
    });
    setTimeout(() => setBanner(null), 5000);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setEditProfileModal(false);
    setProfileSuccessMsg('Profile and Banking details updated successfully!');
    setTimeout(() => setProfileSuccessMsg(''), 4000);
  };

  // Calculations for Real-time Dashboard
  const totalCapacity = profileData.totalCapacityTonnes; // 3500 tonnes
  const farmerOccupied = occupancyList
    .filter((o) => o.clientType === 'FARMER')
    .reduce((sum, o) => sum + o.occupiedTonnage, 0); // 830
  const fpoOccupied = occupancyList
    .filter((o) => o.clientType === 'FPO')
    .reduce((sum, o) => sum + o.occupiedTonnage, 0); // 850
  const buyerOccupied = occupancyList
    .filter((o) => o.clientType === 'BUYER')
    .reduce((sum, o) => sum + o.occupiedTonnage, 0); // 400

  const totalOccupied = farmerOccupied + fpoOccupied + buyerOccupied; // 2080 tonnes
  const availableSpace = totalCapacity - totalOccupied; // 1420 tonnes
  const capacityPct = Math.round((totalOccupied / totalCapacity) * 100); // 59%

  const farmerPct = Math.round((farmerOccupied / totalCapacity) * 100);
  const fpoPct = Math.round((fpoOccupied / totalCapacity) * 100);
  const buyerPct = Math.round((buyerOccupied / totalCapacity) * 100);
  const availablePct = 100 - capacityPct;

  // Filtered Occupancy List
  const filteredOccupancy = occupancyList.filter((item) => {
    const matchesFilter = occupancyFilter === 'ALL' || item.clientType === occupancyFilter;
    const matchesSearch =
      item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.receiptId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.chamber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Financial aggregates
  const totalBilled = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalSettled = transactions
    .filter((t) => t.status === 'SETTLED_TO_BANK')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalInEscrow = transactions
    .filter((t) => t.status === 'IN_ESCROW')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '16px' }}>
      {/* Top Banner & Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 65%, #059669 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#ffffff',
          marginBottom: '20px',
          boxShadow: '0 8px 24px rgba(6, 78, 59, 0.22)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background ambient pattern */}
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <div
                style={{
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  borderRadius: '10px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <WarehouseIcon size={28} color="#a7f3d0" />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                Cold Storage Operator Portal
              </h1>
              <span
                style={{
                  backgroundColor: 'rgba(167, 243, 208, 0.22)',
                  color: '#a7f3d0',
                  border: '1px solid rgba(167, 243, 208, 0.4)',
                  padding: '3px 10px',
                  borderRadius: '16px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ShieldCheck size={14} /> {profileData.wdraLicense}
              </span>
            </div>
            <p style={{ color: '#d1fae5', margin: 0, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600 }}>{profileData.facilityName}</span>
              <span>•</span>
              <span>Operator: <strong>{profileData.operatorName}</strong></span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Landmark size={14} /> Payout: {profileData.bankName} ({profileData.bankAccountMasked})
              </span>
            </p>
          </div>

          {/* Key quick indicators */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.14)', padding: '8px 16px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Live Temp</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>2.8°C</div>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.14)', padding: '8px 16px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Humidity</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>88.5%</div>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.14)', padding: '8px 16px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Occupancy</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fef08a' }}>{capacityPct}%</div>
            </div>
            <button
              type="button"
              onClick={() => setAddFacilityModalOpen(true)}
              style={{
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                transition: 'all 0.15s ease',
              }}
            >
              <WarehouseIcon size={16} />
              + Add Cold Storage
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Exit Portal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alert Banners */}
      {banner && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
            color: '#166534',
            borderRadius: '10px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={18} color="#16a34a" />
          {banner.message}
        </div>
      )}

      {profileSuccessMsg && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
            color: '#166534',
            borderRadius: '10px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={18} color="#16a34a" />
          {profileSuccessMsg}
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '2px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          backgroundColor: '#f8fafc',
          padding: '6px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '9px 15px',
            backgroundColor: activeTab === 'overview' ? '#065f46' : 'transparent',
            border: 'none',
            color: activeTab === 'overview' ? '#ffffff' : '#475569',
            fontWeight: activeTab === 'overview' ? 700 : 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          <Activity size={17} />
          Real-Time Dashboard
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('occupancy')}
          style={{
            padding: '9px 15px',
            backgroundColor: activeTab === 'occupancy' ? '#065f46' : 'transparent',
            border: 'none',
            color: activeTab === 'occupancy' ? '#ffffff' : '#475569',
            fontWeight: activeTab === 'occupancy' ? 700 : 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          <Users size={17} />
          Client Allocation
          <span
            style={{
              backgroundColor: activeTab === 'occupancy' ? 'rgba(255,255,255,0.25)' : '#d1fae5',
              color: activeTab === 'occupancy' ? '#ffffff' : '#065f46',
              padding: '1px 6px',
              borderRadius: '10px',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}
          >
            {occupancyList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          style={{
            padding: '9px 15px',
            backgroundColor: activeTab === 'transactions' ? '#065f46' : 'transparent',
            border: 'none',
            color: activeTab === 'transactions' ? '#ffffff' : '#475569',
            fontWeight: activeTab === 'transactions' ? 700 : 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          <CreditCard size={17} />
          Transactions & Payouts
          <span
            style={{
              backgroundColor: activeTab === 'transactions' ? 'rgba(255,255,255,0.25)' : '#e0f2fe',
              color: activeTab === 'transactions' ? '#ffffff' : '#0369a1',
              padding: '1px 6px',
              borderRadius: '10px',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}
          >
            ₹{totalSettled.toLocaleString()}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          style={{
            padding: '9px 15px',
            backgroundColor: activeTab === 'requests' ? '#065f46' : 'transparent',
            border: 'none',
            color: activeTab === 'requests' ? '#ffffff' : '#475569',
            fontWeight: activeTab === 'requests' ? 700 : 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          <Package size={17} />
          Inbound Requests
          {bookings.filter((b) => b.status === 'PENDING').length > 0 && (
            <span
              style={{
                backgroundColor: activeTab === 'requests' ? '#f59e0b' : '#fef3c7',
                color: activeTab === 'requests' ? '#ffffff' : '#92400e',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              {bookings.filter((b) => b.status === 'PENDING').length} Pending
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '9px 15px',
            backgroundColor: activeTab === 'profile' ? '#065f46' : 'transparent',
            border: 'none',
            color: activeTab === 'profile' ? '#ffffff' : '#475569',
            fontWeight: activeTab === 'profile' ? 700 : 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '8px',
            transition: 'all 0.15s ease',
          }}
        >
          <User size={17} />
          Owner & Bank Profile
          <span
            style={{
              backgroundColor: activeTab === 'profile' ? 'rgba(255,255,255,0.25)' : '#ecfdf5',
              color: activeTab === 'profile' ? '#ffffff' : '#065f46',
              padding: '1px 6px',
              borderRadius: '10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            <ShieldCheck size={12} /> Verified
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: REAL-TIME STORAGE DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Facility Top Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <Card style={{ padding: '18px', borderLeft: '4px solid #059669' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Total Storage Capacity
                  </div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                    {totalCapacity} Tonnes
                  </div>
                </div>
                <div style={{ backgroundColor: '#ecfdf5', padding: '10px', borderRadius: '10px' }}>
                  <WarehouseIcon size={24} color="#059669" />
                </div>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '6px' }}>
                Occupied: <strong>{totalOccupied} T</strong> ({capacityPct}%) • Available: <strong>{availableSpace} T</strong>
              </div>
            </Card>

            <Card style={{ padding: '18px', borderLeft: '4px solid #2563eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Smallholder Farmers Space
                  </div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e40af', margin: '4px 0' }}>
                    {farmerOccupied} Tonnes
                  </div>
                </div>
                <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '10px' }}>
                  <User size={24} color="#2563eb" />
                </div>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '6px' }}>
                <strong>{farmerPct}%</strong> of total facility • 2 Farmers allocated
              </div>
            </Card>

            <Card style={{ padding: '18px', borderLeft: '4px solid #d97706' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    FPO Collective Storage
                  </div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#b45309', margin: '4px 0' }}>
                    {fpoOccupied} Tonnes
                  </div>
                </div>
                <div style={{ backgroundColor: '#fef3c7', padding: '10px', borderRadius: '10px' }}>
                  <Users size={24} color="#d97706" />
                </div>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '6px' }}>
                <strong>{fpoPct}%</strong> of total facility • Sahyadri FPO Collective
              </div>
            </Card>

            <Card style={{ padding: '18px', borderLeft: '4px solid #7c3aed' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Commercial Wholesale Buyers
                  </div>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#6d28d9', margin: '4px 0' }}>
                    {buyerOccupied} Tonnes
                  </div>
                </div>
                <div style={{ backgroundColor: '#f5f3ff', padding: '10px', borderRadius: '10px' }}>
                  <Building2 size={24} color="#7c3aed" />
                </div>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '6px' }}>
                <strong>{buyerPct}%</strong> of total facility • MahaFresh Foods Ltd
              </div>
            </Card>
          </div>

          {/* Real-time Visual Occupancy Bar */}
          <Card style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Real-time Capacity Occupancy Bar
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Live visual distribution of {totalCapacity} Tonnes capacity across Farmers, FPOs, Commercial Buyers, and Free Buffer
                </p>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#059669', backgroundColor: '#ecfdf5', padding: '6px 12px', borderRadius: '20px' }}>
                Overall Occupancy: {capacityPct}% ({totalOccupied} / {totalCapacity} Tonnes)
              </div>
            </div>

            {/* Segmented Multi-color Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '24px',
                borderRadius: '12px',
                backgroundColor: '#e2e8f0',
                display: 'flex',
                overflow: 'hidden',
                marginBottom: '16px',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              {/* Farmer Segment */}
              <div
                style={{
                  width: `${farmerPct}%`,
                  backgroundColor: '#2563eb',
                  transition: 'width 0.4s ease',
                  title: `Farmers: ${farmerOccupied} T (${farmerPct}%)`,
                }}
              />
              {/* FPO Segment */}
              <div
                style={{
                  width: `${fpoPct}%`,
                  backgroundColor: '#d97706',
                  transition: 'width 0.4s ease',
                  title: `FPOs: ${fpoOccupied} T (${fpoPct}%)`,
                }}
              />
              {/* Buyer Segment */}
              <div
                style={{
                  width: `${buyerPct}%`,
                  backgroundColor: '#7c3aed',
                  transition: 'width 0.4s ease',
                  title: `Buyers: ${buyerOccupied} T (${buyerPct}%)`,
                }}
              />
              {/* Free Segment */}
              <div
                style={{
                  width: `${availablePct}%`,
                  backgroundColor: '#10b981',
                  transition: 'width 0.4s ease',
                  title: `Available: ${availableSpace} T (${availablePct}%)`,
                }}
              />
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#2563eb', display: 'inline-block' }} />
                <span><strong>Farmers:</strong> {farmerOccupied} T ({farmerPct}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#d97706', display: 'inline-block' }} />
                <span><strong>FPOs:</strong> {fpoOccupied} T ({fpoPct}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#7c3aed', display: 'inline-block' }} />
                <span><strong>Commercial Buyers:</strong> {buyerOccupied} T ({buyerPct}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#10b981', display: 'inline-block' }} />
                <span><strong>Available Buffer:</strong> {availableSpace} T ({availablePct}%)</span>
              </div>
            </div>
          </Card>

          {/* Chamber Live Grid Visualizer */}
          <Card style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Live Chamber Floor Map & IoT Telemetry
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Real-time micro-climate sensors, allocated client consignments, and e-NWR receipt tracking
                </p>
              </div>
              <Button
                variant="outline-primary"
                size="sm"
                icon={RefreshCw}
                onClick={loadData}
                style={{ fontSize: '0.8rem' }}
              >
                Refresh Sensors
              </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {/* Chamber 1 */}
              <div
                style={{
                  border: '1px solid #bfdbfe',
                  borderRadius: '12px',
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderTop: '4px solid #2563eb',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#1e293b' }}>Chamber 1 — Bay A & B</div>
                  <span style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                    FARMER ALLOCATION
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '6px' }}>
                  Occupant: <strong>Suresh Patil</strong> (Farmer)
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '10px' }}>
                  Crop: Tomato (Hybrid) • <strong>450 Tonnes</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                  <div><Thermometer size={14} style={{ display: 'inline', verticalAlign: 'middle', color: '#059669' }} /> <strong>2.0°C</strong> (Target: 2°C)</div>
                  <div><Droplets size={14} style={{ display: 'inline', verticalAlign: 'middle', color: '#0284c7' }} /> <strong>90% RH</strong></div>
                  <div style={{ color: '#059669', fontWeight: 600 }}>Active</div>
                </div>
              </div>

              {/* Chamber 2 */}
              <div
                style={{
                  border: '1px solid #bfdbfe',
                  borderRadius: '12px',
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderTop: '4px solid #2563eb',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#1e293b' }}>Chamber 2 — Bay C</div>
                  <span style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                    FARMER ALLOCATION
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '6px' }}>
                  Occupant: <strong>Ramesh Khot</strong> (Farmer)
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '10px' }}>
                  Crop: Red Onion (Export) • <strong>380 Tonnes</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                  <div><Thermometer size={14} style={{ display: 'inline', verticalAlign: 'middle', color: '#059669' }} /> <strong>3.5°C</strong> (Target: 3-4°C)</div>
                  <div><Droplets size={14} style={{ display: 'inline', verticalAlign: 'middle', color: '#0284c7' }} /> <strong>85% RH</strong></div>
                  <div style={{ color: '#059669', fontWeight: 600 }}>Active</div>
                </div>
              </div>

              {/* Chamber 3 & 4 */}
              <div
                style={{
                  border: '1px solid #fde68a',
                  borderRadius: '12px',
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderTop: '4px solid #d97706',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#1e293b' }}>Chambers 3 & 4 — CA Module</div>
                  <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                    FPO COLLECTIVE
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '6px' }}>
                  Occupant: <strong>Sahyadri Farmers Producer Co.</strong>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '10px' }}>
                  Crop: Pomegranate & Grapes • <strong>850 Tonnes</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                  <div><Thermometer size={14} style={{ display: 'inline', verticalAlign: 'middle', color: '#059669' }} /> <strong>1.5°C</strong> (Target: 1.5°C)</div>
                  <div><Droplets size={14} style={{ display: 'inline', verticalAlign: 'middle', color: '#0284c7' }} /> <strong>92% RH</strong></div>
                  <div style={{ color: '#059669', fontWeight: 600 }}>Active</div>
                </div>
              </div>

              {/* Chamber 5 */}
              <div
                style={{
                  border: '1px solid #ddd6fe',
                  borderRadius: '12px',
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderTop: '4px solid #7c3aed',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#1e293b' }}>Chamber 5 — Bay A</div>
                  <span style={{ backgroundColor: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                    WHOLESALE BUYER
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '6px' }}>
                  Occupant: <strong>MahaFresh Wholesale Foods</strong>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '10px' }}>
                  Crop: Export Table Grapes • <strong>400 Tonnes</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                  <div><Thermometer size={14} style={{ display: 'inline', verticalAlign: 'middle', color: '#059669' }} /> <strong>0.8°C</strong> (Target: 1°C)</div>
                  <div><Droplets size={14} style={{ display: 'inline', verticalAlign: 'middle', color: '#0284c7' }} /> <strong>88% RH</strong></div>
                  <div style={{ color: '#059669', fontWeight: 600 }}>Active</div>
                </div>
              </div>

              {/* Chamber 6 */}
              <div
                style={{
                  border: '1px solid #a7f3d0',
                  borderRadius: '12px',
                  padding: '16px',
                  backgroundColor: '#f0fdf4',
                  borderTop: '4px solid #10b981',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#065f46' }}>Chamber 6 — Multi-Bay Free Buffer</div>
                  <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                    AVAILABLE SPACE
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#166534', marginBottom: '6px' }}>
                  Ready for Inbound Producers & Bookings
                </div>
                <div style={{ fontSize: '0.82rem', color: '#15803d', marginBottom: '10px' }}>
                  Free Capacity: <strong>1,420 Tonnes</strong> (Pre-cooled)
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '0.8rem' }}>
                  <div><Thermometer size={14} style={{ display: 'inline', verticalAlign: 'middle', color: '#059669' }} /> <strong>1.2°C</strong> (Standby)</div>
                  <div><Droplets size={14} style={{ display: 'inline', verticalAlign: 'middle', color: '#0284c7' }} /> <strong>89% RH</strong></div>
                  <div style={{ color: '#15803d', fontWeight: 600 }}>Ready</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SPACE OCCUPANCY BREAKDOWN (FARMERS, FPOs, BUYERS) */}
      {/* ========================================================================= */}
      {activeTab === 'occupancy' && (
        <Card style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Real-Time Space Occupancy Ledger
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                Detailed tracking of which Farmer, FPO, or Wholesale Buyer is occupying capacity, chamber location, and e-NWR receipts
              </p>
            </div>

            {/* Filter Buttons & Search */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
                <button
                  type="button"
                  onClick={() => setOccupancyFilter('ALL')}
                  style={{
                    border: 'none',
                    backgroundColor: occupancyFilter === 'ALL' ? '#ffffff' : 'transparent',
                    color: occupancyFilter === 'ALL' ? '#0f172a' : '#64748b',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: occupancyFilter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  All ({occupancyList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOccupancyFilter('FARMER')}
                  style={{
                    border: 'none',
                    backgroundColor: occupancyFilter === 'FARMER' ? '#2563eb' : 'transparent',
                    color: occupancyFilter === 'FARMER' ? '#ffffff' : '#64748b',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Farmers (830 T)
                </button>
                <button
                  type="button"
                  onClick={() => setOccupancyFilter('FPO')}
                  style={{
                    border: 'none',
                    backgroundColor: occupancyFilter === 'FPO' ? '#d97706' : 'transparent',
                    color: occupancyFilter === 'FPO' ? '#ffffff' : '#64748b',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  FPOs (850 T)
                </button>
                <button
                  type="button"
                  onClick={() => setOccupancyFilter('BUYER')}
                  style={{
                    border: 'none',
                    backgroundColor: occupancyFilter === 'BUYER' ? '#7c3aed' : 'transparent',
                    color: occupancyFilter === 'BUYER' ? '#ffffff' : '#64748b',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Buyers (400 T)
                </button>
              </div>

              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input
                  type="text"
                  placeholder="Search client or crop..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 34px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Occupancy Table */}
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px' }}>Client & Stakeholder</th>
                  <th style={{ padding: '12px 16px' }}>Commodity & e-NWR ID</th>
                  <th style={{ padding: '12px 16px' }}>Chamber Location</th>
                  <th style={{ padding: '12px 16px' }}>Space Occupied</th>
                  <th style={{ padding: '12px 16px' }}>Tenure & Remaining</th>
                  <th style={{ padding: '12px 16px' }}>Accrued Fee</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOccupancy.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.clientName}</span>
                        <span
                          style={{
                            backgroundColor:
                              item.clientType === 'FARMER'
                                ? '#dbeafe'
                                : item.clientType === 'FPO'
                                ? '#fef3c7'
                                : '#ede9fe',
                            color:
                              item.clientType === 'FARMER'
                                ? '#1d4ed8'
                                : item.clientType === 'FPO'
                                ? '#b45309'
                                : '#6d28d9',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                          }}
                        >
                          {item.clientType}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {item.phone} • {item.district}
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.commodity}</div>
                      <div style={{ fontSize: '0.78rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <ShieldCheck size={12} /> {item.receiptId}
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#334155' }}>{item.chamber}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {item.temperature} • {item.humidity}
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                        {item.occupiedTonnage} Tonnes
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        ({item.occupiedQuintals.toLocaleString()} Qt • {item.capacityPctOfTotal}% facility)
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#334155' }}>
                        {item.inwardDate}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: item.remainingDays <= 10 ? '#dc2626' : '#059669', fontWeight: 600 }}>
                        {item.remainingDays} days left (Exp: {item.expiryDate})
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        ₹{item.totalAccruedFee.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        ₹{item.monthlyTariff}/qt/mo
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      {item.paymentStatus === 'SETTLED' ? (
                        <div>
                          <span
                            style={{
                              backgroundColor: '#ecfdf5',
                              color: '#065f46',
                              border: '1px solid #a7f3d0',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <CheckCircle2 size={13} color="#059669" /> Settled to Bank
                          </span>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                            {item.payoutReference.slice(0, 16)}...
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span
                            style={{
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              border: '1px solid #fde68a',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Clock size={13} color="#d97706" /> In Escrow
                          </span>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                            Auto-release on exit
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TRANSACTION HISTORY & BANK SETTLEMENT LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'transactions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Revenue & Settlement Metric Highlights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <Card style={{ padding: '18px', borderLeft: '4px solid #059669' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Storage Fees Billed
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
                ₹{totalBilled.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrendingUp size={14} /> Current Month Cycle (Sep 2026)
              </div>
            </Card>

            <Card style={{ padding: '18px', borderLeft: '4px solid #16a34a' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Settled to Owner Bank Account
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a', margin: '4px 0' }}>
                ₹{totalSettled.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                Credited to: <strong>{profileData.bankName}</strong> ({profileData.bankAccountMasked})
              </div>
            </Card>

            <Card style={{ padding: '18px', borderLeft: '4px solid #d97706' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                In Escrow / Pending Release
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#b45309', margin: '4px 0' }}>
                ₹{totalInEscrow.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#d97706' }}>
                NABARD Protected (Releases upon cargo gate pass)
              </div>
            </Card>

            <Card style={{ padding: '18px', borderLeft: '4px solid #2563eb' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Settlement Bank Status
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e40af', margin: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={20} color="#2563eb" /> Active & Verified
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                Auto DBT & RTGS Payout Daily at 18:00 IST
              </div>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Storage Fee Settlement & Transaction History
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                  Direct credits to {profileData.bankName} (IFSC: {profileData.ifscCode}) from Farmers, FPOs, and Buyers
                </p>
              </div>

              <Button
                variant="outline-primary"
                size="sm"
                icon={Download}
                onClick={() => alert('Downloading GST-compliant Cold Storage Settlement Statement (PDF)...')}
                style={{ fontSize: '0.82rem' }}
              >
                Export Statement
              </Button>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px 16px' }}>Txn ID & Date</th>
                    <th style={{ padding: '12px 16px' }}>Client & Stakeholder</th>
                    <th style={{ padding: '12px 16px' }}>Commodity & Chamber</th>
                    <th style={{ padding: '12px 16px' }}>Duration</th>
                    <th style={{ padding: '12px 16px' }}>Amount (₹)</th>
                    <th style={{ padding: '12px 16px' }}>Payment Mode</th>
                    <th style={{ padding: '12px 16px' }}>Settlement Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{tx.id}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{tx.date}</div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{tx.clientName}</div>
                        <span
                          style={{
                            backgroundColor:
                              tx.clientType === 'FARMER'
                                ? '#dbeafe'
                                : tx.clientType === 'FPO'
                                ? '#fef3c7'
                                : '#ede9fe',
                            color:
                              tx.clientType === 'FARMER'
                                ? '#1d4ed8'
                                : tx.clientType === 'FPO'
                                ? '#b45309'
                                : '#6d28d9',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                          }}
                        >
                          {tx.clientType}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 500, color: '#334155' }}>{tx.commodity}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{tx.chamber}</div>
                      </td>

                      <td style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem' }}>
                        {tx.duration}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#065f46', fontSize: '1rem' }}>
                          ₹{tx.amount.toLocaleString()}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#475569' }}>
                        <div>{tx.method}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Ref: {tx.bankRef}</div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {tx.status === 'SETTLED_TO_BANK' ? (
                          <span
                            style={{
                              backgroundColor: '#ecfdf5',
                              color: '#065f46',
                              border: '1px solid #a7f3d0',
                              padding: '3px 8px',
                              borderRadius: '16px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <CheckCircle2 size={12} color="#059669" /> Settled to Bank
                          </span>
                        ) : (
                          <span
                            style={{
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              border: '1px solid #fde68a',
                              padding: '3px 8px',
                              borderRadius: '16px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Clock size={12} color="#d97706" /> In Escrow
                          </span>
                        )}
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                          {tx.accountCredited}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={FileText}
                          onClick={() => {
                            setSelectedInvoice(tx);
                            setInvoiceModalOpen(true);
                          }}
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: INBOUND BOOKING REQUESTS */}
      {/* ========================================================================= */}
      {activeTab === 'requests' && (
        <Card style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Inbound Producer & Buyer Storage Booking Requests
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                Review incoming cold room allocation requests and assign appropriate temperature-controlled bays
              </p>
            </div>
            <Badge variant="success" size="md">
              {availableSpace} Tonnes Available Space
            </Badge>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px' }}>Producer / Entity</th>
                  <th style={{ padding: '12px 16px' }}>Crop Consignment</th>
                  <th style={{ padding: '12px 16px' }}>Volume</th>
                  <th style={{ padding: '12px 16px' }}>Duration & Date</th>
                  <th style={{ padding: '12px 16px' }}>Required Temperature</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Operator Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{b.farmer_name}</div>
                      <span
                        style={{
                          backgroundColor:
                            b.entity_type === 'FARMER'
                              ? '#dbeafe'
                              : b.entity_type === 'FPO'
                              ? '#fef3c7'
                              : '#ede9fe',
                          color:
                            b.entity_type === 'FARMER'
                              ? '#1d4ed8'
                              : b.entity_type === 'FPO'
                              ? '#b45309'
                              : '#6d28d9',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                        }}
                      >
                        {b.entity_type || 'PRODUCER'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>
                      {b.crop}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {b.quantity} {b.unit}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {(b.quantity / 1000).toFixed(2)} Tonnes
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#334155' }}>{b.duration_days} Days</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Req: {b.requested_date}</div>
                    </td>

                    <td style={{ padding: '14px 16px', color: '#059669', fontWeight: 600, fontSize: '0.85rem' }}>
                      <Thermometer size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {b.preferred_temp || '0°C to 4°C'}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <Badge variant={b.status === 'APPROVED' ? 'success' : b.status === 'PENDING' ? 'warning' : 'danger'}>
                        {b.status}
                      </Badge>
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      {b.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleBookingAction(b.id, 'APPROVE')}
                            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                          >
                            Approve Bay
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleBookingAction(b.id, 'REJECT')}
                            style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                          >
                            Decline
                          </Button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 600 }}>
                          ✓ Bay Allocated ({b.allocated_chamber || 'Chamber 6'})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: OWNER & FACILITY KYC / BANK PROFILE */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* Owner & Facility Details Card */}
          <Card style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ backgroundColor: '#ecfdf5', padding: '10px', borderRadius: '10px' }}>
                  <User size={24} color="#059669" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                    Cold Storage Owner Profile
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                    Verified Operator Credentials & Contact Information
                  </p>
                </div>
              </div>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setEditProfileModal(true)}
                style={{ fontSize: '0.8rem' }}
              >
                Edit Info
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Operator / Owner Name:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{profileData.operatorName}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Cold Storage Facility:</span>
                <span style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>{profileData.facilityName}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Contact Phone:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{profileData.phone}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Email Address:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{profileData.email}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Location / Address:</span>
                <span style={{ fontWeight: 500, color: '#0f172a', textAlign: 'right', maxWidth: '240px' }}>
                  {profileData.address}
                </span>
              </div>

              {/* Masked Aadhaar Card Section */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '14px',
                  marginTop: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} color="#059669" /> Aadhaar Identification (UIDAI)
                  </span>
                  <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                    e-KYC VERIFIED
                  </span>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.08em' }}>
                  {profileData.aadhaarMasked}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                  Aadhaar verified with Govt of India UIDAI Registry for storage custodian operations.
                </p>
              </div>
            </div>
          </Card>

          {/* Settlement Bank Account Details Card */}
          <Card style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '10px' }}>
                <Landmark size={24} color="#2563eb" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Settlement Bank Account Details
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Configured Bank for Farmer Storage Fees, FPO Payouts & Govt Subsidies
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Bank Name:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{profileData.bankName}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Account Holder:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{profileData.accountHolder}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Account Number:</span>
                <span style={{ fontWeight: 800, color: '#0f172a', letterSpacing: '0.04em' }}>
                  {profileData.bankAccountMasked}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>IFSC Code:</span>
                <span style={{ fontWeight: 700, color: '#2563eb' }}>{profileData.ifscCode}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Branch Location:</span>
                <span style={{ fontWeight: 500, color: '#0f172a' }}>{profileData.bankBranch}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Settlement Route:</span>
                <span style={{ fontWeight: 600, color: '#059669', textAlign: 'right', fontSize: '0.82rem' }}>
                  Direct DBT & NABARD Escrow Clearing
                </span>
              </div>

              {/* Status Badge */}
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '6px',
                }}
              >
                <CheckCircle2 size={20} color="#16a34a" />
                <div style={{ fontSize: '0.8rem', color: '#166534' }}>
                  <strong>Bank Verified for Automatic Escrow Settlements.</strong> All storage charges from farmers & buyers are credited directly to this account with zero gateway fee.
                </div>
              </div>
            </div>
          </Card>

          {/* Government Accreditation & WDRA License Card */}
          <Card style={{ padding: '24px', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{ backgroundColor: '#fef3c7', padding: '10px', borderRadius: '10px' }}>
                <ShieldCheck size={24} color="#d97706" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  WDRA Accreditation & Facility Specifications
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Warehousing Development and Regulatory Authority (Govt of India) Registry
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '0.85rem' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>WDRA License No.</div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', marginTop: '4px' }}>
                  {profileData.wdraLicense}
                </div>
                <div style={{ color: '#059669', fontSize: '0.78rem', marginTop: '2px', fontWeight: 600 }}>
                  ✓ Class-A Accredited
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Total Cold Chambers</div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', marginTop: '4px' }}>
                  {profileData.chambersCount} Modular Chambers
                </div>
                <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: '2px' }}>
                  Multi-Temp & CA Enabled
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Operating Temperature</div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', marginTop: '4px' }}>
                  {profileData.tempRange}
                </div>
                <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: '2px' }}>
                  Humidity: {profileData.humidityRange}
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Generator Power Backup</div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', marginTop: '4px' }}>
                  250 kVA Auto-Sync
                </div>
                <div style={{ color: '#059669', fontSize: '0.78rem', marginTop: '2px', fontWeight: 600 }}>
                  ✓ 100% Uninterrupted Power
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INVOICE / RECEIPT MODAL */}
      {/* ========================================================================= */}
      {invoiceModalOpen && selectedInvoice && (
        <Modal
          isOpen={invoiceModalOpen}
          onClose={() => setInvoiceModalOpen(false)}
          title={`Cold Storage Tax Invoice & Receipt — ${selectedInvoice.id}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#065f46' }}>
                  {profileData.facilityName}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  WDRA Lic: {profileData.wdraLicense} • GSTIN: 27AABCN8812F1Z8
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>Invoice #{selectedInvoice.id}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{selectedInvoice.date}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Billed To:</span>
                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{selectedInvoice.clientName}</div>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>Stakeholder: {selectedInvoice.clientType}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Consignment & Bay:</span>
                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{selectedInvoice.commodity}</div>
                <div style={{ fontSize: '0.8rem', color: '#475569' }}>{selectedInvoice.chamber}</div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Service Description</th>
                  <th style={{ textAlign: 'center', padding: '8px 0' }}>Duration</th>
                  <th style={{ textAlign: 'right', padding: '8px 0' }}>Rate</th>
                  <th style={{ textAlign: 'right', padding: '8px 0' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 0' }}>
                    Cold Chamber Storage & Temperature Management
                  </td>
                  <td style={{ textAlign: 'center', padding: '10px 0' }}>{selectedInvoice.duration}</td>
                  <td style={{ textAlign: 'right', padding: '10px 0' }}>₹60/qt/mo</td>
                  <td style={{ textAlign: 'right', padding: '10px 0', fontWeight: 700 }}>
                    ₹{selectedInvoice.amount.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>Payment Method:</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#14532d' }}>{selectedInvoice.method}</div>
                <div style={{ fontSize: '0.75rem', color: '#166534' }}>Bank Reference: {selectedInvoice.bankRef}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: '#166534' }}>Total Amount Paid:</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#166534' }}>
                  ₹{selectedInvoice.amount.toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button
                variant="outline-primary"
                icon={Printer}
                onClick={() => window.print()}
              >
                Print Receipt
              </Button>
              <Button
                variant="primary"
                onClick={() => setInvoiceModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* EDIT PROFILE MODAL */}
      {/* ========================================================================= */}
      {editProfileModal && (
        <Modal
          isOpen={editProfileModal}
          onClose={() => setEditProfileModal(false)}
          title="Update Cold Storage Operator & Bank Details"
        >
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input
              label="Operator / Owner Name"
              value={profileData.operatorName}
              onChange={(e) => setProfileData({ ...profileData, operatorName: e.target.value })}
              required
            />
            <Input
              label="Facility Name"
              value={profileData.facilityName}
              onChange={(e) => setProfileData({ ...profileData, facilityName: e.target.value })}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Contact Phone"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                required
              />
              <Input
                label="Email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Bank Name"
                value={profileData.bankName}
                onChange={(e) => setProfileData({ ...profileData, bankName: e.target.value })}
                required
              />
              <Input
                label="Account Holder Name"
                value={profileData.accountHolder}
                onChange={(e) => setProfileData({ ...profileData, accountHolder: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Bank Account Number"
                value={profileData.bankAccountMasked}
                onChange={(e) => setProfileData({ ...profileData, bankAccountMasked: e.target.value })}
                required
              />
              <Input
                label="IFSC Code"
                value={profileData.ifscCode}
                onChange={(e) => setProfileData({ ...profileData, ifscCode: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => setEditProfileModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
              >
                Save Details
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* ADD COLD STORAGE FACILITY MODAL */}
      {/* ========================================================================= */}
      {addFacilityModalOpen && (
        <Modal
          isOpen={addFacilityModalOpen}
          onClose={() => setAddFacilityModalOpen(false)}
          title="Register New Cold Storage Facility / Chamber"
        >
          <form onSubmit={handleAddFacility} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Once registered, this cold storage facility is instantly syndicated and made discoverable to Farmers and FPOs across Maharashtra in the unified Storage Discovery portal.
            </p>
            <Input
              label="Cold Storage Facility Name"
              placeholder="e.g. Sahyadri Agri Cold Chain Hub Unit 2"
              value={facilityForm.name}
              onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Select
                label="District"
                value={facilityForm.district}
                onChange={(e) => setFacilityForm({ ...facilityForm, district: e.target.value })}
                options={[
                  { value: 'Nashik', label: 'Nashik (नाशिक)' },
                  { value: 'Pune', label: 'Pune (पुणे)' },
                  { value: 'Ahmednagar', label: 'Ahmednagar (अहमदनगर)' },
                  { value: 'Solapur', label: 'Solapur (सोलापूर)' },
                  { value: 'Latur', label: 'Latur (लातूर)' },
                  { value: 'Kolhapur', label: 'Kolhapur (कोल्हापूर)' },
                ]}
                required
              />
              <Select
                label="Storage Type"
                value={facilityForm.storage_type}
                onChange={(e) => setFacilityForm({ ...facilityForm, storage_type: e.target.value })}
                options={[
                  { value: 'COLD_STORAGE', label: 'Cold Storage (0°C to 4°C)' },
                  { value: 'CONTROLLED', label: 'Controlled Atmosphere (CA)' },
                  { value: 'NORMAL', label: 'Dry Ventilated Silo' },
                ]}
                required
              />
            </div>

            <Input
              label="Location / Road Address"
              placeholder="e.g. Plot 18, MIDC Agro Food Park, Lasalgaon"
              value={facilityForm.location}
              onChange={(e) => setFacilityForm({ ...facilityForm, location: e.target.value })}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Total Capacity (Metric Tonnes)"
                type="number"
                placeholder="2000"
                value={facilityForm.capacity_mt}
                onChange={(e) => setFacilityForm({ ...facilityForm, capacity_mt: e.target.value })}
                required
              />
              <Input
                label="Daily Tariff (₹/kg/day)"
                type="number"
                step="0.001"
                placeholder="0.02"
                value={facilityForm.price_per_kg_per_day}
                onChange={(e) => setFacilityForm({ ...facilityForm, price_per_kg_per_day: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Supported Commodities"
                value={facilityForm.supported_crops}
                onChange={(e) => setFacilityForm({ ...facilityForm, supported_crops: e.target.value })}
                required
              />
              <Input
                label="Temperature Specification"
                value={facilityForm.temperature_range}
                onChange={(e) => setFacilityForm({ ...facilityForm, temperature_range: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => setAddFacilityModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
              >
                Add & Publish to Farmers
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default WarehouseDashboard;
