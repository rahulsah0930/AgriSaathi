import React from 'react';
import Card from './Card';
import Badge from './Badge';
import { TrendingUp, TrendingDown, MapPin, Calendar } from 'lucide-react';

export const PriceCard = ({
  crop,
  marketName,
  district,
  date,
  minPrice,
  maxPrice,
  avgPrice,
  trend = 'up', // 'up' or 'down'
  arrivalVolume,
  sourceType = 'SAMPLE',
}) => {
  const isUp = trend === 'up';

  return (
    <Card className="price-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)' }}>
            {crop}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--slate-500)', fontSize: '0.85rem' }}>
            <MapPin size={14} />
            <span>{marketName}, {district}</span>
          </div>
        </div>
        <Badge variant={sourceType === 'LIVE' ? 'success' : 'neutral'}>
          {sourceType} DATA
        </Badge>
      </div>

      <div style={{ margin: '8px 0', padding: '10px 0', borderTop: '1px solid var(--slate-100)', borderBottom: '1px solid var(--slate-100)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--slate-900)' }}>
            ₹{avgPrice}
          </span>
          <span style={{ fontSize: '0.9rem', color: 'var(--slate-500)' }}>/ kg avg</span>

          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: isUp ? 'var(--status-success-text)' : 'var(--status-danger-text)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            {isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{isUp ? '+3.4%' : '-2.1%'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--slate-600)', marginTop: '4px' }}>
          <span>Min: ₹{minPrice}/kg</span>
          <span>Max: ₹{maxPrice}/kg</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--slate-500)' }}>
        <span>Arrival: {arrivalVolume ? `${arrivalVolume} qtl` : 'Moderate'}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={12} /> {date || 'Today'}
        </span>
      </div>
    </Card>
  );
};

export default PriceCard;
