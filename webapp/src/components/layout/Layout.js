import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Material Design default avatar URL
  const materialDefaultAvatar = "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff&rounded=true&size=128";

  useEffect(() => {
    // Check if user is logged in using localStorage
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    // Clear authentication data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const goToProfile = () => {
    navigate('/profile');
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { id: 'problems', label: 'Coding Problems', path: '/problems', icon: '💻' },
    { id: 'interviews', label: 'AI Interview', path: '/interview', icon: '🤖' },
    { id: 'leaderboard', label: 'Leaderboard', path: '/leaderboard', icon: '🏆' },
    { id: 'notifications', label: 'Job Alerts', path: '/notifications', icon: '🔔' },
  ];

  return (
    <div className="layout">
      <header className="header">
        <div className="logo">CodeMentor</div>
        <div className="user-actions">
          {isAuthenticated && user?.name && (
            <>
              <span className="user-name">Hello, {user.name}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          )}
        </div>
      </header>
      <div className="main-layout">
        <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <h2>Student Platform</h2>
            <button className="toggle-button" onClick={toggleSidebar}>
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>

          {/* User Profile Section */}
          <div className="user-profile">
            <div className="avatar">
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt="Profile" />
              ) : (
                <img src={materialDefaultAvatar} alt="Default Profile" className="default-avatar" />
              )}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'User'}</div>
              <div className="user-email">{user?.email || 'user@example.com'}</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="nav-links">
            {navigationItems.map(item => (
              <div 
                key={item.id}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                {sidebarOpen && <span className="nav-label">{item.label}</span>}
              </div>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="sidebar-footer">
            <button className="logout-button" onClick={handleLogout}>
              <span className="nav-icon">🚪</span>
              {sidebarOpen && <span className="nav-label">Logout</span>}
            </button>
          </div>
        </div>
        <div className="content-wrapper">
          {children}
        </div>
      </div>
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} CodeMentor. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;
