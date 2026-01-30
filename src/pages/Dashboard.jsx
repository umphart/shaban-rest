import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiShoppingCart, FiUsers, FiPackage, FiRefreshCw } from 'react-icons/fi';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCashiers: 0,
    totalFoods: 0,
    todayOrders: 0,
    todayRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [cashierPerformance, setCashierPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Get all data in parallel for better performance
      const [
        { data: orders },
        { data: todayOrders },
        { data: cashiers },
        { data: foods }
      ] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('orders').select('*').gte('created_at', todayISO),
        supabase.from('cashiers').select('*').eq('is_active', true),
        supabase.from('foods').select('id').eq('is_available', true)
      ]);

      // Calculate totals
      const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0;
      const todayRevenue = todayOrders?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0;

      setStats({
        totalOrders: orders?.length || 0,
        totalRevenue,
        totalCashiers: cashiers?.length || 0,
        totalFoods: foods?.length || 0,
        todayOrders: todayOrders?.length || 0,
        todayRevenue,
      });

      // Get recent orders
      const { data: recentOrdersData } = await supabase
        .from('orders')
        .select('*, cashiers:cashier_id (name)')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentOrders(recentOrdersData || []);

      // Calculate cashier performance (simplified)
      if (cashiers && cashiers.length > 0) {
        const performancePromises = cashiers.map(async (cashier) => {
          const { data: cashierOrders } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('cashier_id', cashier.id)
            .gte('created_at', todayISO);

          const cashierTotal = cashierOrders?.reduce((sum, order) => 
            sum + parseFloat(order.total_amount || 0), 0
          ) || 0;

          return {
            ...cashier,
            todayOrders: cashierOrders?.length || 0,
            todayRevenue: cashierTotal,
          };
        });

        const performanceData = await Promise.all(performancePromises);
        setCashierPerformance(performanceData.sort((a, b) => b.todayRevenue - a.todayRevenue));
      }

    } catch (error) {
      toast.error('Error loading dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await fetchDashboardData();
    toast.success('Dashboard refreshed');
  };

  const statsCards = [
    {
      title: 'Orders',
      value: stats.totalOrders,
      icon: <FiShoppingCart />,
      color: 'blue',
      subtitle: `${stats.todayOrders} today`,
      trend: stats.todayOrders > 0 ? 'up' : 'neutral'
    },
    {
      title: 'Money Recieved',
      value: `₦${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: <FiDollarSign />,
      color: 'green',
      subtitle: `₦${stats.todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} today`,
      trend: stats.todayRevenue > 0 ? 'up' : 'neutral'
    },
    {
      title: 'Cashiers',
      value: stats.totalCashiers,
      icon: <FiUsers />,
      color: 'purple',
      subtitle: 'Active',
      trend: 'neutral'
    },
    {
      title: 'Foods',
      value: stats.totalFoods,
      icon: <FiPackage />,
      color: 'orange',
      subtitle: 'Available',
      trend: 'neutral'
    },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      
      <div className="stats-grid-compact">
        {statsCards.map((stat, index) => (
          <div key={index} className={`stats-card-compact ${stat.color}`}>
            <div className="stats-icon-compact">
              {stat.icon}
            </div>
            <div className="stats-info-compact">
              <p className="stats-value-compact">{stat.value}</p>
              <p className="stats-title-compact">{stat.title}</p>
              <p className="stats-subtitle-compact">{stat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Recent Orders - Compact */}
        <div className="dashboard-card-compact">
          <div className="card-header-compact">
            <h3 className="card-title-compact">Recent Orders</h3>
            <span className="view-button">5 Latest</span>
          </div>
          
          <div className="compact-table-container">
            {recentOrders.length > 0 ? (
              <table className="compact-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Amount</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="order-number-sm">{order.order_number}</td>
                      <td className="order-amount-sm">₦{parseFloat(order.total_amount || 0).toFixed(0)}</td>
                      <td>
                        <span className={`payment-badge-sm ${order.payment_type}`}>
                          {order.payment_type.charAt(0)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state-sm">
                <FiShoppingCart size={20} />
                <span>No orders today</span>
              </div>
            )}
          </div>
        </div>

        {/* Cashier Performance - Compact */}
        <div className="dashboard-card-compact">
          <div className="card-header-compact">
            <h3 className="card-title-compact">Cashier Performance</h3>
            <span className="view-button">Today</span>
          </div>
          
          <div className="performance-list-compact">
            {cashierPerformance.length > 0 ? (
              cashierPerformance.slice(0, 4).map((cashier) => (
                <div key={cashier.id} className="performance-item-compact">
                  <div className="cashier-info-compact">
                    <span className="cashier-name-compact">{cashier.name}</span>
                    <span className="cashier-type-compact">
                      {cashier.type === 'cash' ? '💵' : '💳'}
                    </span>
                  </div>
                  <div className="performance-stats-compact">
                    <span>₦{cashier.todayRevenue.toFixed(0)}</span>
                    <span>{cashier.todayOrders} orders</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state-sm">
                <FiUsers size={20} />
                <span>No cashiers</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;