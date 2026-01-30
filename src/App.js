import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cashiers from './pages/Cashiers';
import Foods from './pages/Foods';
import Orders from './pages/Orders';
import CashierOrders from './pages/CashierOrders';
import NewOrder from './pages/NewOrder';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import './styles.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="cashiers" element={<Cashiers />} />
            <Route path="foods" element={<Foods />} />
            <Route path="orders" element={<Orders />} />
            <Route path="cashier-orders" element={<CashierOrders />} />
            <Route path="new-order" element={<NewOrder />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;