import React, { useState, useEffect, useCallback } from 'react';
import {
  PageHeader,
  Card,
  StatCard,
  Button,
  Badge,
  Input,
  Select,
  SearchBar,
  Table,
  LoadingState,
} from '../../components/common';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Truck,
  IndianRupee,
  Calendar,
  Sparkles,
  ArrowRight,
  PlusCircle,
  RefreshCw,
  Award,
  AlertCircle,
  Building2,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import api from '../../services/api';

const CROP_OPTIONS = [
  { value: 'Tomato', label: 'Tomato (टमाटर)' },
  { value: 'Onion', label: 'Onion (कांदा)' },
  { value: 'Soybean', label: 'Soybean (सोयाबीन)' },
  { value: 'Grapes', label: 'Grapes (द्राक्ष)' },
  { value: 'Pomegranate', label: 'Pomegranate (डाळिंब)' },
  { value: 'Wheat', label: 'Wheat (गहू)' },
  { value: 'Banana', label: 'Banana (केळी)' },
];

const DISTRICT_OPTIONS = [
  { value: 'Nashik', label: 'Nashik (नाशिक)' },
  { value: 'Pune', label: 'Pune (पुणे)' },
  { value: 'Ahmednagar', label: 'Ahmednagar (अहमदनगर)' },
  { value: 'Solapur', label: 'Solapur (सोलापूर)' },
  { value: 'Latur', label: 'Latur (लातूर)' },
  { value: 'Nagpur', label: 'Nagpur (नागपूर)' },
  { value: 'Jalgaon', label: 'Jalgaon (जळगाव)' },
];

