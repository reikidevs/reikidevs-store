import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Admin pages
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import SaleDetail from './pages/admin/SaleDetail';
import SaleForm from './pages/admin/SaleForm';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
};

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/sales/new" element={
        <ProtectedRoute>
          <SaleForm />
        </ProtectedRoute>
      } />
      
      <Route path="/sales/:id" element={
        <ProtectedRoute>
          <SaleDetail />
        </ProtectedRoute>
      } />
      
      <Route path="/sales/:id/edit" element={
        <ProtectedRoute>
          <SaleForm />
        </ProtectedRoute>
      } />
      
      {/* Default redirect */}
      <Route path="/*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
