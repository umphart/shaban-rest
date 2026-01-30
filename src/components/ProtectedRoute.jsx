import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const isAdmin = localStorage.getItem('isAdmin');
  const activeCashier = localStorage.getItem('activeCashier');

  if (!isAdmin && !activeCashier) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;