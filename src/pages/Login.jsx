import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';
import { FiLock, FiUser, FiLogIn, FiShield, FiCreditCard } from 'react-icons/fi';
import './Login.css';

const Login = () => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(false);
    setIsLoading(true);

    try {
      // Simple admin login with default password
      if (password === 'admin123') {
        localStorage.setItem('isAdmin', 'true');
        localStorage.removeItem('activeCashier');
        setSuccess(true);
        toast.success('Admin login successful!');
        
        // Small delay for animation
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
        return;
      }

      // Try to find cashier by name or ID
      const { data: cashiers } = await supabase
        .from('cashiers')
        .select('*')
        .eq('is_active', true);

      const cashier = cashiers?.find(c => 
        c.name.toLowerCase() === password.toLowerCase() || 
        c.id === password
      );

      if (cashier) {
        localStorage.setItem('activeCashier', JSON.stringify(cashier));
        localStorage.removeItem('isAdmin');
        setSuccess(true);
        toast.success(`Welcome ${cashier.name}!`);
        
        setTimeout(() => {
          navigate('/cashier-orders');
        }, 500);
      } else {
        setError(true);
        toast.error('Invalid password or cashier not found');
        
        // Remove error state after animation
        setTimeout(() => {
          setError(false);
        }, 500);
      }
    } catch (error) {
      setError(true);
      toast.error('Login failed. Please try again.');
      
      setTimeout(() => {
        setError(false);
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className={`login-card ${success ? 'success-pulse' : ''}`}>
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon">
              <FiUser size={24} />
            </div>
            <h1 className="restaurant-name">Shab'an Restaurant</h1>
          </div>
          <p className="login-subtitle">Farawa Kwanar Yashi Branch</p>
        </div>
        
        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Enter Password</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className={`password-input ${error ? 'error-shake' : ''}`}
                placeholder="Enter admin or cashier password"
                required
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div className="password-hint">
              <p><strong>Admin password:</strong> admin123</p>
              <p><strong>Cashier password:</strong> cashier name</p>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !password}
            className="login-button"
          >
            {isLoading ? (
              <>
                <div className="button-spinner"></div>
                Logging in...
              </>
            ) : (
              <>
                <FiLogIn size={20} />
                Login to Dashboard
              </>
            )}
          </button>
        </form>
        
        <div className="login-footer">
          <p className="help-text">Select your role to login:</p>
          <div className="role-badges">
            <div className="role-badge admin">
              <FiShield size={14} />
              <span>Administrator</span>
            </div>
            <div className="role-badge cashier">
              <FiCreditCard size={14} />
              <span>Cashier</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;