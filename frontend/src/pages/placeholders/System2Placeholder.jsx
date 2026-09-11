import React from 'react';
import { Card, Button, Badge } from '../../components/common';
import { Layers, ArrowRight, ShieldCheck, ExternalLink } from 'lucide-react';

export const System2Placeholder = ({
  moduleName = 'Transactions',
  description = 'Order fulfillment, contract execution, and delivery tracking are managed by System 2.',
  system2Lead = 'Buyer & Admin Ecosystem',
  onBackToDashboard,
}) => {
  return (
    <div style={{ maxWidth: '800px', margin: '24px auto' }}>
      <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--slate-100)',
            color: 'var(--primary-700)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Layers size={32} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <Badge variant="neutral">System 2 Dependency</Badge>
          <Badge variant="info">{system2Lead}</Badge>
        </div>

        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '12px' }}>
          {moduleName} Module
        </h2>

        <p style={{ fontSize: '1rem', color: 'var(--slate-600)', maxWidth: '540px', margin: '0 auto 24px', lineHeight: '1.6' }}>
          {description}
        </p>

        <div
          style={{
            backgroundColor: 'var(--slate-50)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            maxWidth: '560px',
            margin: '0 auto 28px',
            textAlign: 'left',
            fontSize: '0.875rem',
            color: 'var(--slate-700)',
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--slate-900)', marginBottom: '6px' }}>
            SIH Modular Architecture Contract:
          </div>
          <div>
            System 1 owns Seller Produce, APMC Intelligence, AI Sale Timing, and Storage Discovery.
            This module connects directly with System 2 during the unified merge as documented in <code>INTEGRATION.md</code>.
          </div>
        </div>

        <Button variant="primary" onClick={onBackToDashboard}>
          Return to Seller Dashboard
        </Button>
      </Card>
    </div>
  );
};

export default System2Placeholder;
