import React, { useState } from 'react';

const RecommendationSection = ({ onRecommendationChange, currentParams }) => {
  const [form, setForm] = useState({
    budget: '',
    city: '',
    property_type: '',
    bedrooms: '',
    latitude: '',
    longitude: ''
  });

  // Initialize form with currentParams (convert null to empty string for display)
  // We'll do this in a useEffect, but for simplicity we'll just set initial state from props
  // Note: This component doesn't fetch data itself; it just passes params to parent.
  // The parent could then fetch recommendations, but for now we'll just update the state.

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert empty strings to null for the API
    const params = {};
    Object.keys(form).forEach(key => {
      const value = form[key];
      params[key] = value === '' ? null : 
                    key === 'budget' || key === 'latitude' || key === 'longitude' 
                      ? parseFloat(value) 
                    : key === 'bedrooms'
                      ? parseInt(value, 10)
                      : value;
    });
    onRecommendationChange(params);
  };

  return (
    <div className="recommendation-section">
      <h2>Get Recommendations</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Budget ($):</label>
          <input
            type="number"
            step="0.01"
            name="budget"
            value={form.budget || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>City:</label>
          <input
            type="text"
            name="city"
            value={form.city || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Property Type:</label>
          <input
            type="text"
            name="property_type"
            value={form.property_type || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Bedrooms:</label>
          <input
            type="number"
            name="bedrooms"
            value={form.bedrooms || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Preferred Latitude:</label>
          <input
            type="number"
            step="any"
            name="latitude"
            value={form.latitude || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Preferred Longitude:</label>
          <input
            type="number"
            step="any"
            name="longitude"
            value={form.longitude || ''}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="btn-primary">
          Get Recommendations
        </button>
      </form>
      <p className="hint">
        Leave fields blank to ignore that preference. The system will score properties
        based on how well they match your criteria.
      </p>
    </div>
  );
};

export default RecommendationSection;