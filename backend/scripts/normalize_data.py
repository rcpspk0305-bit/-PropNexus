import csv
import os
import random

def normalize():
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(backend_dir, "data")
    
    prop_path = os.path.join(data_dir, "properties.csv")
    tel_path = os.path.join(data_dir, "telangana_property_rates_100_rows.csv")
    merged_path = os.path.join(data_dir, "merged_properties.csv")
    
    standard_headers = ["id", "address", "city", "property_type", "latitude", "longitude", "price", "bedrooms", "area_sqft", "amenities", "description"]
    
    merged_data = []
    current_id = 1
    
    # Load original properties
    if os.path.exists(prop_path):
        with open(prop_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Standardize keys if needed (properties.csv already has them)
                merged_data.append({
                    "id": current_id,
                    "address": row.get('address', 'Unknown'),
                    "city": row.get('city', 'Unknown'),
                    "property_type": row.get('property_type', 'Apartment'),
                    "latitude": row.get('latitude', 0.0),
                    "longitude": row.get('longitude', 0.0),
                    "price": row.get('price', 0.0),
                    "bedrooms": row.get('bedrooms', 0),
                    "area_sqft": row.get('area_sqft', 0),
                    "amenities": row.get('amenities', 'N/A'),
                    "description": row.get('description', 'N/A')
                })
                current_id += 1

    # Load Telangana rates
    if os.path.exists(tel_path):
        # Hyderabad center
        base_lat, base_lon = 17.3850, 78.4867
        
        with open(tel_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Map Telangana fields
                # avg_rate_rs_per_sq_m is a good price indicator
                raw_price = row.get('avg_rate_rs_per_sq_m', '0')
                if not raw_price or raw_price.strip() == '':
                    price = 0.0
                else:
                    try:
                        price = float(raw_price) * 100 # Multiply to make it a "property price"
                    except ValueError:
                        price = 0.0
                
                merged_data.append({
                    "id": current_id,
                    "address": row.get('locality', 'Unknown'),
                    "city": "Hyderabad",
                    "property_type": row.get('data_segment', 'Plot/Land').replace('_', ' ').title(),
                    "latitude": base_lat + random.uniform(-0.1, 0.1),
                    "longitude": base_lon + random.uniform(-0.1, 0.1),
                    "price": price,
                    "bedrooms": random.randint(1, 5) if "plot" not in row.get('data_segment', '').lower() else 0,
                    "area_sqft": random.randint(500, 5000),
                    "amenities": "Near " + row.get('source_name', 'Local Area'),
                    "description": row.get('growth_note', 'No growth data')
                })
                current_id += 1
                
    # Write merged file
    with open(merged_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=standard_headers)
        writer.writeheader()
        writer.writerows(merged_data)
        
    print(f"Successfully merged data into {merged_path}")

if __name__ == "__main__":
    normalize()
