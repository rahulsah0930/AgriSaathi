import React, { useState, useEffect, useCallback } from 'react';
import {
  PageHeader,
  Card,
  StatCard,
  Button,
  Badge,
  Input,
  Select,
  LoadingState,
} from '../../components/common';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Warehouse,
  Clock,
  IndianRupee,
  Scale,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Award,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import api from '../../services/api';
import PricePredictionPage from '../market/PricePredictionPage';

const CROP_OPTIONS = [
  { value: 'Tomato', label: 'Tomato (टमाटर)' },
  { value: 'Onion', label: 'Onion (कांदा)' },
  { value: 'Soybean', label: 'Soybean (सोयाबीन)' },
  { value: 'Grapes', label: 'Grapes (द्राक्ष)' },
  { value: 'Pomegranate', label: 'Pomegranate (डाळिंब)' },
  { value: 'Wheat', label: 'Wheat (गहू)' },
  { value: 'Banana', label: 'Banana (केळी)' },
];

const UNIT_OPTIONS = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'quintal', label: 'Quintal (100 kg)' },
  { value: 'tonne', label: 'Tonne (1000 kg)' },
];

const DISTRICT_OPTIONS = [
  { value: 'Nashik', label: 'Nashik (नाशिक)' },
  { value: 'Pune', label: 'Pune (पुणे)' },
  { value: 'Ahmednagar', label: 'Ahmednagar (अहमदनगर)' },
  { value: 'Solapur', label: 'Solapur (सोलापूर)' },
  { value: 'Latur', label: 'Latur (लातूर)' },
];

