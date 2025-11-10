import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SalonDashboard from './pages/SalonDashboard';
import Login from './pages/Login';
import AddBooking from './pages/AddBooking';
import AddClient from './pages/AddClient';
import Bookings from './pages/Bookings';
import Clients from './pages/Clients';
import Services from './pages/Services';
import StockManagement from './pages/StockManagement';
import Communications from './pages/Communications';
import Marketing from './pages/Marketing';
import Settings from './pages/Settings';
import Staff from './pages/Staff';
import Reports from './pages/Reports';
import AccessDeniedModal from './components/AccessDeniedModal';
import './App.css';
import './styles/global-improvements.css';

// Create context for access denial modal
const AccessDenialContext = createContext();

export const useAccessDenial = () => useContext(AccessDenialContext);

function ProtectedRoute({ children, requiredPermission, requiredTier }) {
  const { showAccessDenied } = useAccessDenial();
  const isAuthenticated = localStorage.getItem('adminToken');
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If tier or permission is required, check them
  if (requiredTier || requiredPermission) {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      return <Navigate to="/login" replace />;
    }

    try {
      const user = JSON.parse(userStr);
      
      // Check tier requirement first
      if (requiredTier) {
        const tierLevels = { free: 0, pro: 1, premium: 2 };
        const userTierLevel = tierLevels[user.subscriptionTier] || 0;
        const requiredTierLevel = tierLevels[requiredTier] || 0;
        
        if (userTierLevel < requiredTierLevel) {
          if (!shouldRedirect) {
            showAccessDenied('tier', {
              requiredTier,
              currentTier: user.subscriptionTier || 'free'
            });
            setShouldRedirect(true);
          }
          return <Navigate to="/dashboard" replace />;
        }
      }
      
      // Check permission requirement
      if (requiredPermission) {
        // Owner has all permissions
        if (user.role === 'owner') {
          return children;
        }
        
        const permissions = user.permissions || {};
        
        // Check if user has the required permission
        if (!permissions[requiredPermission]) {
          if (!shouldRedirect) {
            showAccessDenied('permission', {
              permission: requiredPermission
            });
            setShouldRedirect(true);
          }
          return <Navigate to="/dashboard" replace />;
        }
      }
      
    } catch (error) {
      console.error('ProtectedRoute: Error checking access:', error);
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}

function App() {
  const [accessDenialModal, setAccessDenialModal] = useState({
    show: false,
    type: null,
    details: {}
  });

  const showAccessDenied = (type, details) => {
    setAccessDenialModal({
      show: true,
      type,
      details
    });
  };

  const closeAccessDenied = () => {
    setAccessDenialModal({
      show: false,
      type: null,
      details: {}
    });
  };

  return (
    <AccessDenialContext.Provider value={{ showAccessDenied }}>
      <Router>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <SalonDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/add-booking" 
          element={
            <ProtectedRoute>
              <AddBooking />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/add-client" 
          element={
            <ProtectedRoute>
              <AddClient />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/bookings" 
          element={
            <ProtectedRoute>
              <Bookings />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/clients" 
          element={
            <ProtectedRoute>
              <Clients />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/services" 
          element={
            <ProtectedRoute>
              <Services />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/stock" 
          element={
            <ProtectedRoute requiredTier="pro" requiredPermission="canManageInventory">
              <StockManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/communications" 
          element={
            <ProtectedRoute requiredTier="pro" requiredPermission="canViewCommunications">
              <Communications />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/marketing" 
          element={
            <ProtectedRoute requiredTier="pro" requiredPermission="canViewMarketing">
              <Marketing />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/staff" 
          element={
            <ProtectedRoute requiredTier="pro" requiredPermission="canManageStaff">
              <Staff />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute requiredTier="pro" requiredPermission="canViewReports">
              <Reports />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <AccessDeniedModal
        show={accessDenialModal.show}
        type={accessDenialModal.type}
        details={accessDenialModal.details}
        onClose={closeAccessDenied}
      />
    </Router>
    </AccessDenialContext.Provider>
  );
}

export default App;
