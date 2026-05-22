import csv
import random

# Configuration
NUM_ROWS = 300
OUTPUT_FILE = 'synthetic_properties.csv'

# Locality data with coordinates (approximate centers)
LOCALITIES = {
    'Tier 1': {
        'Jubilee Hills': (17.4326, 78.4071),
        'Banjara Hills': (17.4156, 78.4347),
        'Kokapet': (17.3941, 78.3340),
        'HITEC City': (17.4435, 78.3772),
        'Gachibowli': (17.4401, 78.3489),
        'Financial District': (17.4140, 78.3456),
        'Madhapur': (17.4483, 78.3915)
    },
    'Tier 2': {
        'Kondapur': (17.4614, 78.3587),
        'Manikonda': (17.3995, 78.3857),
        'Nallagandla': (17.4704, 78.3183),
        'Tellapur': (17.4566, 78.2917),
        'Kukatpally': (17.4849, 78.4069),
        'Miyapur': (17.4933, 78.3601),
        'Narsingi': (17.3820, 78.3508)
    },
    'Tier 3': {
        'Adibatla': (17.2285, 78.5367),
        'Maheshwaram': (17.1352, 78.4350),
        'Tukkuguda': (17.2023, 78.4844),
        'Shamshabad': (17.2543, 78.4323),
        'Medchal': (17.6294, 78.4816),
        'Patancheru': (17.5287, 78.2667),
        'Shamirpet': (17.6044, 78.5670),
        'Shadnagar': (17.0683, 78.2081)
    }
}

PRICE_RANGES = {
    'Tier 1': (10000, 18000),
    'Tier 2': (6000, 10000),
    'Tier 3': (3000, 6500)
}

AREA_RULES = {
    '1': (500, 900),
    '2': (900, 1400),
    '3': (1400, 2200),
    '4': (2200, 4200),
    'Plot': (1200, 5000)
}

PROP_MULTIPLIERS = {
    'Apartment': 1.00,
    'House': 1.15,
    'Villa': 1.35,
    'Plot': 1.00  # Handled separately
}

FURNISHING_MULTIPLIERS = {
    'Furnished': 1.10,
    'Semi-Furnished': 1.05,
    'Unfurnished': 1.00,
    'NA': 1.00
}

data = []
for i in range(1, NUM_ROWS + 1):
    # Select Tier and Locality
    tier = random.choices(['Tier 1', 'Tier 2', 'Tier 3'], weights=[0.3, 0.4, 0.3])[0]
    loc_name = random.choice(list(LOCALITIES[tier].keys()))
    base_lat, base_lon = LOCALITIES[tier][loc_name]
    
    # Coordinates with small variation (~1-2km)
    lat = base_lat + random.uniform(-0.015, 0.015)
    lon = base_lon + random.uniform(-0.015, 0.015)
    
    # Property Type
    prop_type = random.choices(['Apartment', 'House', 'Villa', 'Plot'], weights=[0.6, 0.15, 0.1, 0.15])[0]
    
    # Beds, Baths, Area
    if prop_type == 'Plot':
        beds = 0
        baths = 0
        furnishing = 'NA'
        area = random.randint(*AREA_RULES['Plot'])
        title = f"Plot in {loc_name}"
    else:
        beds = int(random.choices(['1', '2', '3', '4'], weights=[0.1, 0.4, 0.4, 0.1])[0])
        if beds == 1:
            baths = 1
        elif beds == 2:
            baths = random.randint(1, 2)
        elif beds == 3:
            baths = random.randint(2, 3)
        else:
            baths = random.randint(3, 5)
        
        area = random.randint(*AREA_RULES[str(beds)])
        furnishing = random.choice(['Furnished', 'Semi-Furnished', 'Unfurnished'])
        title = f"{beds} BHK {prop_type} in {loc_name}"
        
    # Pricing
    base_psf = random.randint(*PRICE_RANGES[tier])
    psf = base_psf * PROP_MULTIPLIERS[prop_type] * FURNISHING_MULTIPLIERS[furnishing]
    price = int(area * psf)
    
    # Format to nearest thousand
    price = round(price, -3)
    
    listing_type = random.choice(['Sale', 'New Launch', 'Resale'])
    
    data.append([
        i, title, prop_type, loc_name, "Hyderabad", "Telangana", 
        price, area, beds, baths, furnishing, round(lat, 6), round(lon, 6), listing_type
    ])

with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow([
        "property_id", "title", "property_type", "location_name", "city", 
        "state", "price_inr", "area_sqft", "bedrooms", "bathrooms", 
        "furnishing_status", "latitude", "longitude", "listing_type"
    ])
    writer.writerows(data)

print(f"Generated {NUM_ROWS} rows to {OUTPUT_FILE}")