export const MarketPricesPage = ({ user, onNavigate }) => {
  const userDistrict = user?.profile?.district || 'Nashik';

  // Filter states
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [originDistrict, setOriginDistrict] = useState(userDistrict);
  const [searchQuery, setSearchQuery] = useState('');
  const [chartMetric, setChartMetric] = useState('price'); // 'price' | 'volume'

  // Data states
  const [comparisonData, setComparisonData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMarketData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch comparative Mandi prices with transport deductions
      const compRes = await api.get(
        `/api/market-prices/compare?crop=${encodeURIComponent(selectedCrop)}&district=${encodeURIComponent(originDistrict)}`
      );
      setComparisonData(compRes.comparison || []);

      // 2. Fetch 14-day history for the selected crop
      const histRes = await api.get(
        `/api/market-prices/history?crop=${encodeURIComponent(selectedCrop)}&days=14`
      );
      setHistoryData(histRes.data || []);
    } catch (err) {
      console.error('Failed to fetch market data:', err);
      setError(err.message || 'Could not load APMC market prices');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCrop, originDistrict]);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  // Derived statistics
  const filteredComparison = comparisonData.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.market_name.toLowerCase().includes(q) ||
      item.district.toLowerCase().includes(q) ||
      (item.variety && item.variety.toLowerCase().includes(q))
    );
  });

  const bestMandi = comparisonData.length > 0 ? comparisonData[0] : null;
  const localMandi = comparisonData.find(
    (m) => m.district.toLowerCase() === originDistrict.toLowerCase()
  );

  const maxPrice = comparisonData.reduce(
    (max, cur) => (cur.average_price > max ? cur.average_price : max),
    0
  );
  const minPrice = comparisonData.reduce(
    (min, cur) => (cur.average_price < min ? cur.average_price : min),
    999999
  );
  const avgPrice =
    comparisonData.length > 0
      ? (
          comparisonData.reduce((acc, cur) => acc + cur.average_price, 0) /
          comparisonData.length
        ).toFixed(2)
      : '0.00';

  const arbitrageGain =
    bestMandi && localMandi && bestMandi.market_name !== localMandi.market_name
      ? (bestMandi.net_realizable_price - localMandi.average_price).toFixed(2)
      : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Maharashtra APMC Mandi Intelligence"
        subtitle="Real-time daily modal rates across APMC Mandis with automated transport arbitrage and net return realization."
        action={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline-primary"
              icon={RefreshCw}
              onClick={fetchMarketData}
            >
              Refresh Rates
            </Button>
            <Button
              variant="primary"
              icon={PlusCircle}
              onClick={() => onNavigate('add-produce')}
            >
              List Crop Lot
            </Button>
          </div>
        }
      />

      {/* 2. Primary Filter Controls */}
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
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--slate-700)',
                marginBottom: '6px',
              }}
            >
              Select Produce / Crop
            </label>
            <Select
              options={CROP_OPTIONS}
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--slate-700)',
                marginBottom: '6px',
              }}
            >
              Seller Farm Origin (Your District)
            </label>
            <Select
              options={DISTRICT_OPTIONS}
              value={originDistrict}
              onChange={(e) => setOriginDistrict(e.target.value)}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--slate-700)',
                marginBottom: '6px',
              }}
            >
              Search Mandis
            </label>
            <Input
              placeholder="e.g. Pimpalgaon, Vashi, Pune..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* 3. Error Alert */}
      {error && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            color: '#b91c1c',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* 4. Quick Intelligence Metric Cards */}
      <div className="four-col-grid">
        <StatCard
          label="Highest Mandi Rate"
          value={`₹${maxPrice.toFixed(2)}/kg`}
          helper={bestMandi ? bestMandi.market_name : 'Terminal Mandi'}
          icon={TrendingUp}
          iconColor="var(--status-success-text)"
          iconBg="var(--status-success-bg)"
        />
        <StatCard
          label="Lowest Mandi Rate"
          value={`₹${minPrice < 999999 ? minPrice.toFixed(2) : '0.00'}/kg`}
          helper="Local Assembly Mandi"
          icon={TrendingDown}
          iconColor="var(--status-danger-text)"
          iconBg="var(--status-danger-bg)"
        />
        <StatCard
          label="State Average"
          value={`₹${avgPrice}/kg`}
          helper="Across 5+ Maharashtra Mandis"
          icon={IndianRupee}
          iconColor="var(--accent-blue)"
          iconBg="var(--accent-blue-light)"
        />
        <StatCard
          label="Best Net Return Mandi"
          value={bestMandi ? `₹${bestMandi.net_realizable_price.toFixed(2)}/kg` : 'Calculating...'}
          helper={bestMandi ? `${bestMandi.market_name} (Post-Transport)` : 'Net Realizable'}
          icon={Award}
          iconColor="var(--primary-700)"
          iconBg="var(--primary-50)"
        />
      </div>

      {/* 5. Arbitrage Opportunity Alert Banner */}
      {arbitrageGain && parseFloat(arbitrageGain) > 0.5 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            border: '1px solid #6ee7b7',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 22px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'var(--primary-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0,
              }}
            >
              <Sparkles size={24} />
            </div>
            <div>
              <h4
                style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--primary-900)',
                }}
              >
                Mandi Arbitrage Opportunity Detected!
              </h4>
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '0.88rem',
                  color: '#065f46',
                  lineHeight: 1.4,
                }}
              >
                Selling {selectedCrop} at <strong>{bestMandi.market_name}</strong> yields an extra{' '}
                <strong>₹{arbitrageGain}/kg net profit</strong> compared to local {localMandi?.market_name || 'market'},{' '}
                <em>even after deducting estimated ₹{bestMandi.transport_cost_per_kg}/kg transport and toll expenses</em>.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => onNavigate('add-produce')}
            icon={ArrowRight}
          >
            Create Lot for {bestMandi.market_name.split(' ')[0]}
          </Button>
        </div>
      )}

      {/* 6. 14-Day Price & Arrival Volume Trend Chart */}
      <Card
        title={`14-Day APMC Price & Volume Dynamics — ${selectedCrop}`}
        subtitle="Tracking daily average modal rates and market arrivals across Maharashtra primary centers"
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              size="sm"
              variant={chartMetric === 'price' ? 'primary' : 'outline-primary'}
              onClick={() => setChartMetric('price')}
            >
              Price (₹/kg)
            </Button>
            <Button
              size="sm"
              variant={chartMetric === 'volume' ? 'primary' : 'outline-primary'}
              onClick={() => setChartMetric('volume')}
            >
              Arrivals (Qtl)
            </Button>
          </div>
        }
      >
        <div style={{ height: '300px', width: '100%', marginTop: '12px' }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartMetric === 'price' ? (
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  domain={['dataMin - 3', 'dataMax + 3']}
                  unit="₹"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [`₹${val}/kg`, 'Price']}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="average_price"
                  name="Modal Average Rate"
                  stroke="#15803d"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="max_price"
                  name="Maximum Rate"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="min_price"
                  name="Minimum Rate"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            ) : (
              <AreaChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" Q" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [`${val} Quintals`, 'Arrival Volume']}
                />
                <Area
                  type="monotone"
                  dataKey="arrival_volume"
                  name="Daily Arrivals"
                  stroke="#d97706"
                  fill="#fef3c7"
                  strokeWidth={2}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 7. Mandi Comparison & Net Realization Table */}
      <Card
        title="Mandi-to-Farm Arbitrage Matrix"
        subtitle={`Computed from origin: ${originDistrict}. Net Realizable = APMC Price minus transport & toll deduction.`}
      >
        {isLoading ? (
          <LoadingState message="Calculating APMC distances and net returns..." />
        ) : (
          <Table
            columns={[
              {
                header: 'APMC Mandi / District',
                render: (row) => (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: 'var(--slate-900)', fontSize: '0.95rem' }}>
                        {row.market_name}
                      </strong>
                      {row.is_recommended && (
                        <Badge variant="success">★ Top Net Return</Badge>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                      📍 {row.district} • {row.variety}
                    </div>
                  </div>
                ),
              },
              {
                header: 'Modal Price',
                render: (row) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--slate-900)' }}>
                      ₹{row.average_price.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>
                      /{row.unit}
                    </span>
                    {row.trend === 'UP' && (
                      <TrendingUp size={15} color="#16a34a" title="Rising trend" />
                    )}
                    {row.trend === 'DOWN' && (
                      <TrendingDown size={15} color="#dc2626" title="Falling trend" />
                    )}
                    {row.trend === 'STABLE' && (
                      <Minus size={15} color="#64748b" title="Stable" />
                    )}
                  </div>
                ),
              },
              {
                header: 'Min — Max Range',
                render: (row) => (
                  <span style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
                    ₹{row.min_price.toFixed(2)} — ₹{row.max_price.toFixed(2)}
                  </span>
                ),
              },
              {
                header: 'Arrival Volume',
                render: (row) => (
                  <span style={{ fontSize: '0.85rem', color: 'var(--slate-700)', fontWeight: 500 }}>
                    {row.arrival_volume.toLocaleString()} Quintals
                  </span>
                ),
              },
              {
                header: 'Distance & Transport',
                render: (row) => (
                  <div style={{ fontSize: '0.82rem', color: 'var(--slate-600)' }}>
                    <div>🚚 {row.distance_km} km</div>
                    <div style={{ color: 'var(--slate-500)', fontSize: '0.78rem' }}>
                      -₹{row.transport_cost_per_kg.toFixed(2)}/kg freight
                    </div>
                  </div>
                ),
              },
              {
                header: 'Net Realizable Rate',
                render: (row) => (
                  <div>
                    <div
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        color: row.is_recommended ? 'var(--primary-700)' : 'var(--slate-800)',
                      }}
                    >
                      ₹{row.net_realizable_price.toFixed(2)}/{row.unit}
                    </div>
                    {row.is_recommended && (
                      <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                        Best Farmer Margin
                      </span>
                    )}
                  </div>
                ),
              },
              {
                header: 'Action',
                align: 'right',
                render: (row) => (
                  <Button
                    size="sm"
                    variant={row.is_recommended ? 'primary' : 'outline-primary'}
                    onClick={() => onNavigate('add-produce')}
                  >
                    List for Mandi
                  </Button>
                ),
              },
            ]}
            data={filteredComparison}
          />
        )}
      </Card>
    </div>
  );
};

export default MarketPricesPage;
