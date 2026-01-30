import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlusCircle, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';
import './Foods.css';

const Foods = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
  });

  const categories = ['Main Dish', 'Appetizer', 'Dessert', 'Drink', 'Side Dish'];

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFoods(data || []);
    } catch (error) {
      toast.error('Error loading foods');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const foodData = {
        ...formData,
        price: parseFloat(formData.price),
        is_available: true // All foods are available by default
      };

      if (editingFood) {
        const { error } = await supabase
          .from('foods')
          .update(foodData)
          .eq('id', editingFood.id);

        if (error) throw error;
        toast.success('Food updated successfully');
      } else {
        const { error } = await supabase
          .from('foods')
          .insert([foodData]);

        if (error) throw error;
        toast.success('Food added successfully');
      }

      setShowModal(false);
      setEditingFood(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
      });
      fetchFoods();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this food?')) return;

    try {
      const { error } = await supabase
        .from('foods')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Food deleted successfully');
      fetchFoods();
    } catch (error) {
      toast.error('Error deleting food');
    }
  };

  const handleEdit = (food) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      description: food.description || '',
      price: food.price.toString(),
      category: food.category || '',
    });
    setShowModal(true);
  };

  const toggleAvailability = async (food) => {
    try {
      const { error } = await supabase
        .from('foods')
        .update({ is_available: !food.is_available })
        .eq('id', food.id);

      if (error) throw error;
      toast.success(`Food marked as ${!food.is_available ? 'available' : 'unavailable'}`);
      fetchFoods();
    } catch (error) {
      toast.error('Error updating food status');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading foods...</p>
      </div>
    );
  }

  return (
    <div className="foods-container">
      <div className="foods-header">
        <div>
          <h1 className="foods-title">Foods Management</h1>
          <p className="foods-subtitle">Manage your restaurant menu items</p>
        </div>
        <button
          onClick={() => {
            setEditingFood(null);
            setFormData({
              name: '',
              description: '',
              price: '',
              category: '',
            });
            setShowModal(true);
          }}
          className="add-food-btn"
        >
          <FiPlusCircle />
          Add Food
        </button>
      </div>

      <div className="foods-table-container">
        {foods.length === 0 ? (
          <div className="foods-empty">
            <div className="foods-empty-icon">
              <FiPlusCircle size={48} />
            </div>
            <h3 className="foods-empty-title">No Food Items</h3>
            <p className="foods-empty-description">
              Start by adding your first food item to the menu
            </p>
            <button
              onClick={() => {
                setEditingFood(null);
                setFormData({
                  name: '',
                  description: '',
                  price: '',
                  category: '',
                });
                setShowModal(true);
              }}
              className="add-food-btn"
            >
              <FiPlusCircle />
              Add First Food Item
            </button>
          </div>
        ) : (
          <table className="foods-table">
            <thead>
              <tr>
                <th>Food Name</th>
                <th>Description</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {foods.map((food) => (
                <tr key={food.id}>
                  <td>
                    <div className="food-cell">
                      <span className="food-name">{food.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="food-description-cell">
                      {food.description || 'No description'}
                    </div>
                  </td>
                  <td>
                    <span className={`food-category ${food.category ? '' : 'no-category'}`}>
                      {food.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td>
                    <span className="food-price">₦{parseFloat(food.price).toFixed(2)}</span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleAvailability(food)}
                      className={`status-btn ${food.is_available ? 'available' : 'unavailable'}`}
                    >
                      {food.is_available ? (
                        <>
                          <FiCheckCircle />
                          Available
                        </>
                      ) : (
                        <>
                          <FiXCircle />
                          Unavailable
                        </>
                      )}
                    </button>
                  </td>
                  <td>
                    <div className="food-actions">
                      <button
                        onClick={() => handleEdit(food)}
                        className="food-action-btn edit-btn"
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleDelete(food.id)}
                        className="food-action-btn delete-btn"
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
        )}
      </div>

      {/* Modal */}
{showModal && (
  <div className="modal-overlay">
    <div className="modal-container food-modal">
      <div className="modal-header">
        <h3 className="modal-title">
          {editingFood ? 'Edit Food' : 'Add Food'}
        </h3>
        <button
          onClick={() => {
            setShowModal(false);
            setEditingFood(null);
          }}
          className="modal-close"
        >
          &times;
        </button>
      </div>
      
      <div className="modal-body">
        <form className="food-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Food Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="form-input"
                placeholder="Enter food name"
                required
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Price (₦) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="form-input"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="form-select"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="form-textarea"
              rows="2"
              placeholder="Enter food description (optional)"
            />
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setEditingFood(null);
              }}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
            >
              {editingFood ? 'Update' : 'Add Food'}
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

export default Foods;