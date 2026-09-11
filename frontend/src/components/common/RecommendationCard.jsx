import React from 'react';
import Card from './Card';
import Badge from './Badge';
import Button from './Button';
import { Sparkles, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

export const RecommendationCard = ({
  recommendation = 'SELL_SOON', // SELL NOW, SELL SOON, WAIT, STORE AND SELL
  recommendedWindow = 'Within 2 Days',
  crop = 'Tomato',
  currentPrice = 20,
  predictedPrice = 23,
  estimatedNetReturn = 21500,
  risk = 'HIGH', // LOW, MEDIUM, HIGH
  storageRequired = false,
  reason = 'Market prices may increase over the next two days, but tomato has high perishability. Waiting longer may create post-harvest losses.',
  onActionClick,
}) => {
  const getRecBadge = () => {
    switch (recommendation) {
      case 'SELL NOW':
        return { variant: 'warning', label: 'SELL NOW' };
      case 'SELL SOON':
        return { variant: 'info', label: 'SELL SOON' };
      case 'WAIT':
        return { variant: 'neutral', label: 'WAIT' };
      case 'STORE AND SELL':
        return { variant: 'success', label: 'STORE & SELL' };
      default:
        return { variant: 'info', label: recommendation };
    }
  };

  const recBadge = getRecBadge();

  return (
    <Card
      className="recommendation-card"
      style={{
        border: '2px solid var(--primary-500)',
        backgroundColor: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          backgroundColor: 'var(--primary-700)',
          color: '#ffffff',
          fontSize: '0.725rem',
          fontWeight: 700,
          padding: '4px 12px',
          borderBottomLeftRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <Sparkles size={12} />
        <span>AI RECOMMENDATION</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', marginTop: '4px' }}>
        <Badge variant={recBadge.variant}>
          {recBadge.label}
        </Badge>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-600)' }}>
          Window: {recommendedWindow}
        </span>
      </div>

      <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '8px' }}>
        {crop}: {recommendation}
      </h4>

      <p style={{ fontSize: '0.9rem', color: 'var(--slate-700)', lineHeight: '1.5', marginBottom: '16px' }}>
        {reason}
      </p>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '10px',
          padding: '12px',
          backgroundColor: 'var(--slate-50)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', display: 'block' }}>Current</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-800)' }}>₹{currentPrice}/kg</span>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', display: 'block' }}>Predicted</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-700)' }}>₹{predictedPrice}/kg</span>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', display: 'block' }}>Est. Net Return</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--status-success-text)' }}>₹{estimatedNetReturn.toLocaleString()}</span>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', display: 'block' }}>Risk Level</span>
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: risk === 'HIGH' ? 'var(--status-danger-text)' : risk === 'MEDIUM' ? 'var(--status-warning-text)' : 'var(--status-success-text)',
            }}
          >
            {risk}
          </span>
        </div>
      </div>

      {/* Footer action */}
      {onActionClick && (
        <Button variant="outline-primary" size="sm" onClick={onActionClick} style={{ width: '100%' }}>
          <span>View Detailed Net Return Analysis</span>
          <ArrowRight size={14} />
        </Button>
      )}
    </Card>
  );
};

export default RecommendationCard;
