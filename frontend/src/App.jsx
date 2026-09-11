import React, { useState, useEffect } from 'react';
import './App.css';
import {
  Navbar,
  Sidebar,
  PageHeader,
  Button,
  StatusBadge,
  Badge,
  Modal,
  Card,
  StatCard,
} from './components/common';
import LandingPage from './pages/LandingPage';
import FarmerRegister from './pages/auth/FarmerRegister';
import FPORegister from './pages/auth/FPORegister';
import SellerLogin from './pages/auth/SellerLogin';
import SellerDashboard from './pages/farmer/SellerDashboard';
import ProfilePage from './pages/farmer/ProfilePage';
import AddProducePage from './pages/farmer/AddProducePage';
import MyProducePage from './pages/farmer/MyProducePage';
import LotDetailPage from './pages/farmer/LotDetailPage';
import MarketPricesPage from './pages/market/MarketPricesPage';
import PricePredictionPage from './pages/market/PricePredictionPage';
import SaleAdvisorPage from './pages/ai/SaleAdvisorPage';
import StorageDiscoveryPage from './pages/farmer/StorageDiscoveryPage';
import BuyerOffersPage from './pages/farmer/BuyerOffersPage';
import FPOAggregationPage from './pages/fpo/FPOAggregationPage';
import NotificationsPage from './pages/farmer/NotificationsPage';
import TransactionsPage from './pages/farmer/TransactionsPage';
import PaymentsEscrowPage from './pages/farmer/PaymentsEscrowPage';
import GrievancesPage from './pages/farmer/GrievancesPage';
import BuyerRegister from './pages/auth/BuyerRegister';
import WarehouseRegister from './pages/auth/WarehouseRegister';
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import WarehouseDashboard from './pages/warehouse/WarehouseDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import api from './services/api';
import {
  ArrowLeft,
  Info,
  Clock,
  ShieldCheck,
  PackageOpen,
  Truck,
  MapPin,
  CheckCircle2,
  Navigation,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AgriSaathi Render Error Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 20px', maxWidth: '680px', margin: '0 auto' }}>
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '32px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)',
            }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertCircle size={26} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#991b1b', marginBottom: '8px' }}>
              Section Display Notice
            </h3>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.5', maxWidth: '520px', margin: '0 auto 20px' }}>
              {this.state.error?.message || 'A temporary visual layout issue occurred in this section.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  if (this.props.onReset) this.props.onReset();
                }}
                style={{
                  backgroundColor: 'var(--primary-700)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ArrowLeft size={16} />
                <span>Return to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  // Current view: 'landing' | 'login' | 'register-farmer' | 'register-fpo' | 'register-buyer' | 'register-warehouse' | 'buyer-portal' | 'warehouse-portal' | 'admin-portal' | 'seller-portal'
  const [currentView, setCurrentView] = useState('landing');
  const [loginInitialRole, setLoginInitialRole] = useState('FARMER');
  const [activeRoute, setActiveRoute] = useState('dashboard');
  const [prevRoute, setPrevRoute] = useState('dashboard');
  const [selectedLotId, setSelectedLotId] = useState(1);
  const [backendStatus, setBackendStatus] = useState(null);
  const [isHealthLoading, setIsHealthLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState(null);

  // Active authenticated user state
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadNotifs, setUnreadNotifs] = useState(2);

  // Detect URL on initial load for deep linking / direct portal routes
  useEffect(() => {
    try {
      const path = (window.location.pathname || '').toLowerCase();
      const search = new URLSearchParams(window.location.search || '');
      const roleParam = (search.get('role') || '').toUpperCase();

      if (path.includes('/buyer') || roleParam === 'BUYER') {
        if (path.includes('/dashboard') || path === '/buyer' || search.get('tab')) {
          setCurrentUser({
            id: 8,
            role: 'BUYER',
            name: 'Mahalaxmi Agro Wholesale & Retail Pvt. Ltd.',
            phone: '9820011223',
            verification_status: 'VERIFIED',
            profile: {
              company_name: 'Mahalaxmi Agro Wholesale & Retail Pvt. Ltd.',
              gst_number: '27AAACM1234F1Z5',
              district: 'Navi Mumbai',
            }
          });
          setCurrentView('buyer-portal');
        } else {
          setLoginInitialRole('BUYER');
          setCurrentView('login');
        }
      } else if (path.includes('/warehouse') || roleParam === 'WAREHOUSE') {
        setLoginInitialRole('WAREHOUSE');
        setCurrentView('login');
      } else if (path.includes('/admin') || roleParam === 'ADMIN') {
        setLoginInitialRole('ADMIN');
        setCurrentView('login');
      } else if (path.includes('/login')) {
        if (roleParam) setLoginInitialRole(roleParam);
        setCurrentView('login');
      }
    } catch (e) {
      console.warn('URL parse error:', e);
    }
  }, []);

  const handleNavigate = (route, param = null) => {
    if (route === 'lot-detail' && param) {
      setSelectedLotId(param);
    }
    setPrevRoute(activeRoute);
    setActiveRoute(route);
  };

  const handleGoBack = () => {
    setActiveRoute(prevRoute || 'dashboard');
  };

  useEffect(() => {
    async function checkBackend() {
      try {
        setIsHealthLoading(true);
        const data = await api.checkHealth();
        setBackendStatus({ online: true, data });
      } catch (err) {
        setBackendStatus({ online: false, error: err.message });
      } finally {
        setIsHealthLoading(false);
      }
    }

    checkBackend();
  }, []);

  useEffect(() => {
    async function loadNotificationsCount() {
      try {
        const userId = currentUser?.id || 1;
        const res = await api.get(`/api/notifications?user_id=${userId}`);
        if (res && res.unread_count !== undefined) {
          setUnreadNotifs(res.unread_count);
        }
      } catch (e) {
        // silent fallback
      }
    }
    loadNotificationsCount();
  }, [currentUser?.id, activeRoute]);

  // Handle actions from Landing Page
  const handleSelectRole = (role, action) => {
    if (action === 'register') {
      if (role === 'FARMER') {
        setCurrentView('register-farmer');
      } else if (role === 'FPO') {
        setCurrentView('register-fpo');
      } else if (role === 'BUYER') {
        setCurrentView('register-buyer');
      } else if (role === 'WAREHOUSE') {
        setCurrentView('register-warehouse');
      }
    } else {
      setLoginInitialRole(role);
      setCurrentView('login');
    }
  };

  const handleGoToLogin = (role) => {
    setLoginInitialRole(role);
    setCurrentView('login');
  };

  // Handle registration success
  const handleRegisterSuccess = (user, message) => {
    setCurrentUser(user);
    setActiveRoute('dashboard');
    setFeedbackBanner({
      type: 'success',
      title: 'Registration Submitted',
      message: message,
    });
    if (user?.role === 'BUYER') setCurrentView('buyer-portal');
    else if (user?.role === 'WAREHOUSE') setCurrentView('warehouse-portal');
    else if (user?.role === 'ADMIN') setCurrentView('admin-portal');
    else setCurrentView('seller-portal');
  };

  // Handle login success
  const handleLoginSuccess = (user, message) => {
    setCurrentUser(user);
    setActiveRoute('dashboard');
    setFeedbackBanner({
      type: 'info',
      title: 'Login Successful',
      message: message,
    });
    if (user?.role === 'BUYER') setCurrentView('buyer-portal');
    else if (user?.role === 'WAREHOUSE') setCurrentView('warehouse-portal');
    else if (user?.role === 'ADMIN') setCurrentView('admin-portal');
    else setCurrentView('seller-portal');
  };

  // Handle logout
  const handleLogout = () => {
    setCurrentUser(null);
    setFeedbackBanner(null);
    setActiveRoute('dashboard');
    setCurrentView('landing');
    try {
      window.history.pushState({}, '', '/');
    } catch (e) {}
  };

  // 1. Render Landing Page
  if (currentView === 'landing') {
    return (
      <LandingPage
        onSelectRole={handleSelectRole}
        onGoToLogin={handleGoToLogin}
      />
    );
  }

  // 2. Render Farmer Registration
  if (currentView === 'register-farmer') {
    return (
      <FarmerRegister
        onBackToLanding={() => setCurrentView('landing')}
        onRegisterSuccess={handleRegisterSuccess}
        onSwitchToLogin={() => {
          setLoginInitialRole('FARMER');
          setCurrentView('login');
        }}
      />
    );
  }

  // 3. Render FPO Registration
  if (currentView === 'register-fpo') {
    return (
      <FPORegister
        onBackToLanding={() => setCurrentView('landing')}
        onRegisterSuccess={handleRegisterSuccess}
        onSwitchToLogin={() => {
          setLoginInitialRole('FPO');
          setCurrentView('login');
        }}
      />
    );
  }

  // 4. Render Buyer Registration
  if (currentView === 'register-buyer') {
    return (
      <BuyerRegister
        onBackToLanding={() => setCurrentView('landing')}
        onRegisterSuccess={handleRegisterSuccess}
        onSwitchToLogin={() => {
          setLoginInitialRole('BUYER');
          setCurrentView('login');
        }}
      />
    );
  }

  // 5. Render Warehouse Registration
  if (currentView === 'register-warehouse') {
    return (
      <WarehouseRegister
        onBackToLanding={() => setCurrentView('landing')}
        onRegisterSuccess={handleRegisterSuccess}
        onSwitchToLogin={() => {
          setLoginInitialRole('WAREHOUSE');
          setCurrentView('login');
        }}
      />
    );
  }

  // 6. Render Login (supports all 5 roles)
  if (currentView === 'login') {
    return (
      <SellerLogin
        initialRole={loginInitialRole}
        onBackToLanding={() => setCurrentView('landing')}
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={(role) => {
          if (role === 'FARMER') setCurrentView('register-farmer');
          else if (role === 'FPO') setCurrentView('register-fpo');
          else if (role === 'BUYER') setCurrentView('register-buyer');
          else if (role === 'WAREHOUSE') setCurrentView('register-warehouse');
        }}
      />
    );
  }

  // 7. Role-Specific Dedicated Portals
  if (currentView === 'buyer-portal' || (currentUser && currentUser.role === 'BUYER')) {
    const buyerUser = (currentUser && currentUser.role === 'BUYER') ? currentUser : {
      id: 8,
      role: 'BUYER',
      name: 'Mahalaxmi Agro Wholesale & Retail Pvt. Ltd.',
      phone: '9820011223',
      verification_status: 'VERIFIED',
      profile: {
        company_name: 'Mahalaxmi Agro Wholesale & Retail Pvt. Ltd.',
        gst_number: '27AAACM1234F1Z5',
        district: 'Navi Mumbai',
      }
    };
    return (
      <BuyerDashboard
        user={buyerUser}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
    );
  }

  if (currentView === 'warehouse-portal' || (currentUser && currentUser.role === 'WAREHOUSE')) {
    const whUser = (currentUser && currentUser.role === 'WAREHOUSE') ? currentUser : {
      id: 9,
      role: 'WAREHOUSE',
      name: 'Nashik Agro Cold Storage',
      phone: '9830022334',
      verification_status: 'VERIFIED',
    };
    return (
      <WarehouseDashboard
        user={whUser}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
    );
  }

  if (currentView === 'admin-portal' || (currentUser && currentUser.role === 'ADMIN')) {
    const adminUser = (currentUser && currentUser.role === 'ADMIN') ? currentUser : {
      id: 10,
      role: 'ADMIN',
      name: 'MahaAgri State Nodal Officer',
      phone: '9810000001',
      verification_status: 'VERIFIED',
    };
    return (
      <AdminDashboard
        user={adminUser}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
    );
  }

  // Active user fallback (for direct testing)
  const user = currentUser || {
    id: 1,
    role: 'FARMER',
    phone: '9823012345',
    verification_status: 'VERIFIED',
    profile: {
      full_name: 'Suresh Patil',
      district: 'Nashik',
      village: 'Dindori',
    },
  };

  const displayName =
    user.role === 'FPO'
      ? user.profile?.fpo_name || 'Sahyadri Farmers Producer Co.'
      : user.profile?.full_name || 'Suresh Patil';

  // Render appropriate view based on activeRoute
  const renderRouteContent = () => {
    switch (activeRoute) {
      case 'dashboard':
        return (
          <SellerDashboard
            user={user}
            onNavigate={handleNavigate}
          />
        );

      case 'markets':
        return (
          <MarketPricesPage
            user={user}
            onNavigate={handleNavigate}
          />
        );

      case 'ai-advisor':
        return (
          <SaleAdvisorPage
            user={user}
            onNavigate={handleNavigate}
          />
        );

      case 'price-prediction':
        return (
          <PricePredictionPage
            user={user}
            onNavigate={handleNavigate}
          />
        );

      case 'add-produce':
        return (
          <AddProducePage
            user={user}
            onNavigate={handleNavigate}
          />
        );

      case 'my-lots':
        return (
          <MyProducePage
            user={user}
            onNavigate={handleNavigate}
            onViewLot={(lotId) => {
              setSelectedLotId(lotId);
              setActiveRoute('lot-detail');
            }}
          />
        );

      case 'lot-detail':
        return (
          <LotDetailPage
            lotId={selectedLotId || 1}
            user={user}
            onNavigate={handleNavigate}
          />
        );

      case 'storage':
        return (
          <StorageDiscoveryPage
            user={user}
            onNavigate={handleNavigate}
          />
        );

      case 'buyer-offers':
        return (
          <BuyerOffersPage
            user={user}
            onNavigate={handleNavigate}
          />
        );

      case 'fpo-aggregation':
        return (
          <FPOAggregationPage
            user={user}
            onNavigate={handleNavigate}
          />
        );

      case 'notifications':
        return (
          <NotificationsPage
            user={user}
            onNavigate={handleNavigate}
          />
        );

      case 'profile':
        return (
          <ProfilePage
            user={user}
            onBackToDashboard={() => setActiveRoute('dashboard')}
          />
        );

      case 'transactions':
        return (
          <TransactionsPage
            user={user}
            onNavigate={handleNavigate}
          />
        );

      case 'payments':
        return (
          <PaymentsEscrowPage
            user={user}
            onNavigate={handleNavigate}
          />
        );

      case 'grievances':
        return (
          <GrievancesPage
            user={user}
            onNavigate={handleNavigate}
          />
        );

      case 'logistics':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '820px', margin: '30px auto', padding: '0 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <Button variant="outline-primary" icon={ArrowLeft} onClick={handleGoBack}>
                ← Back
              </Button>
              <Button variant="primary" onClick={() => setActiveRoute('dashboard')}>
                Return to Dashboard
              </Button>
            </div>

            <Card style={{ padding: '48px 32px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  border: '2px solid #bfdbfe',
                }}
              >
                <Truck size={36} />
              </div>

              <span
                style={{
                  display: 'inline-block',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginBottom: '16px',
                }}
              >
                🔔 Coming Soon / Integration in Progress
              </span>

              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 12px' }}>
                Agricultural Logistics & Cold-Chain Transport Network
              </h2>

              <p style={{ fontSize: '0.96rem', color: 'var(--slate-600)', lineHeight: 1.6, maxWidth: '580px', margin: '0 auto 28px' }}>
                Farmgate pickup scheduling, multi-mandi transport dispatch, and temperature-controlled reefer fleet allocation across Maharashtra are currently scheduled for direct integration under the state GovTech Agri-Corridor roadmap.
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button variant="outline-primary" icon={ArrowLeft} onClick={handleGoBack}>
                  ← Back to Previous Module
                </Button>
                <Button variant="primary" onClick={() => setActiveRoute('dashboard')}>
                  Go to Main Dashboard
                </Button>
                <Button variant="outline-primary" onClick={() => setActiveRoute('fpo-aggregation')}>
                  Go to FPO Portal
                </Button>
              </div>
            </Card>
          </div>
        );

      default:
        // Upcoming step placeholder (Steps 6-21)
        return (
          <div style={{ padding: '32px 0' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '40px 24px',
                textAlign: 'center',
                maxWidth: '640px',
                margin: '0 auto',
              }}
            >
              <PackageOpen size={48} color="var(--primary-700)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '8px' }}>
                {activeRoute.replace('-', ' ').toUpperCase()} Module
              </h3>
              <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem', marginBottom: '24px' }}>
                This module is scheduled in the incremental development sequence (Steps 6 to 21).
                Current active step: <strong>Step 5 (Farmer/FPO Dashboard)</strong>.
              </p>
              <Button variant="primary" onClick={() => setActiveRoute('dashboard')}>
                Return to Dashboard
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {/* Navbar */}
        <Navbar
          user={{
            name: displayName,
            phone: user.phone,
            role: user.role,
            verification_status: user.verification_status,
          }}
          unreadCount={unreadNotifs}
          onLogout={handleLogout}
          onNotificationClick={() => setActiveRoute('notifications')}
        />

        <div style={{ display: 'flex', flex: 1 }}>
          {/* Sidebar */}
          <Sidebar
            activeRoute={activeRoute}
            onRouteChange={(route) => setActiveRoute(route)}
            userRole={user.role}
          />

          {/* Main Content Area */}
          <main className="main-content">
            <div className="page-wrapper">
              {/* Back to Public / Auth Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {activeRoute !== 'dashboard' && (
                    <button
                      type="button"
                      onClick={handleGoBack}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        color: '#1e293b',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        transition: 'all 0.15s ease',
                      }}
                      title="Return to previous screen"
                    >
                      <ArrowLeft size={16} />
                      <span>Back</span>
                    </button>
                  )}

                  <button
                    onClick={() => setCurrentView('landing')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-700)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      padding: '4px 0',
                    }}
                  >
                    <ArrowLeft size={16} />
                    <span>Exit to Public Portal</span>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>Active Account:</span>
                  <Badge variant={user.role === 'FPO' ? 'info' : 'success'}>
                    {user.role}
                  </Badge>
                  <Badge variant={user.verification_status === 'VERIFIED' ? 'success' : 'warning'}>
                    {user.verification_status}
                  </Badge>
                </div>
              </div>

              {/* Feedback Banner (from login/register) */}
              {feedbackBanner && (
                <div
                  style={{
                    backgroundColor: feedbackBanner.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-info-bg)',
                    border: `1px solid ${feedbackBanner.type === 'success' ? 'var(--status-success-border)' : 'var(--status-info-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ color: feedbackBanner.type === 'success' ? 'var(--status-success-text)' : 'var(--status-info-text)' }}>
                      {feedbackBanner.title}:
                    </strong>{' '}
                    <span style={{ fontSize: '0.9rem', color: 'var(--slate-800)' }}>
                      {feedbackBanner.message}
                    </span>
                  </div>
                  <button
                    onClick={() => setFeedbackBanner(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 700,
                      color: 'var(--slate-500)',
                      padding: '4px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Render dynamic route content protected by ErrorBoundary */}
              <ErrorBoundary onReset={() => setActiveRoute('dashboard')}>
                {renderRouteContent()}
              </ErrorBoundary>

              {/* Platform Info Modal */}
              <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="AgriSaathi Platform Status"
                footer={
                  <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                    Close
                  </Button>
                }
              >
                <div style={{ fontSize: '0.9rem', color: 'var(--slate-700)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p>
                    <strong>AgriSaathi Platform Status:</strong> Fully unified application. All stakeholder portals (Farmer, FPO, Wholesale Buyer, Cold Storage Warehouse, Government Admin), two-way trade negotiations, Government Escrow payments, and dispute redressal are operational.
                  </p>
                </div>
              </Modal>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
