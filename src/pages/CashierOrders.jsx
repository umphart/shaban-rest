import React, { useState, useEffect } from 'react';
import { FiEye, FiPrinter, FiArrowRight, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import Receipt from '../components/Receipt';
import './CashierOrders.css';

const CashierOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalAmount: 0,
    todayOrders: 0,
    todayAmount: 0,
  });
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();

  const activeCashier = JSON.parse(localStorage.getItem('activeCashier'));

  useEffect(() => {
    if (!activeCashier) {
      return;
    }
    fetchOrders();
  }, [activeCashier]);

  const fetchOrders = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Get all orders for this cashier
      const { data: allOrders, error: allError } = await supabase
        .from('orders')
        .select('*')
        .eq('cashier_id', activeCashier.id)
        .order('created_at', { ascending: false });

      if (allError) throw allError;

      // Get today's orders
      const { data: todayOrders, error: todayError } = await supabase
        .from('orders')
        .select('*')
        .eq('cashier_id', activeCashier.id)
        .gte('created_at', todayISO);

      if (todayError) throw todayError;

      setOrders(allOrders || []);

      // Calculate statistics
      const totalAmount = allOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
      const todayAmount = todayOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

      setStats({
        totalOrders: allOrders.length,
        totalAmount,
        todayOrders: todayOrders.length,
        todayAmount,
      });
    } catch (error) {
      toast.error('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const viewReceipt = (order) => {
    setSelectedOrder({
      ...order,
      cashier_name: activeCashier.name
    });
    setShowReceipt(true);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const goToNewOrder = () => {
    navigate('/new-order');
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  if (!activeCashier) {
    return (
      <div className="no-cashier-state">
        <div className="empty-icon">
          <FiEye size={48} />
        </div>
        <h2 className="empty-title">Cashier Access Required</h2>
        <p className="empty-description">
          Please switch to cashier mode to view your orders
        </p>
        <button onClick={goToDashboard} className="switch-cashier-btn">
          Switch to Cashier Mode
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="cashier-orders-container">


      {/* Cashier Stats */}
      <div className="cashier-stats-grid">
        <div className="stat-card total">
          <h3 className="stat-label">Total Orders (All Time)</h3>
          <p className="stat-value">{stats.totalOrders.toLocaleString()}</p>
          <p className="stat-subvalue">
            ₦{stats.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="stat-card today">
          <h3 className="stat-label">Today's Orders</h3>
          <p className="stat-value">{stats.todayOrders.toLocaleString()}</p>
          <p className="stat-subvalue">
            ₦{stats.todayAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="orders-table-container">
        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FiPrinter size={48} />
            </div>
            <h3 className="empty-title">No Orders Found</h3>
            <p className="empty-description">
              You haven't processed any orders yet. Start by creating your first order!
            </p>
            <button onClick={goToNewOrder} className="new-order-btn">
              Create New Order
              <FiArrowRight />
            </button>
          </div>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Payment</th>
                <th>Amount</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <div className="order-number">{order.order_number}</div>
                  </td>
                  <td>
                    <div className="order-date">
                      {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </td>
                  <td>
                    <div className="order-customer">
                      {order.customer_name || 'Walk-in'}
                    </div>
                  </td>
                  <td>
                    <span className={`payment-badge ${order.payment_type}`}>
                      {order.payment_type}
                    </span>
                  </td>
                  <td>
                    <div className="order-amount">
                      ₦{parseFloat(order.total_amount || 0).toFixed(2)}
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => viewReceipt(order)}
                      className="receipt-btn"
                      title="View Receipt"
                    >
                      <FiPrinter />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Receipt Modal */}
      {showReceipt && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">Order Receipt</h2>
              <button
                onClick={() => setShowReceipt(false)}
                className="modal-close"
                title="Close"
              >
                <FiX />
              </button>
            </div>
            
            <div className="receipt-content">
              <Receipt order={selectedOrder} />
            </div>
            
            <div className="modal-footer">
              <button
                onClick={() => setShowReceipt(false)}
                className="close-btn"
              >
                Close
              </button>
              <button
                onClick={handlePrintReceipt}
                className="print-btn"
              >
                <FiPrinter />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierOrders;