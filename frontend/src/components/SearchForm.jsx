import React, { useState } from 'react';

const SearchForm = ({ onSearchChange, currentParams }) => {
  const [form, setForm] = useState({
    lat_min: '',
    lon_min: '',
    lat_max: '',
    lon_max: '',
    min_price: '',
    max_price: '',
    property_type: '',
    keyword: ''
  });

  // Initialize form with currentParams on mount
  // Note: We're using empty strings for unset values in the form
  // We'll convert to null when submitting

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
                    key.includes('price') || key.includes('lat') || key.includes('lon') 
                      ? parseFloat(value) 
                      : value;
    });
    onSearchChange(params);
  };

  return (
    <div className="search-form">
      <h2>Search Properties</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Latitude Min:</label>
          <input
            type="number"
            step="any"
            name="lat_min"
            value={form.lat_min || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Longitude Min:</label>
          <input
            type="number"
            step="any"
            name="lon_min"
            value={form.lon_min || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Latitude Max:</label>
          <input
            type="number"
            step="any"
            name="lat_max"
            value={form.lat_max || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Longitude Max:</label>
          <input
            type="number"
            step="any"
            name="lon_max"
            value={form.lon_max || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Min Price ($):</label>
          <input
            type="number"
            step="0.01"
            name="min_price"
            value={form.min_price || ''}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Max Price ($):</label>
          <input
            type="number"
            step="0.01"
            name="max_price"
            value={form.max_price || ''}
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
          <label>Keyword:</label>
          <input
            type="text"
            name="keyword"
            value={form.keyword || ''}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="btn-primary">
          Search
        </button>
      </form>
    </div>
  );
};

export default SearchForm;