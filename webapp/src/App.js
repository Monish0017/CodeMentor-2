import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/SignupPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import InterviewPage from './pages/InterviewPage';
import ProblemListPage from './pages/problems/ProblemsListPage';
import ProblemDetailPage from './pages/problems/ProblemDetailPage';
import LeaderboardPage from './pages/leaderboard/LeaderboardPage';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import LandingPage from './pages/LandingPage';
import NotificationPage from './pages/notifications/NotificationPage';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminRegister from './pages/admin/AdminRegister';
import AdminDashboard from './pages/admin/Dashboard';
import StudentDisplay from './pages/admin/StudentDisplay';
import ProblemManagement from './pages/admin/ProblemManagement';
import NotificationManagement from './pages/admin/NotificationManagement';

// Protected route wrapper that includes Layout
const ProtectedRoute = ({ element, layoutType = 'student' }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to={layoutType === 'admin' ? '/admin/login' : '/auth/login'} />;
  }
  
  // Check user role for admin routes
  if (layoutType === 'admin') {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      return <Navigate to="/dashboard" />;
    }
    return <AdminLayout>{element}</AdminLayout>;
  }
  
  return <Layout>{element}</Layout>;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  
  // Check authentication on component mount and when token changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
      
      if (token) {
        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          setUserRole(user.role || 'student');
        } catch (error) {
          setUserRole('student');
        }
      } else {
        setUserRole(null);
      }
    };
    
    checkAuth();
    // Set up event listener for storage changes
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <Router>
        <Routes>
          {/* Landing Page - public */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Student Auth Routes - public */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          
          {/* Admin Auth Routes - public */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/register" element={<AdminRegister />} />
          
          {/* Admin Routes - protected with AdminLayout */}
          <Route 
            path="/admin/dashboard" 
            element={<ProtectedRoute element={<AdminDashboard />} layoutType="admin" />} 
          />
          <Route 
            path="/admin/students" 
            element={<ProtectedRoute element={<StudentDisplay />} layoutType="admin" />} 
          />
          <Route 
            path="/admin/problems" 
            element={<ProtectedRoute element={<ProblemManagement />} layoutType="admin" />} 
          />
          <Route 
            path="/admin/notifications" 
            element={<ProtectedRoute element={<NotificationManagement />} layoutType="admin" />} 
          />
          <Route 
            path="/admin/analytics" 
            element={<ProtectedRoute element={<div>Analytics Page - Coming Soon</div>} layoutType="admin" />} 
          />
          
          {/* Student Routes - protected with Layout */}
          <Route 
            path="/dashboard" 
            element={<ProtectedRoute element={<DashboardPage />} />} 
          />
          <Route 
            path="/interview" 
            element={<ProtectedRoute element={<InterviewPage />} />} 
          />
          <Route 
            path="/problems" 
            element={<ProtectedRoute element={<ProblemListPage />} />} 
          />
          <Route 
            path="/problems/:problemId" 
            element={<ProtectedRoute element={<ProblemDetailPage />} />} 
          />
          <Route 
            path="/leaderboard" 
            element={<ProtectedRoute element={<LeaderboardPage />} />} 
          />
          <Route 
            path="/notifications" 
            element={<ProtectedRoute element={<NotificationPage />} />} 
          />
          <Route 
            path="/profile" 
            element={<ProtectedRoute element={<div>Profile Page</div>} />} 
          />
          
          {/* Catch legacy login/register routes and redirect */}
          <Route path="/login" element={<Navigate to="/auth/login" />} />
          <Route path="/register" element={<Navigate to="/auth/register" />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
