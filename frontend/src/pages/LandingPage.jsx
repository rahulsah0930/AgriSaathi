import React, { useState } from 'react';
import {
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Users,
  Warehouse,
  Receipt,
  ArrowRight,
  Sprout,
  CheckCircle2,
  LogIn,
  UserPlus,
  Building2,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { Button, Card, Badge, Modal } from '../components/common';

export const LandingPage = ({ onSelectRole, onGoToLogin }) => {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Six core pillars required by Section 10
  const pillars = [
    {
      icon: TrendingUp,
      title: 'Transparent Market Prices',
      desc: 'Real-time mandi rates across Maharashtra APMCs (Nashik, Pune, Mumbai, Lasalgaon, etc.) with arrival volumes and 7/30/90-day price trends.',
      badge: 'APMC Intel',
    },
    {
      icon: Sparkles,
      title: 'AI Sale Recommendation',
      desc: 'Answers "When should I sell?": Calculates realistic Net Return factoring predicted future prices, storage costs, and perishability spoilage rates.',
      badge: 'Core Engine',
      highlight: true,
    },
    {
      icon: ShieldCheck,
      title: 'Verified Buyers',
      desc: 'Connect directly with verified institutional buyers, food processors, and retailers, eliminating exploitative middlemen.',
      badge: 'Direct Connect',
    },
    {
      icon: Users,
      title: 'FPO Aggregation',
      desc: 'Enables Farmer Producer Organizations to pool crops from multiple member farmers for bulk bargaining and higher unit realization.',
      badge: 'Bargaining Power',
    },
    {
      icon: Warehouse,
      title: 'Storage Discovery',
      desc: 'Find verified cold storages and warehouses nearby with available capacity and daily rates to prevent distress selling.',
      badge: 'Post-Harvest Save',
    },
    {
      icon: Receipt,
      title: 'Transparent Transactions',
      desc: 'Clear offer counter-proposals, formal digitized agreements, and auditable trade records for both smallholders and FPOs.',
      badge: 'Trust & Safety',
    },
  ];

  // Platform participants across all 5 unified roles
  const participants = [
    {
      role: 'FARMER',
      title: 'Individual Farmer',
      desc: 'Create crop lots, view APMC market intelligence, receive AI sell/store advice, negotiate buyer offers, and track escrow payments.',
      actionText: 'Register as Farmer',
      loginText: 'Farmer Login',
      badge: 'Seller Portal',
      onAction: () => {
        setIsRegisterModalOpen(false);
        onSelectRole('FARMER', 'register');
      },
      onLogin: () => {
        setIsLoginModalOpen(false);
        onGoToLogin('FARMER');
      },
    },
    {
      role: 'FPO',
      title: 'Farmer Producer Org (FPO)',
      desc: 'Aggregate member harvests, create combined large lots, negotiate bulk pricing, and access certified cold storage facilities.',
      actionText: 'Register as FPO',
      loginText: 'FPO Login',
      badge: 'Aggregation',
      onAction: () => {
        setIsRegisterModalOpen(false);
        onSelectRole('FPO', 'register');
      },
      onLogin: () => {
        setIsLoginModalOpen(false);
        onGoToLogin('FPO');
      },
    },
    {
      role: 'BUYER',
      title: 'Wholesale Buyers & Corporates',
      desc: 'Browse verified produce listings, counter-offer on lots, lock 20% advance into Government Escrow, and confirm delivery.',
      actionText: 'Register as Buyer',
      loginText: 'Buyer Login',
      badge: 'Procurement',
      onAction: () => {
        setIsRegisterModalOpen(false);
        onSelectRole('BUYER', 'register');
      },
      onLogin: () => {
        setIsLoginModalOpen(false);
        onGoToLogin('BUYER');
      },
    },
    {
      role: 'WAREHOUSE',
      title: 'Warehouse & Cold Storage',
      desc: 'Manage cold storage capacity, log chamber temperatures, set tariff rates, and accept inbound farmer storage bookings.',
      actionText: 'Register Storage',
      loginText: 'Warehouse Login',
      badge: 'Post-Harvest',
      onAction: () => {
        setIsRegisterModalOpen(false);
        onSelectRole('WAREHOUSE', 'register');
      },
      onLogin: () => {
        setIsLoginModalOpen(false);
        onGoToLogin('WAREHOUSE');
      },
    },
    {
      role: 'ADMIN',
      title: 'Government Regulatory Admin',
      desc: 'Review pending registrations, inspect trade escrow ledgers, adjudicate dispute grievances, and enforce compliance.',
      actionText: 'Officer Portal',
      loginText: 'Admin Login',
      badge: 'Regulatory',
      onAction: () => {
        onGoToLogin('ADMIN');
      },
      onLogin: () => {
        setIsLoginModalOpen(false);
        onGoToLogin('ADMIN');
      },
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Public Header */}
      <header
        style={{
          height: '70px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--primary-700)',
              fontWeight: 700,
              fontSize: '1.4rem',
            }}
          >
            <Sprout size={28} />
            <span>AgriSaathi</span>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-800)',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 600,
              border: '1px solid var(--primary-200)',
            }}
          >
            Maharashtra GovTech SIH Prototype
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button
            variant="secondary"
            size="md"
            icon={LogIn}
            onClick={() => setIsLoginModalOpen(true)}
          >
            Seller Login
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={UserPlus}
            onClick={() => setIsRegisterModalOpen(true)}
          >
            Register Now
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, var(--slate-50) 100%)',
          padding: '64px 24px 48px',
          textAlign: 'center',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Badge variant="success">
              <Sparkles size={12} />
              <span>SIH Agriculture Innovation</span>
            </Badge>
            <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
              Targeting distress sales in Maharashtra
            </span>
          </div>

          <h1
            style={{
              fontSize: '2.6rem',
              fontWeight: 800,
              color: 'var(--slate-900)',
              lineHeight: '1.2',
              marginBottom: '20px',
            }}
          >
            Transparent Market Prices, Cold Storage &{' '}
            <span style={{ color: 'var(--primary-700)' }}>AI Sale Timing</span> for Maharashtra Farmers
          </h1>

          <p
            style={{
              fontSize: '1.15rem',
              color: 'var(--slate-600)',
              lineHeight: '1.6',
              maxWidth: '750px',
              margin: '0 auto 32px',
            }}
          >
            Solving the core dilemma for farmers and FPOs:
            <br />
            <strong style={{ color: 'var(--primary-800)', fontSize: '1.25rem' }}>
              “When should a farmer sell the crop to obtain the best realistic net return?”
            </strong>
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '16px',
            }}
          >
            <Button
              size="lg"
              variant="primary"
              icon={UserPlus}
              onClick={() => setIsRegisterModalOpen(true)}
            >
              Get Started as Seller
            </Button>
            <Button
              size="lg"
              variant="secondary"
              icon={LogIn}
              onClick={() => setIsLoginModalOpen(true)}
            >
              Access Seller Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Six Pillars Grid */}
      <section style={{ padding: '60px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '8px' }}>
            Core Platform Pillars
          </h2>
          <p style={{ color: 'var(--slate-600)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
            Comprehensive post-harvest market intelligence built specifically for Maharashtra agricultural ecosystems.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
          }}
        >
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <Card
                key={idx}
                style={{
                  border: pillar.highlight ? '2px solid var(--primary-600)' : '1px solid var(--border-color)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  backgroundColor: pillar.highlight ? 'var(--primary-50)' : '#ffffff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: pillar.highlight ? 'var(--primary-700)' : 'var(--primary-100)',
                      color: pillar.highlight ? '#ffffff' : 'var(--primary-800)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={24} />
                  </div>
                  <Badge variant={pillar.highlight ? 'success' : 'neutral'}>
                    {pillar.badge}
                  </Badge>
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                  {pillar.title}
                </h3>

                <p style={{ fontSize: '0.925rem', color: 'var(--slate-700)', lineHeight: '1.5', flexGrow: 1 }}>
                  {pillar.desc}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Platform Participants & Role Selection */}
      <section
        style={{
          backgroundColor: '#ffffff',
          padding: '60px 24px',
          borderTop: '1px solid var(--border-color)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '8px' }}>
              Platform Participants & Portals
            </h2>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem' }}>
              A unified agricultural ecosystem connecting smallholders, FPOs, institutional buyers, storage operators, and regulatory authorities.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
            }}
          >
            {participants.map((p, idx) => (
              <Card
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid var(--border-color)',
                  backgroundColor: '#ffffff',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--primary-800)',
                      }}
                    >
                      {p.role}
                    </span>
                    <Badge variant={p.role === 'ADMIN' ? 'neutral' : 'success'}>{p.badge}</Badge>
                  </div>

                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '8px' }}>
                    {p.title}
                  </h4>

                  <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginBottom: '16px', lineHeight: '1.5' }}>
                    {p.desc}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={p.onAction}
                    style={{ width: '100%' }}
                  >
                    {p.actionText}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={p.onLogin}
                    style={{ width: '100%' }}
                  >
                    {p.loginText}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          marginTop: 'auto',
          backgroundColor: 'var(--slate-900)',
          color: 'var(--slate-400)',
          padding: '32px 24px',
          fontSize: '0.875rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#ffffff', fontWeight: 700, fontSize: '1.1rem' }}>
            <Sprout size={20} />
            <span>AgriSaathi — Unified Maharashtra Agricultural Market Intelligence & Trade Platform</span>
          </div>
          <p>
            Developed for Smart India Hackathon. Prototype Demonstration Mode.
            All APMC prices, price predictions, and buyer offers shown in prototype are simulated/historical sample data for academic & presentation purposes.
          </p>
          <div style={{ borderTop: '1px solid var(--slate-800)', paddingTop: '12px', color: 'var(--slate-500)', fontSize: '0.8rem' }}>
            Unified Architecture: Sellers, Buyers, Cold Storage & Government Regulatory Escrow in One Platform
          </div>
        </div>
      </footer>

      {/* Registration Role Selection Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Choose Registration Type"
        maxWidth="540px"
      >
        <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)', marginBottom: '20px' }}>
          Select your participant role in the AgriSaathi unified agricultural trade ecosystem:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            onClick={() => {
              setIsRegisterModalOpen(false);
              onSelectRole('FARMER', 'register');
            }}
            style={{
              padding: '14px 16px',
              border: '2px solid var(--primary-200)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--primary-50)',
              transition: 'all 0.15s ease',
            }}
          >
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-900)' }}>
                Individual Farmer
              </h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--primary-800)', marginTop: '2px' }}>
                Register farm holdings, list crop produce, and receive AI sale timing guidance.
              </p>
            </div>
            <ArrowRight size={20} color="var(--primary-700)" />
          </div>

          <div
            onClick={() => {
              setIsRegisterModalOpen(false);
              onSelectRole('FPO', 'register');
            }}
            style={{
              padding: '14px 16px',
              border: '1px solid var(--slate-200)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#ffffff',
              transition: 'all 0.15s ease',
            }}
          >
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                Farmer Producer Organization (FPO)
              </h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--slate-600)', marginTop: '2px' }}>
                Aggregate crop lots across member farmers and access bulk buyer contracts.
              </p>
            </div>
            <ArrowRight size={20} color="var(--slate-600)" />
          </div>

          <div
            onClick={() => {
              setIsRegisterModalOpen(false);
              onSelectRole('BUYER', 'register');
            }}
            style={{
              padding: '14px 16px',
              border: '1px solid var(--slate-200)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#ffffff',
              transition: 'all 0.15s ease',
            }}
          >
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                Institutional Wholesale Buyer
              </h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--slate-600)', marginTop: '2px' }}>
                Procure directly from farmers/FPOs with two-way negotiations and escrow protection.
              </p>
            </div>
            <ArrowRight size={20} color="var(--slate-600)" />
          </div>

          <div
            onClick={() => {
              setIsRegisterModalOpen(false);
              onSelectRole('WAREHOUSE', 'register');
            }}
            style={{
              padding: '14px 16px',
              border: '1px solid var(--slate-200)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#ffffff',
              transition: 'all 0.15s ease',
            }}
          >
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                Warehouse & Cold Storage Operator
              </h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--slate-600)', marginTop: '2px' }}>
                List cold storage chambers, publish refrigeration tariffs, and accept bookings.
              </p>
            </div>
            <ArrowRight size={20} color="var(--slate-600)" />
          </div>
        </div>
      </Modal>

      {/* Login Role Selection Modal */}
      <Modal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="Select Login Role"
        maxWidth="460px"
      >
        <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)', marginBottom: '18px' }}>
          Select your participant role to proceed to authentication:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setIsLoginModalOpen(false);
              onGoToLogin('FARMER');
            }}
            style={{ width: '100%', justifyContent: 'space-between' }}
          >
            <span>Farmer Login</span>
            <ArrowRight size={16} />
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setIsLoginModalOpen(false);
              onGoToLogin('FPO');
            }}
            style={{ width: '100%', justifyContent: 'space-between' }}
          >
            <span>FPO Login</span>
            <ArrowRight size={16} />
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setIsLoginModalOpen(false);
              onGoToLogin('BUYER');
            }}
            style={{ width: '100%', justifyContent: 'space-between' }}
          >
            <span>Wholesale Buyer Login</span>
            <ArrowRight size={16} />
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setIsLoginModalOpen(false);
              onGoToLogin('WAREHOUSE');
            }}
            style={{ width: '100%', justifyContent: 'space-between' }}
          >
            <span>Cold Storage Login</span>
            <ArrowRight size={16} />
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setIsLoginModalOpen(false);
              onGoToLogin('ADMIN');
            }}
            style={{ width: '100%', justifyContent: 'space-between', borderColor: 'var(--slate-400)' }}
          >
            <span>Government Regulatory Officer</span>
            <ArrowRight size={16} />
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default LandingPage;
