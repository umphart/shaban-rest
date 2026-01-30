import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiUsers, 
  FiPackage, 
  FiShoppingCart, 
  FiMenu,
  FiLogOut,
  FiUser,
  FiPlusCircle,
  FiX,
  FiBell,
  FiSettings
} from 'react-icons/fi';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';
import './Layout.css';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeCashier, setActiveCashier] = useState(
    JSON.parse(localStorage.getItem('activeCashier')) || null
  );
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Auto-close sidebar on mobile when route changes
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location]);

  const navItems = [
    { path: '/dashboard', icon: <FiHome />, label: 'Dashboard', badge: null },
    { path: '/cashiers', icon: <FiUsers />, label: 'Cashiers', badge: null },
    { path: '/foods', icon: <FiPackage />, label: 'Foods', badge: null },
    { path: '/orders', icon: <FiShoppingCart />, label: 'All Orders', badge: null },
    { path: '/cashier-orders', icon: <FiUser />, label: 'My Orders', badge: null },
    { path: '/new-order', icon: <FiPlusCircle />, label: 'New Order', badge: null },
  ];

  const logout = () => {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('activeCashier');
    setIsAdmin(false);
    setActiveCashier(null);
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    const item = navItems.find(item => item.path === path);
    return item ? item.label : 'Dashboard';
  };

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar-container ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="restaurant-logo">
            <div className="logo-icon">
              <FiPackage />
            </div>
            <span className="logo-text">Shaban Restaurant</span>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="sidebar-close"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
        
        <div className="sidebar-nav">
          <nav className="nav-list">
            {navItems.map((item) => {
              // Hide admin-only routes for cashiers
              if (!isAdmin && ['/cashiers', '/foods', '/orders'].includes(item.path)) {
                return null;
              }
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => 
                    `nav-item ${isActive ? 'active' : ''}`
                  }
                  onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
        
        <div className="user-panel">
          <div className="user-info">
            <div className="user-details">
              <div className="user-name">
                {activeCashier ? activeCashier.name : 'Administrator'}
              </div>
              <div className="user-role">
                {activeCashier ? (
                  <span className={activeCashier.type === 'cash' ? 'text-green-400' : 'text-blue-400'}>
                    {activeCashier.type === 'cash' ? 'Cash Cashier' : 'Transfer/POS Cashier'}
                  </span>
                ) : 'System Administrator'}
              </div>
            </div>
            <button
              onClick={logout}
              className="logout-button"
              title="Logout"
            >
              <FiLogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        <header className="main-header">
          <div className="header-content">
            <div className="header-left">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="sidebar-toggle"
              >
                <FiMenu size={20} />
              </button>
              <h1 className="page-title">{getPageTitle()}</h1>
            </div>
            
            <div className="header-right">
              {activeCashier && (
                <div className="cashier-status">
                  <div className="status-indicator"></div>
                  <span className="status-text">
                    Active: {activeCashier.type === 'cash' ? 'Cash' : 'Transfer/POS'}
                  </span>
                </div>
              )}
              
{isAdmin && (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px' 
  }}>
    <button style={{
      padding: '6px',
      background: 'transparent',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#9ca3af' : '#6b7280'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.color = window.matchMedia('(prefers-color-scheme: dark)').matches ? '#d1d5db' : '#374151';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.color = window.matchMedia('(prefers-color-scheme: dark)').matches ? '#9ca3af' : '#6b7280';
    }}
    >
      <FiBell size={18} />
    </button>
    
    <button style={{
      padding: '6px',
      background: 'transparent',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: window.matchMedia('(prefers-color-scheme: dark)').matches ? '#9ca3af' : '#6b7280'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.color = window.matchMedia('(prefers-color-scheme: dark)').matches ? '#d1d5db' : '#374151';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.color = window.matchMedia('(prefers-color-scheme: dark)').matches ? '#9ca3af' : '#6b7280';
    }}
    >
      <FiSettings size={18} />
    </button>
  </div>
)}
            </div>
          </div>
        </header>
        
        <main className="main-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;