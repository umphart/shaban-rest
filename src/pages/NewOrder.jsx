import React, { useState, useEffect, useMemo } from 'react';
import { FiShoppingCart, FiTrash2, FiPrinter, FiSearch, FiPlus, FiMinus, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';
import Receipt from '../components/Receipt';
import './NewOrder.css';

const NewOrder = () => {
  const [foods, setFoods] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentType, setPaymentType] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const activeCashier = JSON.parse(localStorage.getItem('activeCashier'));

  useEffect(() => {
    if (!activeCashier) {
      toast.error('Please switch to cashier mode first');
      navigate('/dashboard');
      return;
    }

    // Set payment type based on cashier type
    setPaymentType(activeCashier.type === 'cash' ? 'cash' : 'transfer');
    
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .eq('is_available', true)
        .order('name');

      if (error) throw error;
      setFoods(data || []);
    } catch (error) {
      toast.error('Error loading foods');
    }
  };

  // Filter foods based on search
  const filteredFoods = useMemo(() => {
    if (!searchTerm) return foods;
    return foods.filter(food => 
      food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      food.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [foods, searchTerm]);

  const addToCart = (food) => {
    const existingItem = cart.find(item => item.id === food.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === food.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        ...food,
        quantity: 1
      }]);
    }
    
    toast.success(`${food.name} added`);
    setSearchTerm('');
    setShowDropdown(false);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
    toast.success('Item removed');
  };

  const updateQuantity = (id, quantity) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    
    setCart(cart.map(item =>
      item.id === id
        ? { ...item, quantity: quantity }
        : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      toast.error('Please add items to create order');
      return;
    }

    setLoading(true);

    try {
      const orderNumber = `ORD${Date.now().toString().slice(-6)}`;
      
      const orderData = {
        order_number: orderNumber,
        cashier_id: activeCashier.id,
        payment_type: paymentType,
        total_amount: calculateTotal(),
        customer_name: customerName || null,
        order_items: JSON.stringify(cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })))
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;

      const { data: fullOrder } = await supabase
        .from('orders')
        .select(`
          *,
          cashiers:cashier_id (name)
        `)
        .eq('id', data.id)
        .single();

      setCurrentOrder(fullOrder);
      setShowReceipt(true);
      toast.success('Order created!');
      
      // Reset form
      setCart([]);
      setCustomerName('');
      setSearchTerm('');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Error creating order');
    } finally {
      setLoading(false);
    }
  };

  const paymentOptions = useMemo(() => {
    if (activeCashier?.type === 'cash') {
      return [{ value: 'cash', label: 'Cash' }];
    } else {
      return [
        { value: 'transfer', label: 'Transfer' },
        { value: 'pos', label: 'POS' }
      ];
    }
  }, [activeCashier]);

  if (!activeCashier) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading order system...</p>
      </div>
    );
  }

  return (
    <div className="new-order-container">
      {/* Header removed to save space */}
      
      <div className="order-layout">
        {/* Left Column - Food Selection */}
        <div className="foods-section">
          <h2 className="section-title">Select Food Items</h2>
          
          <div className="food-search-container">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search foods..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setShowDropdown(false);
                  }}
                  className="clear-search-btn"
                >
                  <FiX />
                </button>
              )}
            </div>
            
            {/* Dropdown Results */}
            {showDropdown && filteredFoods.length > 0 && (
              <div className="foods-dropdown">
                {filteredFoods.slice(0, 8).map((food) => (
                  <div 
                    key={food.id} 
                    className="dropdown-item"
                    onClick={() => addToCart(food)}
                  >
                    <div className="dropdown-item-info">
                      <span className="dropdown-item-name">{food.name}</span>
                      <span className="dropdown-item-price">₦{parseFloat(food.price).toFixed(2)}</span>
                    </div>
                    {food.category && (
                      <span className="dropdown-item-category">{food.category}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {showDropdown && searchTerm && filteredFoods.length === 0 && (
              <div className="no-results-dropdown">
                No foods found
              </div>
            )}
          </div>

          {/* Recently Added Foods (Quick Add) */}
          {foods.length > 0 && (
            <div className="quick-add-section">
              <h3 className="quick-add-title">Quick Add</h3>
              <div className="quick-add-grid">
                {foods.slice(0, 6).map((food) => {
                  const cartItem = cart.find(item => item.id === food.id);
                  return (
                    <button
                      key={food.id}
                      className={`quick-add-btn ${cartItem ? 'added' : ''}`}
                      onClick={() => addToCart(food)}
                    >
                      <span className="quick-add-name">{food.name}</span>
                      <span className="quick-add-price">₦{parseFloat(food.price).toFixed(2)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Order Summary */}
        <div className="order-summary">
          <div className="summary-header">
            <h2 className="section-title">Order</h2>
            <div className="cashier-info">
              <span className="cashier-name">{activeCashier.name}</span>
              <span className="cashier-type">
                {activeCashier.type === 'cash' ? 'Cash' : 'Transfer/POS'}
              </span>
            </div>
          </div>

          {/* Cart Items */}
          <div className="cart-section">
            <div className="cart-header">
              <span className="cart-title">Items ({cart.length})</span>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="clear-cart-btn"
                >
                  <FiTrash2 />
                  Clear
                </button>
              )}
            </div>
            
            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <FiShoppingCart className="cart-empty-icon" />
                  <p>No items added yet</p>
                  <p className="cart-empty-hint">Search and select items to add</p>
                </div>
              ) : (
                <div className="cart-items-list">
                  {cart.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-info">
                        <h4 className="cart-item-name">{item.name}</h4>
                        <div className="cart-item-details">
                          <span className="cart-item-quantity">Qty: {item.quantity}</span>
                          <span className="cart-item-price">
                            ₦{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="cart-item-controls">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="quantity-btn minus"
                        >
                          <FiMinus />
                        </button>
                        <span className="quantity-value">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="quantity-btn plus"
                        >
                          <FiPlus />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="total-section">
            <div className="total-row">
              <span className="total-label">Total</span>
              <span className="total-value">₦{calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Order Form */}
          <form className="order-form" onSubmit={handleSubmit}>
            <div className="form-input-group">
              <label className="input-label">Customer Name (Optional)</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="form-input"
                placeholder="Enter customer name"
              />
            </div>
            
            <div className="form-input-group">
              <label className="input-label">Payment Method</label>
              <div className="payment-options-row">
                {paymentOptions.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className={`payment-option-btn ${paymentType === option.value ? 'selected' : ''}`}
                    onClick={() => setPaymentType(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              type="submit"
              disabled={cart.length === 0 || loading}
              className={`submit-order-btn ${cart.length === 0 ? 'disabled' : ''}`}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Processing...
                </>
              ) : (
                'Create Order'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && currentOrder && (
        <div className="modal-overlay">
          <div className="modal-container receipt-modal">
            <div className="modal-header">
              <h2 className="modal-title">Order Receipt</h2>
              <button
                onClick={() => setShowReceipt(false)}
                className="modal-close"
              >
                <FiX />
              </button>
            </div>
            
            <div id="printable-receipt" className="receipt-content">
              <Receipt order={currentOrder} />
            </div>
            
            <div className="modal-footer">
              <button
                onClick={() => setShowReceipt(false)}
                className="close-btn"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const printContent = document.getElementById('printable-receipt');
                  const originalContent = document.body.innerHTML;
                  
                  document.body.innerHTML = printContent.innerHTML;
                  window.print();
                  document.body.innerHTML = originalContent;
                  window.location.reload();
                }}
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

export default NewOrder;