export const SaleAdvisorPage = ({ user, onNavigate }) => {
  // Navigation sub-tab: 'advisor' | 'forecast'
  const [activeTab, setActiveTab] = useState('advisor');

  // Input states
  const [crop, setCrop] = useState('Tomato');
  const [quantity, setQuantity] = useState('1500');
  const [unit, setUnit] = useState('kg');
  const [district, setDistrict] = useState(user?.profile?.district || 'Nashik');

  // Data states
  const [recommendation, setRecommendation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecommendation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/recommendations', {
        crop,
        quantity: parseFloat(quantity) || 1000,
        unit,
        district,
      });

      if (res.success && res.recommendation) {
        setRecommendation(res.recommendation);
      } else {
        setError('Unable to calculate sale recommendation');
      }
    } catch (err) {
      console.error('Failed to run sale recommendation engine:', err);
      setError(err.message || 'Error executing AI Net Return optimization');
    } finally {
      setIsLoading(false);
    }
  }, [crop, quantity, unit, district]);

  useEffect(() => {
    fetchRecommendation();
  }, [fetchRecommendation]);

  // If user switched to ML Price Forecaster tab, render PricePredictionPage
  if (activeTab === 'forecast') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Sub-tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <button
            onClick={() => setActiveTab('advisor')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--slate-600)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            💰 Net Return Sale Advisor
          </button>
          <button
            onClick={() => setActiveTab('forecast')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-800)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            📈 ML Price Forecaster (Fan Chart)
          </button>
        </div>
        <PricePredictionPage user={user} onNavigate={onNavigate} />
      </div>
    );
  }

  // Waterfall Chart Data for Strategy Economics
  const chartData = recommendation?.strategies?.map((strat) => ({
    name: strat.title.split('(')[0].trim(),
    'Gross Revenue': strat.gross_revenue,
    'Storage & Costs': Math.round(strat.storage_cost + strat.handling_freight + strat.shrinkage_cost),
    'Net In-Pocket Return': strat.net_return,
  })) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Sub-tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('advisor')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            backgroundColor: 'var(--primary-50)',
            color: 'var(--primary-800)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          💰 Net Return Sale Advisor
        </button>
        <button
          onClick={() => setActiveTab('forecast')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--slate-600)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          📈 ML Price Forecaster (Fan Chart)
        </button>
      </div>

      {/* 2. Page Header */}
      <PageHeader
        title="AI Net Return Sale Recommendation Engine"
        subtitle="Mathematical optimization resolving the Farmer's dilemma: Storage Rent vs Price Appreciation vs Perishability Moisture Loss."
        action={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline-primary"
              icon={RefreshCw}
              onClick={fetchRecommendation}
            >
              Re-Calculate
            </Button>
            <Button
              variant="primary"
              icon={Warehouse}
              onClick={() => onNavigate('storage')}
            >
              Discover Warehouses
            </Button>
          </div>
        }
      />

      {/* 3. Input Controls Card */}
      <Card>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            alignItems: 'flex-end',
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
              Crop / Produce
            </label>
            <Select
              options={CROP_OPTIONS}
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
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
              Harvest Quantity
            </label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 1500"
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
              Unit
            </label>
            <Select
              options={UNIT_OPTIONS}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
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
              Seller District
            </label>
            <Select
              options={DISTRICT_OPTIONS}
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* 4. Loading & Error States */}
      {isLoading && (
        <LoadingState message="Running Net Return optimization: computing storage tariffs, moisture loss, and price delta..." />
      )}

      {error && !isLoading && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            color: '#b91c1c',
          }}
        >
          {error}
        </div>
      )}

      {/* 5. Hero Recommendation Verdict */}
      {!isLoading && recommendation && (
        <div
          style={{
            background:
              recommendation.verdict === 'STORE & SELL LATER'
                ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
                : recommendation.verdict === 'SELL SOON'
                ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
                : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: `1px solid ${
              recommendation.verdict === 'STORE & SELL LATER'
                ? '#6ee7b7'
                : recommendation.verdict === 'SELL SOON'
                ? '#93c5fd'
                : '#fde68a'
            }`,
            borderRadius: 'var(--radius-lg)',
            padding: '26px 30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Badge variant={recommendation.verdict_color}>
                {recommendation.verdict_badge}
              </Badge>
              <span style={{ fontSize: '0.85rem', color: 'var(--slate-600)', fontWeight: 600 }}>
                Optimal Target: {recommendation.recommended_window}
              </span>
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: '1.9rem',
                fontWeight: 800,
                color: 'var(--slate-900)',
              }}
            >
              Verdict: {recommendation.verdict}
            </h2>

            <p
              style={{
                margin: '8px 0 0 0',
                fontSize: '0.98rem',
                color: 'var(--slate-800)',
                lineHeight: 1.5,
              }}
            >
              {recommendation.summary_reason}
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 22px',
              textAlign: 'right',
              minWidth: '220px',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>
              Net Pure Advantage
            </div>
            <div
              style={{
                fontSize: '1.9rem',
                fontWeight: 800,
                color: recommendation.net_gain_vs_today >= 0 ? '#16a34a' : 'var(--slate-700)',
                margin: '4px 0',
              }}
            >
              {recommendation.net_gain_vs_today >= 0 ? '+' : ''}₹{recommendation.net_gain_vs_today.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--slate-600)', fontWeight: 500 }}>
              Over selling immediately today
            </div>
          </div>
        </div>
      )}

      {/* 6. Side-by-Side 3-Strategy Comparison Cards */}
      {!isLoading && recommendation && (
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '16px' }}>
            Quantitative Strategy Comparison
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '18px',
            }}
          >
            {recommendation.strategies.map((strat) => {
              const isBest = strat.id === recommendation.best_strategy_id;

              return (
                <div
                  key={strat.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: isBest ? '2px solid var(--primary-600)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isBest ? '0 10px 15px -3px rgba(16, 185, 129, 0.1)' : 'var(--shadow-sm)',
                    position: 'relative',
                  }}
                >
                  {isBest && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-12px',
                        right: '18px',
                        backgroundColor: 'var(--primary-700)',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      ★ AI Top Pick
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                      {strat.timing} • {strat.target_date}
                    </div>
                    <h4
                      style={{
                        margin: '4px 0 12px 0',
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        color: 'var(--slate-900)',
                      }}
                    >
                      {strat.title}
                    </h4>

                    {/* Rate & Net Return Box */}
                    <div
                      style={{
                        backgroundColor: isBest ? 'var(--primary-50)' : '#f8fafc',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 14px',
                        marginBottom: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--slate-600)' }}>Projected Rate:</span>
                        <strong style={{ fontSize: '1rem', color: 'var(--slate-900)' }}>
                          ₹{strat.price_per_kg.toFixed(2)}/kg
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--slate-600)' }}>Net Realized Return:</span>
                        <strong
                          style={{
                            fontSize: '1.15rem',
                            fontWeight: 800,
                            color: isBest ? 'var(--primary-700)' : 'var(--slate-900)',
                          }}
                        >
                          ₹{strat.net_return.toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>

                    {/* Cost Itemization */}
                    <div
                      style={{
                        fontSize: '0.83rem',
                        color: 'var(--slate-600)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        borderBottom: '1px solid var(--border-color)',
                        paddingBottom: '14px',
                        marginBottom: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Gross Market Value:</span>
                        <span>₹{strat.gross_revenue.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: strat.storage_cost > 0 ? '#dc2626' : 'var(--slate-500)' }}>
                        <span>Warehouse / Cold Storage Rent:</span>
                        <span>{strat.storage_cost > 0 ? `-₹${strat.storage_cost.toLocaleString('en-IN')}` : '₹0'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: strat.shrinkage_cost > 0 ? '#d97706' : 'var(--slate-500)' }}>
                        <span>Weight Loss / Shrinkage ({strat.shrinkage_weight_loss_kg} kg):</span>
                        <span>{strat.shrinkage_cost > 0 ? `-₹${strat.shrinkage_cost.toLocaleString('en-IN')}` : '₹0'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--slate-500)' }}>
                        <span>Handling & Freight Fees:</span>
                        <span>-₹{strat.handling_freight.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Pros and Cons */}
                    <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {strat.pros.map((pro, pIdx) => (
                        <div key={pIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d' }}>
                          <CheckCircle2 size={13} style={{ flexShrink: 0 }} />
                          <span>{pro}</span>
                        </div>
                      ))}
                      {strat.cons.map((con, cIdx) => (
                        <div key={cIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b91c1c' }}>
                          <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                          <span>{con}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: '18px' }}>
                    <Button
                      variant={isBest ? 'primary' : 'outline-primary'}
                      style={{ width: '100%' }}
                      onClick={() => {
                        if (strat.id === 'COLD_STORAGE') {
                          onNavigate('storage');
                        } else {
                          onNavigate('add-produce');
                        }
                      }}
                    >
                      {strat.id === 'COLD_STORAGE'
                        ? 'Book Cold Storage'
                        : strat.id === 'SHORT_HOLD'
                        ? 'Schedule Harvest'
                        : 'Sell at Today\'s Mandi'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Recharts Strategy Comparison Waterfall */}
      {!isLoading && recommendation && (
        <Card
          title="Revenue vs Cost Deductions Across Strategies"
          subtitle="Direct comparison showing how gross revenue is impacted by holding fees, storage rents, and shrinkage."
        >
          <div style={{ height: '280px', width: '100%', marginTop: '12px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#334155' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="₹" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Amount']}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="Gross Revenue" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Storage & Costs" fill="#f87171" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Net In-Pocket Return" fill="#15803d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* 8. Crop Perishability & Agronomic Parameters Card */}
      {!isLoading && recommendation && (
        <Card
          title={`Agronomic Storage Benchmark Profile — ${recommendation.crop}`}
          subtitle="Empirical shelf-life, shrinkage tolerances, and storage conditions grounded in Maharashtra agricultural guidelines"
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              fontSize: '0.88rem',
            }}
          >
            <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
              <div style={{ color: 'var(--slate-500)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600 }}>
                Perishability Class
              </div>
              <strong style={{ color: 'var(--slate-900)', fontSize: '1.05rem' }}>
                {recommendation.crop_perishability.perishability_class}
              </strong>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
              <div style={{ color: 'var(--slate-500)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600 }}>
                Ambient Farm Shelf Life
              </div>
              <strong style={{ color: 'var(--slate-900)', fontSize: '1.05rem' }}>
                {recommendation.crop_perishability.ambient_shelf_life}
              </strong>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
              <div style={{ color: 'var(--slate-500)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600 }}>
                Cold Storage Shelf Life
              </div>
              <strong style={{ color: 'var(--primary-700)', fontSize: '1.05rem' }}>
                {recommendation.crop_perishability.cold_shelf_life}
              </strong>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
              <div style={{ color: 'var(--slate-500)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600 }}>
                Optimal Temperature
              </div>
              <strong style={{ color: 'var(--slate-900)', fontSize: '1.05rem' }}>
                {recommendation.crop_perishability.optimal_temperature}
              </strong>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
              <div style={{ color: 'var(--slate-500)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600 }}>
                Daily Ambient Shrinkage
              </div>
              <strong style={{ color: '#b91c1c', fontSize: '1.05rem' }}>
                {recommendation.crop_perishability.daily_ambient_weight_loss}
              </strong>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
              <div style={{ color: 'var(--slate-500)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600 }}>
                Benchmark Cold Storage Tariff
              </div>
              <strong style={{ color: 'var(--slate-900)', fontSize: '1.05rem' }}>
                {recommendation.crop_perishability.benchmark_storage_rent}
              </strong>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SaleAdvisorPage;
