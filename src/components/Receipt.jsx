import React from 'react';
import { format } from 'date-fns';
import './Receipt.css';

const Receipt = ({ order, restaurantName = "SHABAN RESTAURANT", copyType = "customer" }) => {
  const orderItems = typeof order.order_items === 'string' 
    ? JSON.parse(order.order_items)
    : order.order_items || [];

  // Generate barcode-like order number
  const generateBarcode = (orderNumber) => {
    const barcodeChars = orderNumber.split('').map(char => {
      if (char === '-') return '_';
      if (char === ' ') return '.';
      return char;
    }).join('');
    return `*${barcodeChars}*`;
  };

  // Calculate subtotal if not provided
  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₦${parseFloat(amount).toFixed(2)}`;
  };

  // Format item name to fit on receipt
  const formatItemName = (name) => {
    if (name.length > 20) {
      return name.substring(0, 18) + '..';
    }
    return name;
  };

  return (
    <div className={`receipt-container ${copyType}-copy`}>
      {/* Header for all copies */}
      <div className="receipt-header">
        <div className="restaurant-name">{restaurantName}</div>
        <div className="restaurant-address">Farawa Kwanar Yashi</div>
        <div className="restaurant-address">Kano, Nigeria</div>
        <div className="restaurant-address">Tel: 0803 XXX XXXX</div>
        <div className="receipt-separator">-----------------------------</div>
        <div className="receipt-title">SALES RECEIPT</div>
        <div className="receipt-separator">-----------------------------</div>
      </div>
      
      {/* Copy Type Indicator */}
      <div className="copy-indicator">
        {copyType === 'customer' ? 'CUSTOMER COPY' : 'SHABAN COPY'}
      </div>
      
      {/* Order Information */}
      <div className="receipt-info">
        <div className="info-row">
          <span className="info-label">RECEIPT #:</span>
          <span className="info-value">{order.order_number || 'N/A'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">DATE:</span>
          <span className="info-value">{format(new Date(order.created_at), 'dd/MM/yyyy')}</span>
        </div>
        <div className="info-row">
          <span className="info-label">TIME:</span>
          <span className="info-value">{format(new Date(order.created_at), 'HH:mm:ss')}</span>
        </div>
        <div className="info-row">
          <span className="info-label">CASHIER:</span>
          <span className="info-value">{(order.cashier_name || order.cashiers?.name || 'N/A').substring(0, 12)}</span>
        </div>
        {order.customer_name && (
          <div className="info-row">
            <span className="info-label">CUSTOMER:</span>
            <span className="info-value">{order.customer_name.substring(0, 15)}</span>
          </div>
        )}
        {order.table_number && (
          <div className="info-row">
            <span className="info-label">TABLE:</span>
            <span className="info-value">{order.table_number}</span>
          </div>
        )}
      </div>
      
      <div className="receipt-separator">=============================</div>
      
      {/* Order Items */}
      <div className="order-items">
        <div className="receipt-title">ITEMS</div>
        <div className="receipt-separator">-----------------------------</div>
        
        {orderItems.map((item, index) => (
          <div key={index} className="item-row">
            <span className="item-name" title={item.name}>
              {formatItemName(item.name)}
            </span>
            <span className="item-quantity">x{item.quantity}</span>
            <span className="item-price">{formatCurrency(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>
      
      <div className="receipt-separator">=============================</div>
      
      {/* Totals */}
      <div className="receipt-totals">
        <div className="total-row">
          <span className="total-label">SUBTOTAL:</span>
          <span>{formatCurrency(calculateSubtotal())}</span>
        </div>
        <div className="total-row">
          <span className="total-label">TOTAL:</span>
          <span className="total-amount">{formatCurrency(order.total_amount || calculateSubtotal())}</span>
        </div>
      </div>
      
      <div className="receipt-separator">=============================</div>
      
      {/* Payment Info */}
      <div className="payment-info">
        <div className="info-row">
          <span className="info-label">PAYMENT:</span>
          <span className="info-value">
            {order.payment_type?.toUpperCase() || 'CASH'}
            <span className={`payment-status ${order.payment_type || 'cash'}`}>
              {order.payment_type === 'cash' ? 'PAID' : 
               order.payment_type === 'transfer' ? 'TRANSFER' : 'POS'}
            </span>
          </span>
        </div>
      </div>
      
      {/* Barcode */}
      {order.order_number && (
        <div className="barcode-section">
          <div className="barcode">{generateBarcode(order.order_number)}</div>
          <div className="barcode-text">{order.order_number}</div>
        </div>
      )}
      
      <div className="receipt-separator">=============================</div>
      
      {/* Footer */}
      <div className="receipt-footer">
        <div className="thank-you">THANK YOU FOR YOUR PATRONAGE!</div>
        {copyType === 'customer' ? (
          <>
            <div className="footer-text">Please keep this receipt</div>
            <div className="footer-text">Goods sold are not returnable</div>
          </>
        ) : (
          <>
            <div className="footer-text">SHABAN COPY</div>
            <div className="footer-text">For restaurant records</div>
          </>
        )}
        <div className="footer-text">VAT Inclusive</div>
        <div className="time-stamp">
          Printed: {format(new Date(), 'dd/MM/yy HH:mm')}
        </div>
      </div>
      
      <div className="receipt-separator">=============================</div>
      <div className="copy-separator">
        {copyType === 'customer' ? '--- CUT HERE ---' : '--- END OF RECEIPT ---'}
      </div>
    </div>
  );
};

export default Receipt;