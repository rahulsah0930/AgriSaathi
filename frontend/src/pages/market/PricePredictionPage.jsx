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
  Calendar,
  IndianRupee,
  Scale,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Info,
  Clock,
  CheckCircle2,
  Building2,
  Sliders,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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

const MANDI_OPTIONS = [
  { value: 'Pimpalgaon APMC', label: 'Pimpalgaon APMC (Nashik)' },
  { value: 'Lasalgaon APMC', label: 'Lasalgaon APMC (Nashik)' },
  { value: 'Pune APMC (Gultekdi)', label: 'Pune APMC (Gultekdi)' },
  { value: 'Vashi APMC (Navi Mumbai)', label: 'Vashi APMC (Navi Mumbai)' },
  { value: 'Latur APMC', label: 'Latur APMC (Latur)' },
  { value: 'Solapur APMC', label: 'Solapur APMC (Solapur)' },
  { value: 'Ahmednagar APMC', label: 'Ahmednagar APMC' },
];

const HORIZON_OPTIONS = [
  { days: 3, label: '3 Days', desc: 'Short-term harvest window' },
  { days: 7, label: '7 Days', desc: 'Recommended optimal window' },
  { days: 14, label: '14 Days', desc: 'Extended storage planning' },
];

export const PricePredictionPage = ({ user, onNavigate }) => {
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [selectedMandi, setSelectedMandi] = useState('Pimpalgaon APMC');
  const [horizonDays, setHorizonDays] = useState(7);
  const [lotQuantity, setLotQuantity] = useState('1000');

  const [predictionData, setPredictionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrediction = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(
        `/api/predictions?crop=${encodeURIComponent(selectedCrop)}&market=${encodeURIComponent(
          selectedMandi
        )}&days=${horizonDays}`
      );
      if (res.success && res.prediction) {
        setPredictionData(res.prediction);
      } else {
        setError('No prediction returned');
      }
    } catch (err) {
      console.error('Failed to fetch prediction:', err);
      setError(err.message || 'Error running ML forecasting engine');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCrop, selectedMandi, horizonDays]);

  useEffect(() => {
    fetchPrediction();
  }, [fetchPrediction]);

  // Economic calculations for specified quantity
  const qty = parseFloat(lotQuantity) || 1000;
  const currentValuation = predictionData ? Math.round(predictionData.current_spot_price * qty) : 0;
  const projectedValuation = predictionData ? Math.round(predictionData.predicted_price * qty) : 0;
  const valuationDelta = projectedValuation - currentValuation;

  // Chart data formatting: merge current spot with forecast points
  const chartData = predictionData
    ? [
        {
          date: 'Today',
          day: 'Spot',
          estimated_price: predictionData.current_spot_price,
          lower_estimate: predictionData.current_spot_price,
          upper_estimate: predictionData.current_spot_price,
          confidence_band: [predictionData.current_spot_price, predictionData.current_spot_price],
        },
        ...predictionData.forecast_series.map((item) => ({
          ...item,
          confidence_band: [item.lower_estimate, item.upper_estimate],
        })),
      ]
    : [];

  const isGain = (predictionData?.price_delta || 0) >= 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="AI Price Prediction & Market Forecaster"
        subtitle="Machine Learning (Ridge + Exponential Moving Average) forecasting spot prices 3 to 14 days ahead with confidence intervals."
        action={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant="outline-primary"
              onClick={() => onNavigate('markets')}
            >
              Mandi Prices
            </Button>
            <Button
              variant="primary"
              icon={ArrowRight}
              onClick={() => onNavigate('add-produce')}
            >
              List Produce for This Window
            </Button>
          </div>
        }
      />

      {/* 2. Model Parameter Controls */}
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
              Produce / Crop
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
              Destination APMC Mandi
            </label>
            <Select
              options={MANDI_OPTIONS}
              value={selectedMandi}
              onChange={(e) => setSelectedMandi(e.target.value)}
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
              Estimated Lot Size (kg)
            </label>
            <Input
              type="number"
              value={lotQuantity}
              onChange={(e) => setLotQuantity(e.target.value)}
              placeholder="e.g. 1000"
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
              Forecast Horizon
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {HORIZON_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => setHorizonDays(opt.days)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${
                      horizonDays === opt.days ? 'var(--primary-700)' : 'var(--border-color)'
                    }`,
                    backgroundColor:
                      horizonDays === opt.days ? 'var(--primary-50)' : '#ffffff',
                    color:
                      horizonDays === opt.days ? 'var(--primary-800)' : 'var(--slate-700)',
                    fontWeight: horizonDays === opt.days ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Loading or Error State */}
      {isLoading && (
        <LoadingState message="Running scikit-learn forecasting ensemble on Maharashtra APMC time series..." />
      )}

      {error && !isLoading && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            color: '#b91c1c',
            fontSize: '0.9rem',
          }}
        >
          {error}
        </div>
      )}

      {/* 4. Hero Prediction Overview Card */}
      {!isLoading && predictionData && (
        <div
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1px solid #86efac',
            borderRadius: 'var(--radius-lg)',
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-800)', textTransform: 'uppercase' }}>
                  AI RECOMMENDATION ENGINE
                </span>
                <Badge variant={predictionData.confidence_level === 'HIGH' ? 'success' : 'warning'}>
                  {predictionData.confidence_score}% Model Confidence
                </Badge>
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  color: 'var(--slate-900)',
                }}
              >
                {predictionData.recommendation}
              </h2>
              <p
                style={{
                  margin: '6px 0 0 0',
                  color: 'var(--slate-700)',
                  fontSize: '0.95rem',
                  maxWidth: '700px',
                  lineHeight: 1.5,
                }}
              >
                {predictionData.action_reason}
              </p>
            </div>

            {/* Price Metric Box */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #bbf7d0',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
                textAlign: 'right',
                minWidth: '220px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>
                Target Price by {predictionData.target_date}
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--primary-800)', margin: '4px 0' }}>
                ₹{predictionData.predicted_price.toFixed(2)}
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--slate-500)' }}>/kg</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '4px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: isGain ? '#16a34a' : '#dc2626',
                }}
              >
                {isGain ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>
                  {isGain ? '+' : ''}₹{predictionData.price_delta.toFixed(2)}/kg ({predictionData.percentage_delta}%)
                </span>
              </div>
            </div>
          </div>

          {/* Quantity Economics Bar */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 18px',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              fontSize: '0.9rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--slate-600)' }}>Estimated Farm Valuation for <strong>{qty.toLocaleString()} kg</strong>: </span>
              <span style={{ color: 'var(--slate-500)', textDecoration: 'line-through' }}>
                ₹{currentValuation.toLocaleString('en-IN')}
              </span>{' '}
              <strong style={{ color: 'var(--slate-900)', fontSize: '1rem' }}>
                ➔ ₹{projectedValuation.toLocaleString('en-IN')}
              </strong>
            </div>

            <div style={{ fontWeight: 700, color: valuationDelta >= 0 ? '#16a34a' : '#dc2626' }}>
              {valuationDelta >= 0 ? '+' : ''}₹{valuationDelta.toLocaleString('en-IN')} Expected Net Value Shift
            </div>
          </div>
        </div>
      )}

      {/* 5. Forecast Fan Chart (Cone of Uncertainty) */}
      {!isLoading && predictionData && (
        <Card
          title={`Forecasting Trajectory — ${selectedCrop} at ${selectedMandi}`}
          subtitle={`Current Spot Rate ₹${predictionData.current_spot_price.toFixed(2)}/kg vs Expected Trend with 95% Confidence Bounds`}
        >
          <div style={{ height: '320px', width: '100%', marginTop: '12px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  domain={['dataMin - 2', 'dataMax + 2']}
                  unit="₹"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                  formatter={(val, name) => {
                    if (name === 'Upper Bound (95% CI)') return [`₹${val}/kg`, 'Upper Limit (Bullish)'];
                    if (name === 'Lower Bound (95% CI)') return [`₹${val}/kg`, 'Lower Limit (Bearish)'];
                    return [`₹${val}/kg`, 'ML Expected Rate'];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />

                {/* Upper and Lower Confidence Interval Area */}
                <Area
                  type="monotone"
                  dataKey="upper_estimate"
                  name="Upper Bound (95% CI)"
                  stroke="#93c5fd"
                  fill="#dbeafe"
                  fillOpacity={0.4}
                  strokeDasharray="3 3"
                />
                <Area
                  type="monotone"
                  dataKey="lower_estimate"
                  name="Lower Bound (95% CI)"
                  stroke="#93c5fd"
                  fill="#ffffff"
                  fillOpacity={1}
                  strokeDasharray="3 3"
                />

                {/* Expected Modal Path */}
                <Line
                  type="monotone"
                  dataKey="estimated_price"
                  name="ML Expected Modal Rate"
                  stroke="#15803d"
                  strokeWidth={3.5}
                  dot={{ r: 5, fill: '#15803d' }}
                  activeDot={{ r: 7 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* 6. Driver Breakdown & Model Transparency */}
      {!isLoading && predictionData && (
        <div className="two-col-grid">
          {/* Driver Explanations */}
          <Card
            title="Key Price Drivers & Influence Weights"
            subtitle="Explainable AI breakdown of factors driving the prediction"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {predictionData.drivers.map((driver, idx) => (
                <div
                  key={idx}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                    backgroundColor: '#fafafa',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--slate-900)' }}>
                      {driver.name}
                    </strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge variant={driver.impact === 'POSITIVE' ? 'success' : 'neutral'}>
                        {driver.impact} IMPACT
                      </Badge>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-600)' }}>
                        {driver.weight}
                      </span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--slate-600)', lineHeight: 1.4 }}>
                    {driver.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Model Architecture & Auditability */}
          <Card
            title="GovTech Model Integrity & Audit Details"
            subtitle="Standardized parameters and validation performance metrics"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--slate-600)' }}>Deployed Ensemble Architecture:</span>
                <strong style={{ color: 'var(--slate-900)' }}>
                  {predictionData.model_metrics.algorithm}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--slate-600)' }}>Coefficient of Determination (R² Score):</span>
                <strong style={{ color: '#16a34a' }}>
                  {predictionData.model_metrics.r2_score} (Good Fit)
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--slate-600)' }}>Mean Absolute Error (MAE):</span>
                <strong style={{ color: 'var(--slate-900)' }}>
                  {predictionData.model_metrics.mean_absolute_error}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--slate-600)' }}>Training Sample Records:</span>
                <strong style={{ color: 'var(--slate-900)' }}>
                  {predictionData.model_metrics.training_samples} Daily Mandi Reports
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--slate-600)' }}>Government Telemetry Grounding:</span>
                <strong style={{ color: 'var(--primary-700)' }}>
                  Agmarknet / Maharashtra MSAMB Protocol
                </strong>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PricePredictionPage;
