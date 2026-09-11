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
  Warehouse,
  Snowflake,
  Thermometer,
  MapPin,
  IndianRupee,
  Scale,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  Filter,
  Layers,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';

const STORAGE_TYPE_OPTIONS = [
  { value: 'ALL', label: 'All Storage Types' },
  { value: 'COLD_STORAGE', label: 'Cold Storage (0°C to 8°C)' },
  { value: 'CONTROLLED', label: 'Controlled Atmosphere / Ventilated' },
  { value: 'NORMAL', label: 'Dry Ambient Silo / Warehouse' },
];

const DISTRICT_OPTIONS = [
  { value: 'ALL', label: 'All Districts' },
  { value: 'Nashik', label: 'Nashik (नाशिक)' },
  { value: 'Pune', label: 'Pune (पुणे)' },
  { value: 'Solapur', label: 'Solapur (सोलापूर)' },
  { value: 'Ahmednagar', label: 'Ahmednagar (अहमदनगर)' },
  { value: 'Latur', label: 'Latur (लातूर)' },
];

export const StorageDiscoveryPage = ({ user, onNavigate }) => {
  const [warehouses, setWarehouses] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'bookings'
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [activeWarehouse, setActiveWarehouse] = useState(null);
  const [bookingCrop, setBookingCrop] = useState('Tomato');
  const [bookingQuantity, setBookingQuantity] = useState('1000');
  const [bookingUnit, setBookingUnit] = useState('kg');
  const [bookingDays, setBookingDays] = useState('14');
  const [bookingStartDate, setBookingStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingSuccessBanner, setBookingSuccessBanner] = useState(null);

  const fetchWarehouses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url = '/api/warehouses?';
      if (selectedDistrict !== 'ALL') url += `district=${encodeURIComponent(selectedDistrict)}&`;
      if (selectedType !== 'ALL') url += `storage_type=${encodeURIComponent(selectedType)}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

      const data = await api.get(url);
      setWarehouses(data.warehouses || []);

      // Also fetch user bookings
      const bookingsData = await api.get(`/api/storage-bookings?user_id=${user?.id || 1}`);
      setMyBookings(bookingsData.bookings || []);
    } catch (err) {
      console.error('Failed to load warehouses:', err);
      setError(err.message || 'Error fetching warehouse records');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDistrict, selectedType, searchQuery, user?.id]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const handleOpenBooking = (wh) => {
    setActiveWarehouse(wh);
    setBookingModalOpen(true);
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!activeWarehouse) return;

    setIsSubmittingBooking(true);
    try {
      const res = await api.post('/api/storage-bookings', {
        user_id: user?.id || 1,
        user_role: user?.role || 'FARMER',
        warehouse_id: activeWarehouse.id,
        crop: bookingCrop,
        quantity: parseFloat(bookingQuantity) || 1000,
        unit: bookingUnit,
        expected_duration_days: parseInt(bookingDays, 10) || 14,
        start_date: bookingStartDate,
      });

      if (res.success) {
        setBookingSuccessBanner(
          `Storage booking inquiry for ${res.booking.crop} (${res.booking.quantity} ${res.booking.unit}) sent to ${res.booking.warehouse_name}! Cold Storage Operator will review.`
        );
        setBookingModalOpen(false);
        fetchWarehouses();
        setActiveTab('bookings');
      }
    } catch (err) {
      alert(`Booking submission failed: ${err.message}`);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Live estimated cost in modal
  const qty = parseFloat(bookingQuantity) || 0;
  const days = parseInt(bookingDays, 10) || 0;
  const ratePerKg = activeWarehouse ? activeWarehouse.price_per_kg_per_day : 0.12;
  const qtyKg = bookingUnit === 'quintal' ? qty * 100 : bookingUnit === 'tonne' ? qty * 1000 : qty;
  const estimatedRent = Math.round(qtyKg * ratePerKg * days);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Cold Storage & Warehouse Discovery"
        subtitle="Locate certified cold storage and warehousing facilities across Maharashtra to store harvest and capture off-season price peaks."
        action={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline-primary"
              icon={RefreshCw}
              onClick={fetchWarehouses}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              onClick={() => setActiveTab(activeTab === 'explore' ? 'bookings' : 'explore')}
            >
              {activeTab === 'explore' ? `My Inquiries (${myBookings.length})` : 'Browse Warehouses'}
            </Button>
          </div>
        }
      />

      {/* 2. Success Banner */}
      {bookingSuccessBanner && (
        <div
          style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #6ee7b7',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#065f46',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="#10b981" />
            <span>{bookingSuccessBanner}</span>
          </div>
          <button
            onClick={() => setBookingSuccessBanner(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: '#065f46' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. Filter Bar (when exploring) */}
      {activeTab === 'explore' && (
        <Card>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              alignItems: 'center',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                Storage Type
              </label>
              <Select
                options={STORAGE_TYPE_OPTIONS}
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                District Location
              </label>
              <Select
                options={DISTRICT_OPTIONS}
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                Search by Name or Crop
              </label>
              <Input
                placeholder="e.g. Sahyadri, Lasalgaon, Onion, Grapes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </Card>
      )}

      {/* 4. Loading State */}
      {isLoading && (
        <LoadingState message="Discovering certified Maharashtra cold storages and warehouses..." />
      )}

      {/* 5. View A: Warehouses Grid */}
      {activeTab === 'explore' && !isLoading && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--slate-600)' }}>
              Showing <strong>{warehouses.length}</strong> accredited storage facilities
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {warehouses.map((wh) => (
              <div
                key={wh.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div>
                  {/* Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Badge variant={wh.storage_type === 'COLD_STORAGE' ? 'info' : wh.storage_type === 'CONTROLLED' ? 'warning' : 'neutral'}>
                        {wh.storage_type ? wh.storage_type.replace('_', ' ') : 'COLD STORAGE'}
                      </Badge>
                      {(wh.is_new || wh.id > 3) && (
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
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                          }}
                        >
                          ✨ Newly Added
                        </span>
                      )}
                    </div>
                    <Badge variant={wh.availability_status === 'AVAILABLE' ? 'success' : 'warning'}>
                      {wh.availability_status}
                    </Badge>
                  </div>

                  {/* Title & Location */}
                  <h4 style={{ margin: '6px 0 4px 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                    {wh.name}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--slate-600)', marginBottom: '14px' }}>
                    <MapPin size={14} color="var(--primary-600)" />
                    <span>{wh.location}</span>
                  </div>

                  {/* Specs Pill Box */}
                  <div style={{ backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: '14px', fontSize: '0.83rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--slate-500)' }}>Temperature:</span>
                      <strong style={{ color: 'var(--slate-900)' }}>{wh.temperature_range}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--slate-500)' }}>Daily Storage Tariff:</span>
                      <strong style={{ color: 'var(--primary-800)' }}>
                        ₹{wh.price_per_kg_per_day}/kg/day
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--slate-500)' }}>Supported Crops:</span>
                      <span style={{ color: 'var(--slate-800)', fontWeight: 500 }}>{wh.supported_crops}</span>
                    </div>
                  </div>

                  {/* Capacity Meter */}
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--slate-600)' }}>Available Capacity</span>
                      <strong>{wh.available_capacity.toLocaleString()} / {wh.total_capacity.toLocaleString()} T ({100 - wh.occupancy_percentage}%)</strong>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${wh.occupancy_percentage}%`,
                          height: '100%',
                          backgroundColor: wh.occupancy_percentage > 80 ? '#dc2626' : 'var(--primary-600)',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Action */}
                <Button
                  variant="primary"
                  style={{ width: '100%' }}
                  icon={Warehouse}
                  disabled={wh.availability_status === 'FULL'}
                  onClick={() => handleOpenBooking(wh)}
                >
                  Book Storage Capacity
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. View B: My Storage Inquiries & Bookings */}
      {activeTab === 'bookings' && (
        <Card title="My Storage Booking Inquiries" subtitle="Direct reservations managed across unified Warehouse Portal">
          {myBookings.length === 0 ? (
            <EmptyState
              icon={Warehouse}
              title="No Storage Inquiries Yet"
              description="Browse accredited cold storages and warehouses above to secure storage capacity for your harvest."
              action={
                <Button variant="primary" onClick={() => setActiveTab('explore')}>
                  Browse Facilities
                </Button>
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myBookings.map((b) => (
                <div
                  key={b.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '1rem', color: 'var(--slate-900)' }}>
                        {b.warehouse_name}
                      </strong>
                      <Badge variant={b.status === 'CONFIRMED' ? 'success' : 'warning'}>
                        {b.status}
                      </Badge>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
                      📦 {b.crop} • {b.quantity} {b.unit} • 🗓 {b.start_date} ({b.expected_duration_days} Days Holding)
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-800)' }}>
                      ₹{b.estimated_cost.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>
                      Estimated Total Rent
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* 7. Interactive Storage Booking Modal */}
      <Modal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        title={`Book Storage at ${activeWarehouse?.name || 'Warehouse'}`}
        footer={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="outline-primary" onClick={() => setBookingModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitBooking}
              disabled={isSubmittingBooking || qty <= 0}
            >
              {isSubmittingBooking ? 'Submitting...' : 'Confirm Booking Inquiry'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmitBooking} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 700, color: '#166534', marginBottom: '2px' }}>
              📍 {activeWarehouse?.location}
            </div>
            <div style={{ color: '#15803d' }}>
              Storage Rate: <strong>₹{activeWarehouse?.price_per_kg_per_day}/kg/day</strong> • Temp: <strong>{activeWarehouse?.temperature_range}</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                Crop / Produce
              </label>
              <Input
                value={bookingCrop}
                onChange={(e) => setBookingCrop(e.target.value)}
                placeholder="e.g. Tomato"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                Start Date
              </label>
              <Input
                type="date"
                value={bookingStartDate}
                onChange={(e) => setBookingStartDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                Quantity to Store
              </label>
              <Input
                type="number"
                value={bookingQuantity}
                onChange={(e) => setBookingQuantity(e.target.value)}
                placeholder="e.g. 1000"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
                Unit
              </label>
              <Select
                options={[
                  { value: 'kg', label: 'kg' },
                  { value: 'quintal', label: 'quintal' },
                  { value: 'tonne', label: 'tonne' },
                ]}
                value={bookingUnit}
                onChange={(e) => setBookingUnit(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '6px' }}>
              Planned Duration (Days)
            </label>
            <Input
              type="number"
              value={bookingDays}
              onChange={(e) => setBookingDays(e.target.value)}
              placeholder="e.g. 14"
              required
            />
          </div>

          {/* Live Cost Estimation Summary */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--slate-600)', fontSize: '0.9rem' }}>
                Estimated Total Storage Cost:
              </span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--primary-800)' }}>
                ₹{estimatedRent.toLocaleString('en-IN')}
              </strong>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', marginTop: '4px' }}>
              Formula: {qtyKg.toLocaleString()} kg × ₹{ratePerKg}/day × {days} days
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StorageDiscoveryPage;
