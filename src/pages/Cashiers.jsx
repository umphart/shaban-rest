import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiUserPlus } from 'react-icons/fi';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';
import './Cashiers.css';

const Cashiers = () => {
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCashier, setEditingCashier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'cash',
    is_active: true,
  });

  useEffect(() => {
    fetchCashiers();
  }, []);

  const fetchCashiers = async () => {
    try {
      const { data, error } = await supabase
        .from('cashiers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCashiers(data || []);
    } catch (error) {
      toast.error('Error loading cashiers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCashier) {
        const { error } = await supabase
          .from('cashiers')
          .update(formData)
          .eq('id', editingCashier.id);

        if (error) throw error;
        toast.success('Cashier updated successfully');
      } else {
        const { error } = await supabase
          .from('cashiers')
          .insert([formData]);

        if (error) throw error;
        toast.success('Cashier added successfully');
      }

      setShowModal(false);
      setEditingCashier(null);
      setFormData({ name: '', type: 'cash', is_active: true });
      fetchCashiers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this cashier?')) return;

    try {
      const { error } = await supabase
        .from('cashiers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Cashier deleted successfully');
      fetchCashiers();
    } catch (error) {
      toast.error('Error deleting cashier');
    }
  };

  const handleEdit = (cashier) => {
    setEditingCashier(cashier);
    setFormData({
      name: cashier.name,
      type: cashier.type,
      is_active: cashier.is_active,
    });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading cashiers...</p>
      </div>
    );
  }

  return (
    <div className="cashiers-container">
      <div className="cashiers-header">
        <h1 className="cashiers-title">Cashiers Management</h1>
        <button
          onClick={() => {
            setEditingCashier(null);
            setFormData({ name: '', type: 'cash', is_active: true });
            setShowModal(true);
          }}
          className="add-cashier-btn"
        >
          <FiUserPlus />
          Add Cashier
        </button>
      </div>

      {cashiers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <FiUserPlus size={32} />
          </div>
          <h3 className="empty-title">No Cashiers Found</h3>
          <p className="empty-description">
            Get started by adding your first cashier
          </p>
          <button
            onClick={() => {
              setEditingCashier(null);
              setFormData({ name: '', type: 'cash', is_active: true });
              setShowModal(true);
            }}
            className="add-cashier-btn"
          >
            <FiUserPlus />
            Add First Cashier
          </button>
        </div>
      ) : (
        <div className="cashiers-table-container">
          <table className="cashiers-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cashiers.map((cashier) => (
                <tr key={cashier.id}>
                  <td>
                    <div className="cashier-name">{cashier.name}</div>
                  </td>
                  <td>
                    <span className={`type-badge ${cashier.type === 'cash' ? 'cash' : 'transfer'}`}>
                      {cashier.type === 'cash' ? 'Cash Only' : 'Transfer/POS'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${cashier.is_active ? 'active' : 'inactive'}`}>
                      {cashier.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(cashier.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="actions-cell">
                      <button
                        onClick={() => handleEdit(cashier)}
                        className="action-btn edit-btn"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleDelete(cashier.id)}
                        className="action-btn delete-btn"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingCashier ? 'Edit Cashier' : 'Add New Cashier'}
              </h2>
            </div>
            
            <div className="modal-body">
              <form className="cashier-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Cashier Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="form-input"
                    placeholder="Enter cashier name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Cashier Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="form-select"
                  >
                    <option value="cash">Cash Only</option>
                    <option value="transfer_pos">Transfer/POS Only</option>
                  </select>
                </div>
                
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="checkbox-input"
                  />
                  <label htmlFor="is_active" className="checkbox-label">
                    Active Cashier
                  </label>
                </div>
                
                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingCashier(null);
                    }}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-btn"
                  >
                    {editingCashier ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cashiers;