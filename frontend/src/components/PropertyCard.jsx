import React from 'react';

const PropertyCard = ({ property }) => {
  return (
    <div className="property-card">
      <div className="property-card-header">
        <h3>{property.address}</h3>
        <span className="property-type">{property.property_type}</span>
      </div>
      <div className="property-card-body">
        <p><strong>City:</strong> {property.city}</p>
        <p><strong>Price:</strong> ${property.price.toLocaleString()}</p>
        <p><strong>Bedrooms:</strong> {property.bedrooms}</p>
        <p><strong>Area:</strong> {property.area_sqft} sqft</p>
        <p><strong>Amenities:</strong> {property.amenities}</p>
      </div>
      <div className="property-card-footer">
        <p className="description">{property.description}</p>
      </div>
    </div>
  );
};

export default PropertyCard;