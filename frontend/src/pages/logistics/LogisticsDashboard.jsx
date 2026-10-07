import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input } from '../../components/common';
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Upload,
  User,
  Phone,
  Calendar,
  LogOut,
  ShieldCheck,
  Navigation,
  FileText,
  Eye,
  RefreshCw
} from 'lucide-react';
import api from '../../services/api';

export const LogisticsDashboard = ({ user, onNavigate, onLogout }) => {
  const [activeTab, setActiveTab] = useState('available');
  const [availableRequests, setAvailableRequests] = useState([]);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [completedDeliveries, setCompletedDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(null);

  // Vehicle Assignment Modal State
  const [assignModalOrder, setAssignModalOrder] = useState(null);
  const [assignForm, setAssignForm] = useState({
    vehicle_number: '',
    vehicle_type: 'PICKUP',
    driver_name: '',
    driver_phone: '',
    scheduled_pickup_at: '',
  });
  const [assigning, setAssigning] = useState(false);

  // POD Upload Modal State
  const [podModalOrder, setPodModalOrder] = useState(null);
  const [podFile, setPodFile] = useState(null);
  const [podNotes, setPodNotes] = useState('');
  const [uploadingPod, setUploadingPod] = useState(false);

  // POD Image Preview Modal State
  const [previewPodUrl, setPreviewPodUrl] = useState(null);

  useEffect(() => {
    loadLogisticsData();
  }, []);

  const loadLogisticsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch available requests
      const availRes = await api.get('/api/logistics/available');
      if (availRes.success) {
        setAvailableRequests(availRes.requests || []);
      }

      // 2. Fetch my deliveries
      const myRes = await api.get('/api/logistics/my-deliveries');
      if (myRes.success) {
        setActiveDeliveries(myRes.active_deliveries || []);
        setCompletedDeliveries(myRes.completed_deliveries || []);
      }
    } catch (err) {
      console.error('Failed to load logistics data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Accept transport request
  const handleAcceptRequest = async (orderId) => {
    try {
      const res = await api.post(`/api/logistics/${orderId}/accept`);
      if (res.success) {
        setBanner({
          type: 'success',
          message: res.message || 'Transport request accepted! Please schedule vehicle and driver.',
        });
        loadLogisticsData();
        setActiveTab('active');
      }
    } catch (err) {
      alert(err.message || 'Failed to accept transport request.');
    }
  };

  // Open Vehicle Assignment Modal
  const openAssignModal = (order) => {
    setAssignModalOrder(order);
    setAssignForm({
      vehicle_number: order.vehicle_number || '',
      vehicle_type: order.vehicle_type || order.vehicle_type_required || 'PICKUP',
      driver_name: order.driver_name || '',
      driver_phone: order.driver_phone || '',
      scheduled_pickup_at: order.scheduled_pickup_at
        ? new Date(order.scheduled_pickup_at).toISOString().slice(0, 16)
        : new Date(Date.now() + 3600000 * 2).toISOString().slice(0, 16),
    });
  };

  // Submit Vehicle Assignment
  const handleAssignVehicle = async (e) => {
    e.preventDefault();
    if (!assignModalOrder) return;

    if (!assignForm.vehicle_number || !assignForm.driver_name || !assignForm.driver_phone) {
      alert('Vehicle number, driver name, and driver phone are required.');
      return;
    }

    setAssigning(true);
    try {
      const res = await api.post(`/api/logistics/${assignModalOrder.id}/assign-vehicle`, assignForm);
      if (res.success) {
        setBanner({ type: 'success', message: 'Vehicle and driver scheduled successfully!' });
        setAssignModalOrder(null);
        loadLogisticsData();
      }
    } catch (err) {
      alert(err.message || 'Failed to assign vehicle.');
    } finally {
      setAssigning(false);
    }
  };

  // Transition delivery status
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await api.post(`/api/logistics/${orderId}/status`, { status: newStatus });
      if (res.success) {
        setBanner({
          type: 'success',
          message: `Consignment status updated to ${newStatus}.`,
        });
        loadLogisticsData();
      }
    } catch (err) {
      alert(err.message || 'Status transition failed.');
    }
  };

  // Submit Proof of Delivery (POD)
  const handleUploadPod = async (e) => {
    e.preventDefault();
    if (!podModalOrder || !podFile) {
      alert('Please select a proof-of-delivery photo.');
      return;
    }

    setUploadingPod(true);
    try {
      const formData = new FormData();
      formData.append('pod_image', podFile);
      if (podNotes) formData.append('pod_notes', podNotes);

      const token = api.getToken();
      const response = await fetch(`${api.getBaseUrl()}/api/logistics/${podModalOrder.id}/upload-pod`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const res = await response.json();
      if (res.success) {
        setBanner({ type: 'success', message: 'Proof of Delivery (POD) uploaded successfully!' });
        setPodModalOrder(null);
        setPodFile(null);
        setPodNotes('');
        loadLogisticsData();
      } else {
        alert(res.message || 'Failed to upload POD.');
      }
    } catch (err) {
      alert(err.message || 'An error occurred while uploading POD.');
    } finally {
      setUploadingPod(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      {/* Top Navbar */}
      <header
        style={{
          height: '70px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              backgroundColor: '#1e3a8a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Truck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              AgriSaathi <span style={{ color: '#2563eb' }}>Logistics Fleet</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
              Rural Transport & Supply Chain Portal (SIH Prototype)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate-800)' }}>
              {user?.name || user?.company_name || 'MahaAgri Express Logistics'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
              <Badge variant="success" size="sm">Verified Transporter</Badge>
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{user?.phone}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              backgroundColor: 'var(--slate-100)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--slate-700)',
              cursor: 'pointer',
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1200px', margin: '24px auto', padding: '0 20px' }}>
        {/* Banner Alert */}
        {banner && (
          <div
            style={{
              padding: '12px 18px',
              backgroundColor: banner.type === 'success' ? '#ecfdf5' : '#eff6ff',
              border: `1px solid ${banner.type === 'success' ? '#a7f3d0' : '#bfdbfe'}`,
              color: banner.type === 'success' ? '#065f46' : '#1e40af',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.9rem',
            }}
          >
            <span>{banner.message}</span>
            <button
              onClick={() => setBanner(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Hero Section */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            borderRadius: '12px',
            padding: '24px 28px',
            color: '#ffffff',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 6px 0' }}>
              Transporter Fulfillment Hub
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>
              Accept agricultural consignments from verified farmers/FPOs, assign vehicles & drivers, and upload proof of delivery.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={loadLogisticsData}
            style={{ backgroundColor: '#ffffff', color: '#1e3a8a' }}
          >
            <RefreshCw size={15} style={{ marginRight: '6px' }} />
            Refresh Orders
          </Button>
        </div>

        {/* Metrics Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <Card style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>
              Available Requests
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>
              {availableRequests.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '2px' }}>
              Awaiting transporter pickup
            </div>
          </Card>

          <Card style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>
              Active Consignments
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
              {activeDeliveries.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '2px' }}>
              Scheduled / in-transit
            </div>
          </Card>

          <Card style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>
              Completed Deliveries
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
              {completedDeliveries.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '2px' }}>
              Delivered to buyer hub
            </div>
          </Card>

          <Card style={{ padding: '16px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>
              Fleet Operations
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--slate-800)', marginTop: '4px' }}>
              {user?.profile?.vehicle_count || 8} Trucks
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '2px' }}>
              Active in Maharashtra
            </div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '2px solid var(--border-color)',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('available')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === 'available' ? '#2563eb' : 'var(--slate-600)',
              borderBottom: activeTab === 'available' ? '3px solid #2563eb' : '3px solid transparent',
              marginBottom: '-2px',
            }}
          >
            Available Requests ({availableRequests.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('active')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === 'active' ? '#2563eb' : 'var(--slate-600)',
              borderBottom: activeTab === 'active' ? '3px solid #2563eb' : '3px solid transparent',
              marginBottom: '-2px',
            }}
          >
            Active Consignments ({activeDeliveries.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === 'completed' ? '#2563eb' : 'var(--slate-600)',
              borderBottom: activeTab === 'completed' ? '3px solid #2563eb' : '3px solid transparent',
              marginBottom: '-2px',
            }}
          >
            Delivery History ({completedDeliveries.length})
          </button>
        </div>

        {/* TAB 1: AVAILABLE REQUESTS */}
        {activeTab === 'available' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Loading available requests...</div>
            ) : availableRequests.length === 0 ? (
              <Card style={{ padding: '40px', textAlign: 'center' }}>
                <Truck size={40} color="var(--slate-400)" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-800)', margin: '0 0 6px 0' }}>
                  No Unassigned Transport Requests
                </h3>
                <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', margin: 0 }}>
                  New orders will appear here automatically when sellers request dispatch for escrow-secured deals.
                </p>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {availableRequests.map((req) => (
                  <Card key={req.id} style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        {req.commodity_thumbnail_url ? (
                          <img
                            src={req.commodity_thumbnail_url}
                            alt={req.crop_name}
                            style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                              border: '1px solid var(--border-color)',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: '8px',
                              backgroundColor: '#eff6ff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#2563eb',
                            }}
                          >
                            <Package size={30} />
                          </div>
                        )}

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                              {req.crop_name}
                            </h3>
                            <Badge variant="info">{req.quantity} {req.unit}</Badge>
                            <span style={{ fontSize: '0.78rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                              {req.order_ref}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.82rem', color: 'var(--slate-600)', marginTop: '4px' }}>
                            Contract Ref: <strong>{req.transaction_ref}</strong> • Seller: <strong>{req.seller_name}</strong>
                          </div>

                          {req.refrigerated_recommended && (
                            <div style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 600, marginTop: '4px' }}>
                              ❄️ {req.refrigeration_note || 'Refrigerated transport recommended (Operational recommendation)'}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>
                          ₹{req.estimated_transport_cost ? req.estimated_transport_cost.toLocaleString() : '1,500 - 3,000'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                          Estimated Freight Rate ({req.cost_status || 'ESTIMATED'})
                        </div>
                      </div>
                    </div>

                    {/* Route Details Box */}
                    <div
                      style={{
                        margin: '16px 0',
                        padding: '12px 16px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: '12px',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div>
                        <div style={{ color: 'var(--slate-500)', fontSize: '0.75rem', fontWeight: 600 }}>
                          📍 Pickup Farmgate:
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                          {req.pickup_address} ({req.pickup_district})
                        </div>
                      </div>

                      <div>
                        <div style={{ color: 'var(--slate-500)', fontSize: '0.75rem', fontWeight: 600 }}>
                          🏁 Destination Depot:
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                          {req.delivery_address} ({req.delivery_district})
                        </div>
                      </div>

                      <div>
                        <div style={{ color: 'var(--slate-500)', fontSize: '0.75rem', fontWeight: 600 }}>
                          📏 Route Distance:
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                          {req.estimated_distance_km ? `${req.estimated_distance_km} km (Approximate distance)` : 'Unavailable'}
                        </div>
                      </div>

                      <div>
                        <div style={{ color: 'var(--slate-500)', fontSize: '0.75rem', fontWeight: 600 }}>
                          🚛 Vehicle Required:
                        </div>
                        <div style={{ fontWeight: 600, color: '#2563eb' }}>
                          {req.vehicle_type_required}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <Button
                        variant="primary"
                        onClick={() => handleAcceptRequest(req.id)}
                      >
                        Accept Transport Request
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE CONSIGNMENTS */}
        {activeTab === 'active' && (
          <div>
            {activeDeliveries.length === 0 ? (
              <Card style={{ padding: '40px', textAlign: 'center' }}>
                <CheckCircle2 size={40} color="var(--slate-400)" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-800)', margin: '0 0 6px 0' }}>
                  No Active Consignments
                </h3>
                <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', margin: 0 }}>
                  Accept orders from the Available Requests tab to schedule dispatches and track deliveries.
                </p>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeDeliveries.map((del) => (
                  <Card key={del.id} style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                            {del.crop_name} — {del.quantity} {del.unit}
                          </h3>
                          <Badge
                            variant={
                              del.status === 'ASSIGNED'
                                ? 'neutral'
                                : del.status === 'PICKUP_SCHEDULED'
                                ? 'warning'
                                : del.status === 'PICKED_UP' || del.status === 'IN_TRANSIT'
                                ? 'info'
                                : 'success'
                            }
                          >
                            {del.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', marginTop: '4px' }}>
                          Order Ref: <strong>{del.order_ref}</strong> • Contract: {del.transaction_ref} • Buyer: {del.buyer_name}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                          ₹{del.estimated_transport_cost?.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                          Approx {del.estimated_distance_km || 0} km
                        </div>
                      </div>
                    </div>

                    {/* Progress Milestone Bar */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '6px',
                        margin: '16px 0',
                        backgroundColor: '#f1f5f9',
                        padding: '10px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontWeight: del.status === 'ASSIGNED' ? 700 : 500, color: del.status === 'ASSIGNED' ? '#2563eb' : 'inherit' }}>
                        1. Accepted
                      </div>
                      <div style={{ fontWeight: del.status === 'PICKUP_SCHEDULED' ? 700 : 500, color: del.status === 'PICKUP_SCHEDULED' ? '#2563eb' : 'inherit' }}>
                        2. Scheduled
                      </div>
                      <div style={{ fontWeight: ['PICKED_UP', 'IN_TRANSIT'].includes(del.status) ? 700 : 500, color: ['PICKED_UP', 'IN_TRANSIT'].includes(del.status) ? '#2563eb' : 'inherit' }}>
                        3. In Transit
                      </div>
                      <div style={{ fontWeight: del.status === 'DELIVERED' ? 700 : 500, color: del.status === 'DELIVERED' ? '#16a34a' : 'inherit' }}>
                        4. Delivered
                      </div>
                    </div>

                    {/* Vehicle & Driver Details */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '10px',
                        fontSize: '0.825rem',
                        padding: '12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        marginBottom: '16px',
                      }}
                    >
                      <div>
                        <span style={{ color: 'var(--slate-500)' }}>Vehicle: </span>
                        <strong>{del.vehicle_number || 'Pending Assignment'} ({del.vehicle_type || del.vehicle_type_required})</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--slate-500)' }}>Driver: </span>
                        <strong>{del.driver_name || 'Unassigned'} ({del.driver_phone || 'N/A'})</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--slate-500)' }}>Pickup Time: </span>
                        <strong>{del.scheduled_pickup_at ? new Date(del.scheduled_pickup_at).toLocaleString() : 'Not Scheduled'}</strong>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {del.status === 'ASSIGNED' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openAssignModal(del)}
                        >
                          🚛 Assign Vehicle & Schedule Pickup
                        </Button>
                      )}

                      {del.status === 'PICKUP_SCHEDULED' && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openAssignModal(del)}
                          >
                            Edit Vehicle
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleUpdateStatus(del.id, 'PICKED_UP')}
                          >
                            📦 Mark Produce Picked Up
                          </Button>
                        </>
                      )}

                      {del.status === 'PICKED_UP' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdateStatus(del.id, 'IN_TRANSIT')}
                        >
                          🚚 Mark In-Transit
                        </Button>
                      )}

                      {del.status === 'IN_TRANSIT' && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setPodModalOrder(del);
                              setPodFile(null);
                              setPodNotes('');
                            }}
                          >
                            📸 Upload Proof of Delivery (POD)
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleUpdateStatus(del.id, 'DELIVERED')}
                          >
                            ✓ Mark Delivered at Destination
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMPLETED DELIVERIES */}
        {activeTab === 'completed' && (
          <div>
            {completedDeliveries.length === 0 ? (
              <Card style={{ padding: '40px', textAlign: 'center' }}>
                <CheckCircle2 size={40} color="var(--slate-400)" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-800)', margin: '0 0 6px 0' }}>
                  No Completed Deliveries Yet
                </h3>
                <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem', margin: 0 }}>
                  Successfully fulfilled consignments will appear in this historical archive.
                </p>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {completedDeliveries.map((comp) => (
                  <Card key={comp.id} style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                            {comp.crop_name} — {comp.quantity} {comp.unit}
                          </h4>
                          <Badge variant="success">DELIVERED</Badge>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                          Order: <strong>{comp.order_ref}</strong> • Driver: {comp.driver_name} ({comp.vehicle_number})
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--slate-600)', marginTop: '2px' }}>
                          Delivered to: {comp.delivery_address}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {comp.pod_image_url ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setPreviewPodUrl(comp.pod_image_url)}
                          >
                            <Eye size={14} style={{ marginRight: '4px' }} /> View POD
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setPodModalOrder(comp);
                              setPodFile(null);
                              setPodNotes('');
                            }}
                          >
                            <Upload size={14} style={{ marginRight: '4px' }} /> Upload POD
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ASSIGN VEHICLE MODAL */}
      {assignModalOrder && (
        <Modal
          isOpen={!!assignModalOrder}
          onClose={() => setAssignModalOrder(null)}
          title={`Assign Vehicle — ${assignModalOrder.order_ref}`}
        >
          <form onSubmit={handleAssignVehicle}>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginBottom: '14px' }}>
              Assign commercial carrier vehicle and verified driver for consignment pickup.
            </div>

            <div style={{ marginBottom: '12px' }}>
              <Input
                label="Vehicle Registration Number *"
                placeholder="e.g. MH15-EX-4491"
                value={assignForm.vehicle_number}
                onChange={(e) => setAssignForm({ ...assignForm, vehicle_number: e.target.value })}
                required
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', display: 'block', marginBottom: '6px' }}>
                Vehicle Classification
              </label>
              <select
                value={assignForm.vehicle_type}
                onChange={(e) => setAssignForm({ ...assignForm, vehicle_type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.9rem',
                }}
              >
                <option value="MINI_TRUCK">Mini Truck (≤1 MT / Tata Ace)</option>
                <option value="PICKUP">Pickup (≤2.5 MT / Bolero Maxi)</option>
                <option value="LCV">LCV (≤6 MT / Eicher 6-Wheeler)</option>
                <option value="TRUCK">Heavy Truck (&gt;6 MT / Multi-Axle)</option>
                <option value="REFRIGERATED_VEHICLE">Refrigerated Cold-Chain Van</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <Input
                label="Driver Full Name *"
                placeholder="e.g. Anil Shinde"
                value={assignForm.driver_name}
                onChange={(e) => setAssignForm({ ...assignForm, driver_name: e.target.value })}
                required
              />
              <Input
                label="Driver Mobile Number *"
                placeholder="10-digit mobile"
                value={assignForm.driver_phone}
                onChange={(e) => setAssignForm({ ...assignForm, driver_phone: e.target.value })}
                required
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <Input
                label="Scheduled Pickup Date & Time"
                type="datetime-local"
                value={assignForm.scheduled_pickup_at}
                onChange={(e) => setAssignForm({ ...assignForm, scheduled_pickup_at: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="secondary" onClick={() => setAssignModalOrder(null)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={assigning}>Confirm Vehicle & Schedule</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* PROOF OF DELIVERY (POD) MODAL */}
      {podModalOrder && (
        <Modal
          isOpen={!!podModalOrder}
          onClose={() => setPodModalOrder(null)}
          title={`Proof of Delivery (POD) — ${podModalOrder.order_ref}`}
        >
          <form onSubmit={handleUploadPod}>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', margin: '0 0 14px 0' }}>
              Upload signed depot receipt or produce delivery photograph. (Max 5MB • PNG, JPG, WEBP).
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', display: 'block', marginBottom: '6px' }}>
                Select POD Photo / Receipt *
              </label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={(e) => setPodFile(e.target.files[0] || null)}
                required
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', display: 'block', marginBottom: '6px' }}>
                Delivery Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Delivered 100 crates to Bay 3. Received by Mr. Nitin."
                value={podNotes}
                onChange={(e) => setPodNotes(e.target.value)}
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
              <Button variant="secondary" onClick={() => setPodModalOrder(null)}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={uploadingPod}>Upload POD</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* POD PREVIEW MODAL */}
      {previewPodUrl && (
        <Modal
          isOpen={!!previewPodUrl}
          onClose={() => setPreviewPodUrl(null)}
          title="Proof of Delivery Document"
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

export default LogisticsDashboard;
