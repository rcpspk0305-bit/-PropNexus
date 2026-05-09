import React from 'react';
import PropertyCard from './PropertyCard';

const PropertyList = ({ properties, loading }) => {
  if (loading) {
    return <div className="loading">Loading properties...</div>;
  }

  if (!properties || properties.length === 0) {
    return <div className="empty">No properties found.</div>;
  }

  return (
    <div className="property-list">
      <h2>Properties ({properties.length})</h2>
      <div className="properties-grid">
        {properties.map(property => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
};

export default PropertyList;