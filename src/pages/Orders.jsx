import React, { useState, useEffect } from 'react';
import { FiEye, FiFilter, FiDownload, FiX, FiCheck, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentType: '',
    cashierId: '',
  });
  const [cashiers, setCashiers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchCashiers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          cashiers:cashier_id (name, type)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      setFilteredOrders(data || []);
    } catch (error) {
      toast.error('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchCashiers = async () => {
    try {
      const { data } = await supabase
        .from('cashiers')
        .select('id, name')
        .eq('is_active', true);

      setCashiers(data || []);
    } catch (error) {
      console.error('Error loading cashiers:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(order => new Date(order.created_at) >= start);
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order => new Date(order.created_at) <= end);
    }

    if (filters.paymentType) {
      filtered = filtered.filter(order => order.payment_type === filters.paymentType);
    }

    if (filters.cashierId) {
      filtered = filtered.filter(order => order.cashier_id === filters.cashierId);
    }

    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      paymentType: '',
      cashierId: '',
    });
    setFilteredOrders(orders);
    setCurrentPage(1);
  };

  const calculateStats = () => {
    const stats = {
      totalOrders: filteredOrders.length,
      totalAmount: filteredOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0),
      cashOrders: filteredOrders.filter(order => order.payment_type === 'cash').length,
      cashAmount: filteredOrders
        .filter(order => order.payment_type === 'cash')
        .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0),
      transferOrders: filteredOrders.filter(order => order.payment_type === 'transfer').length,
      transferAmount: filteredOrders
        .filter(order => order.payment_type === 'transfer')
        .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0),
      posOrders: filteredOrders.filter(order => order.payment_type === 'pos').length,
      posAmount: filteredOrders
        .filter(order => order.payment_type === 'pos')
        .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0),
    };

    return stats;
  };

  const exportToCSV = () => {
    const headers = ['Order Number', 'Date', 'Cashier', 'Payment Type', 'Customer', 'Table', 'Total Amount'];
    const rows = filteredOrders.map(order => [
      order.order_number,
      format(new Date(order.created_at), 'dd/MM/yyyy HH:mm'),
      order.cashiers?.name,
      order.payment_type.toUpperCase(),
      order.customer_name || 'N/A',
      order.table_number || 'N/A',
      `₦${parseFloat(order.total_amount || 0).toFixed(2)}`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Orders exported to CSV');
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <div>
          <h1 className="orders-title">All Orders</h1>
          <p className="orders-subtitle">View and manage all restaurant orders</p>
        </div>
        <div className="orders-actions">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-btn ${showFilters ? 'active' : ''}`}
          >
            {showFilters ? <FiX /> : <FiFilter />}
            {showFilters ? 'Hide' : 'Filters'}
          </button>
          <button
            onClick={exportToCSV}
            className="export-btn"
          >
            <FiDownload />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                className="filter-input"
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                className="filter-input"
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Payment Type</label>
              <select
                value={filters.paymentType}
                onChange={(e) => setFilters({...filters, paymentType: e.target.value})}
                className="filter-select"
              >
                <option value="">All</option>
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
                <option value="pos">POS</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label className="filter-label">Cashier</label>
              <select
                value={filters.cashierId}
                onChange={(e) => setFilters({...filters, cashierId: e.target.value})}
                className="filter-select"
              >
                <option value="">All</option>
                {cashiers.map(cashier => (
                  <option key={cashier.id} value={cashier.id}>
                    {cashier.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="filter-actions">
            <button
              onClick={handleResetFilters}
              className="reset-btn"
            >
              Reset
            </button>
            <button
              onClick={() => {
                setShowFilters(false);
                applyFilters();
              }}
              className="apply-btn"
            >
              <FiCheck />
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards - Compact */}
      <div className="stats-grid-compact">
        <div className="stat-card-compact total">
          <div className="stat-label-compact">Total Orders</div>
          <div className="stat-value-compact">{stats.totalOrders}</div>
          <div className="stat-amount-compact">₦{stats.totalAmount.toFixed(2)}</div>
        </div>
        
        <div className="stat-card-compact cash">
          <div className="stat-label-compact">Cash</div>
          <div className="stat-value-compact">{stats.cashOrders}</div>
          <div className="stat-amount-compact">₦{stats.cashAmount.toFixed(2)}</div>
        </div>
        
        <div className="stat-card-compact transfer">
          <div className="stat-label-compact">Transfer</div>
          <div className="stat-value-compact">{stats.transferOrders}</div>
          <div className="stat-amount-compact">₦{stats.transferAmount.toFixed(2)}</div>
        </div>
        
        <div className="stat-card-compact pos">
          <div className="stat-label-compact">POS</div>
          <div className="stat-value-compact">{stats.posOrders}</div>
          <div className="stat-amount-compact">₦{stats.posAmount.toFixed(2)}</div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="orders-table-container">
        {filteredOrders.length === 0 ? (
          <div className="orders-empty">
            <div className="orders-empty-icon">
              <FiFilter size={48} />
            </div>
            <h3 className="orders-empty-title">No Orders Found</h3>
            <p className="orders-empty-description">
              {orders.length === 0 
                ? 'No orders have been placed yet.'
                : 'Try adjusting your filters to see more results.'
              }
            </p>
          </div>
        ) : (
          <>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date & Time</th>
                  <th>Cashier</th>
                  <th>Customer</th>
                  <th>Payment</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="order-number">{order.order_number}</div>
                    </td>
                    <td>
                      <div className="order-date">
                        {format(new Date(order.created_at), 'dd/MM/yy HH:mm')}
                      </div>
                    </td>
                    <td>
                      <div className="order-cashier">
                        {order.cashiers?.name || 'N/A'}
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
                      <div className="table-actions">
                        <button
                          onClick={() => viewOrderDetails(order)}
                          className="view-order-btn"
                          title="View Details"
                        >
                          <FiEye />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn prev"
                >
                  <FiChevronLeft />
                  Previous
                </button>
                
                <div className="pagination-info">
                  Page {currentPage} of {totalPages}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn next"
                >
                  Next
                  <FiChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-container order-details-modal">
            <div className="modal-header">
              <h2 className="modal-title">Order Details</h2>
              <button
                onClick={() => setShowOrderDetails(false)}
                className="modal-close"
              >
                &times;
              </button>
            </div>
            
            <div className="order-details">
              <div className="order-details-section">
                <h3 className="details-title">Order Information</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <div className="detail-label">Order Number</div>
                    <div className="detail-value">{selectedOrder.order_number}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Date & Time</div>
                    <div className="detail-value">
                      {format(new Date(selectedOrder.created_at), 'dd/MM/yyyy HH:mm:ss')}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Cashier</div>
                    <div className="detail-value">{selectedOrder.cashiers?.name}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Payment Type</div>
                    <div className="detail-value">
                      <span className={`payment-badge ${selectedOrder.payment_type}`}>
                        {selectedOrder.payment_type}
                      </span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Customer</div>
                    <div className="detail-value">{selectedOrder.customer_name || 'Walk-in'}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Total Amount</div>
                    <div className="detail-value">
                      ₦{parseFloat(selectedOrder.total_amount || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="order-details-section">
                <h3 className="details-title">Order Items</h3>
                <div className="items-list">
                  {JSON.parse(selectedOrder.order_items || '[]').map((item, index) => (
                    <div key={index} className="order-item">
                      <div>
                        <div className="item-name">{item.name}</div>
                        <div className="item-details">
                          {item.quantity} × ₦{item.price.toFixed(2)}
                        </div>
                      </div>
                      <div className="item-total">
                        ₦{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={() => setShowOrderDetails(false)}
                className="close-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;