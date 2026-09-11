import React, { useState, useEffect } from 'react';
import {
  Card,
  StatCard,
  Badge,
  StatusBadge,
  Button,
  RecommendationCard,
  PriceCard,
  Table,
  LoadingState,
  EmptyState,
} from '../../components/common';
import {
  Package,
  TrendingUp,
  Tag,
  Warehouse,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Bell,
  MapPin,
  Calendar,
  AlertTriangle,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../../services/api';

export const SellerDashboard = ({
  user,
  onNavigate,
}) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isFPO = user?.role === 'FPO';
  const displayName = isFPO
    ? user?.profile?.fpo_name || user?.name || 'FPO Organization'
    : user?.profile?.full_name || user?.name || 'Farmer';

  const userDistrict = user?.profile?.district || 'Nashik';

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      try {
        const userIdParam = user?.id ? `&user_id=${user.id}` : '';
        const res = await api.get(`/api/dashboard/summary?role=${user?.role || 'FARMER'}${userIdParam}`);
        if (res.success) {
          setDashboardData(res);
        } else {
          setError('Could not load summary');
        }
      } catch (err) {
        console.error('Failed to fetch dashboard summary:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [user]);

  if (loading) {
    return <LoadingState message="Loading Maharashtra Mandi & Seller Intelligence..." />;
  }

  const {
    market_summary = [],
    crop_lots = [],
    ai_recommendation = {},
    pending_offers = [],
    nearby_warehouses = [],
    recent_notifications = [],
    trend_history = [],
  } = dashboardData || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Verification Status Banner */}
      {user?.verification_status === 'PENDING' ? (
        <div
          style={{
            backgroundColor: 'var(--status-warning-bg)',
            border: '1px solid var(--status-warning-border)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={24} color="var(--status-warning-text)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--status-warning-text)', fontSize: '0.95rem' }}>
                Profile Status: Government Verification Pending
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--slate-700)', marginTop: '2px' }}>
                Your {isFPO ? 'FPO credentials' : 'farmer holding records'} are awaiting validation by the Maharashtra Agriculture Department (Government Admin Verification Portal).
                You can create produce listings and explore market predictions now.
              </div>
            </div>
          </div>
          <Badge variant="warning">PENDING REVIEW</Badge>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'var(--status-success-bg)',
            border: '1px solid var(--status-success-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={22} color="var(--status-success-text)" />
            <span style={{ fontSize: '0.9rem', color: 'var(--status-success-text)', fontWeight: 600 }}>
              Government Verified Producer • Eligible for binding direct-buyer contracts & institutional procurement
            </span>
          </div>
          <Badge variant="success">VERIFIED ✓</Badge>
        </div>
      )}

      {/* 2. Top Metric StatCards */}
      <div className="dashboard-grid">
        <StatCard
          label="Verification Status"
          value={user?.verification_status || 'PENDING'}
          helper={user?.verification_status === 'VERIFIED' ? 'Govt Verified ✓' : 'Awaiting Admin Approval'}
          icon={CheckCircle2}
          iconColor={user?.verification_status === 'VERIFIED' ? 'var(--status-success-text)' : 'var(--accent-amber)'}
          iconBg={user?.verification_status === 'VERIFIED' ? 'var(--status-success-bg)' : 'var(--accent-amber-light)'}
        />
        <StatCard
          label={isFPO ? 'Aggregated Produce' : 'Active Crop Lots'}
          value={isFPO ? `${crop_lots.length} Lots` : `${crop_lots.length} Active Lots`}
          helper={
            isFPO
              ? (crop_lots.length > 0 ? `${crop_lots.length} Active Aggregation Pools` : '0 Active Pools')
              : (crop_lots.length > 0 ? crop_lots.map((l) => l.crop).slice(0, 3).join(', ') : 'No crop lots listed yet')
          }
          icon={Package}
          iconColor="var(--primary-700)"
          iconBg="var(--primary-50)"
        />
        <StatCard
          label="Lasalgaon / Nashik APMC"
          value="₹26.50/kg"
          helper="Nashik Red Onion"
          trend={{ isUp: true, text: '3.4% this week' }}
          icon={TrendingUp}
          iconColor="var(--accent-blue)"
          iconBg="var(--accent-blue-light)"
        />
        <StatCard
          label="Pending Buyer Offers"
          value={`${pending_offers.length} Offers`}
          helper={
            pending_offers.length > 0
              ? `Top: ₹${pending_offers[0].offer_price}/kg (${pending_offers[0].buyer_name || 'Buyer'})`
              : 'No pending offers'
          }
          icon={Tag}
          iconColor="var(--primary-700)"
          iconBg="var(--primary-50)"
        />
      </div>

      {/* 3. Highlighted AI Recommendation & 7-Day Market Trend Chart */}
      <div className="two-col-grid">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)' }}>
              AI Sale Recommendation Engine
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
              Net Return Optimization
            </span>
          </div>

          <RecommendationCard
            crop={ai_recommendation.crop || 'Tomato'}
            recommendation={ai_recommendation.recommendation || 'SELL SOON'}
            recommendedWindow={ai_recommendation.recommended_window || 'Within 2 Days'}
            currentPrice={ai_recommendation.current_price || 22.5}
            predictedPrice={ai_recommendation.predicted_price || 25.0}
            estimatedNetReturn={ai_recommendation.estimated_net_return || 27200}
            risk={ai_recommendation.risk || 'HIGH'}
            reason={ai_recommendation.reason}
            onActionClick={() => onNavigate('ai-advisor')}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)' }}>
              7-Day APMC Price Trends (₹/kg)
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
              Nashik & Pune APMCs
            </span>
          </div>

          <Card style={{ padding: '16px 8px 8px 8px' }}>
            <div style={{ height: '235px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend_history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Line type="monotone" dataKey="Tomato" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Onion" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Soybean" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* 4. Current Crop Lots Section */}
      <Card
        title={isFPO ? 'Aggregated FPO Crop Lots' : 'My Current Crop Lots'}
        subtitle={`Active harvest listings for ${displayName} (${userDistrict})`}
        action={
          <Button
            size="sm"
            variant="primary"
            icon={PlusCircle}
            onClick={() => onNavigate(isFPO ? 'fpo-aggregation' : 'add-produce')}
          >
            {isFPO ? 'Aggregate New Lot' : 'Add New Produce'}
          </Button>
        }
      >
        {crop_lots.length > 0 ? (
          <Table
            columns={[
              {
                header: 'Crop / Variety',
                render: (row) => (
                  <div>
                    <strong style={{ color: 'var(--slate-900)' }}>{row.crop}</strong>
                    <div style={{ fontSize: '0.785rem', color: 'var(--slate-500)' }}>{row.variety} • {row.quality_grade}</div>
                  </div>
                ),
              },
              {
                header: 'Quantity',
                render: (row) => (
                  <span style={{ fontWeight: 600 }}>
                    {row.quantity.toLocaleString()} {row.unit}
                  </span>
                ),
              },
              {
                header: 'Harvest Date',
                render: (row) => (
                  <span style={{ fontSize: '0.875rem', color: 'var(--slate-600)' }}>
                    {row.harvest_date}
                  </span>
                ),
              },
              {
                header: 'Expected Rate',
                render: (row) => (
                  <span style={{ fontWeight: 700, color: 'var(--slate-800)' }}>
                    ₹{row.expected_price}/kg
                  </span>
                ),
              },
              {
                header: 'Status',
                render: (row) => <StatusBadge status={row.status} />,
              },
              {
                header: 'Offers',
                render: (row) => (
                  <Badge variant={row.offers_count > 0 ? 'success' : 'neutral'}>
                    {row.offers_count} {row.offers_count === 1 ? 'Offer' : 'Offers'}
                  </Badge>
                ),
              },
              {
                header: 'Actions',
                align: 'right',
                render: (row) => (
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => onNavigate('my-lots')}
                  >
                    Manage
                  </Button>
                ),
              },
            ]}
            data={crop_lots}
          />
        ) : (
          <EmptyState
            icon={Package}
            title={isFPO ? 'No Aggregated Lots Yet' : 'No Crop Lots Listed Yet'}
            description={
              isFPO
                ? 'Create your first FPO aggregation pool or add a direct commercial lot to start receiving buyer bids.'
                : 'You have not listed any crop lots yet. Add your first harvest to receive AI sale recommendations and direct buyer bids!'
            }
            actionText={isFPO ? 'Aggregate New Lot' : 'Add First Produce Listing'}
            onAction={() => onNavigate(isFPO ? 'fpo-aggregation' : 'add-produce')}
          />
        )}
      </Card>

      {/* 5. Market Price Summary (Maharashtra Mandis) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--slate-900)' }}>
              Market Price Summary (Maharashtra APMCs)
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
              Real-time daily mandi arrivals across Nashik, Pune, and Latur markets
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => onNavigate('markets')}>
            View All APMC Mandis
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {market_summary.map((item, idx) => (
            <Card key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                    {item.crop}
                  </h4>
                  <div style={{ fontSize: '0.825rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} />
                    <span>{item.market}, {item.district}</span>
                  </div>
                </div>
                <Badge variant={item.trend === 'up' ? 'success' : 'neutral'}>
                  {item.trend === 'up' ? '▲ ' : '▼ '}{item.change}
                </Badge>
              </div>

              <div style={{ margin: '8px 0', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                  ₹{item.avg_price}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>/ kg avg</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                <span>Min: ₹{item.min_price}</span>
                <span>Max: ₹{item.max_price}</span>
                <span>Arrival: {item.arrival_volume}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 6. Two-Column Row: Pending Buyer Offers & Nearby Cold Storage */}
      <div className="two-col-grid">
        {/* Buyer Offers Card */}
        <Card
          title="Pending Buyer Offers"
          subtitle="Direct corporate & institutional offers awaiting response"
          action={
            <Button size="sm" variant="outline-primary" onClick={() => onNavigate('buyer-offers')}>
              View All ({pending_offers.length})
            </Button>
          }
        >
          {pending_offers.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pending_offers.map((offer) => (
                <div
                  key={offer.id}
                  style={{
                    padding: '12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--slate-50)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--slate-900)' }}>
                        {offer.buyer_name}
                      </strong>
                      <Badge variant="success">Verified ✓</Badge>
                    </div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--slate-600)', marginTop: '2px' }}>
                      {offer.crop}: {offer.quantity} {offer.unit} @ <strong>₹{offer.offer_price}/kg</strong>
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                      Total: ₹{offer.total_value.toLocaleString()} • Delivery by: {offer.delivery_date}
                    </div>
                  </div>

                  <Button size="sm" variant="primary" onClick={() => onNavigate('buyer-offers')}>
                    Respond
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '28px 16px',
                color: 'var(--slate-500)',
                fontSize: '0.875rem',
                backgroundColor: 'var(--slate-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--slate-200)',
              }}
            >
              <Tag size={28} color="var(--slate-400)" style={{ margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontWeight: 600, color: 'var(--slate-700)', marginBottom: '4px' }}>No Pending Offers</div>
              Verified corporate buyer bids will appear here once your produce lots are live on the marketplace.
            </div>
          )}
        </Card>

        {/* Storage Availability Card */}
        <Card
          title="Nearby Cold Storage Discovery"
          subtitle="Certified warehouses with active capacity in your district"
          action={
            <Button size="sm" variant="outline-primary" onClick={() => onNavigate('storage')}>
              Discover Warehouses
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {nearby_warehouses.map((wh) => (
              <div
                key={wh.id}
                style={{
                  padding: '12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h5 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                      {wh.name}
                    </h5>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                      {wh.district} District • {wh.storage_type.replace('_', ' ')}
                    </div>
                  </div>
                  <Badge variant="success">
                    {wh.available_capacity} {wh.unit}s Free
                  </Badge>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--slate-100)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-800)' }}>
                    ₹{wh.price_per_kg_per_day.toFixed(2)}/kg/day
                  </span>
                  <Button size="sm" variant="secondary" onClick={() => onNavigate('storage')}>
                    Request Booking
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 7. In-App Notifications Feed Card */}
      <Card
        title="Seller Alerts & Mandi Notifications"
        subtitle="Recent price changes, offer updates, and cold storage alerts"
        action={
          <Button size="sm" variant="secondary" onClick={() => onNavigate('notifications')}>
            All Notifications
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {recent_notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: notif.is_read ? 'transparent' : 'var(--primary-50)',
                borderBottom: '1px solid var(--slate-100)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: notif.type === 'OFFER' ? 'var(--primary-100)' : notif.type === 'PRICE' ? 'var(--accent-blue-light)' : 'var(--accent-amber-light)',
                  color: notif.type === 'OFFER' ? 'var(--primary-800)' : notif.type === 'PRICE' ? 'var(--accent-blue)' : 'var(--accent-amber)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <Bell size={16} />
              </div>
              <div style={{ flexGrow: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--slate-900)' }}>
                    {notif.title}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                    {notif.created_at}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginTop: '2px' }}>
                  {notif.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SellerDashboard;
