import React from 'react';

const PropertyStats = ({ stats }) => {
  if (!stats) {
    return <div className="stats">Loading statistics...</div>;
  }

  if (stats.message) {
    return <div className="stats">{stats.message}</div>;
  }

  return (
    <div className="stats-card">
      <h2>Property Statistics</h2>
      <div className="stats-grid">
        <div className="stat-item">
          <h3>Total Properties</h3>
          <p>{stats.total_properties}</p>
        </div>
        <div className="stat-item">
          <h3>Price Range</h3>
          <p>${stats.price_stats.min.toLocaleString()} - ${stats.price_stats.max.toLocaleString()}</p>
          <p>Average: ${stats.price_stats.avg.toLocaleString()}</p>
        </div>
        <div className="stat-item">
          <h3>Area Range</h3>
          <p>{stats.area_stats.min} - {stats.area_stats.max} sqft</p>
          <p>Average: {stats.area_stats.avg.toFixed(0)} sqft</p>
        </div>
        <div className="stat-item">
          <h3>Property Types</h3>
          <p>{stats.property_types.join(', ')}</p>
        </div>
        <div className="stat-item">
          <h3>Cities</h3>
          <p>{stats.cities.join(', ')}</p>
        </div>
      </div>
    </div>
  );
};

export default PropertyStats;