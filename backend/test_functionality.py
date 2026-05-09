import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'c_core'))
from c_wrapper import PropertyDS

try:
    ds = PropertyDS("../sample_data/properties.csv")
    print(f"Loaded {ds.count.value} properties")
    
    # Test all properties
    all_props = ds.get_all_properties()
    print(f"First property: {all_props[0]['address']} in {all_props[0]['city']}")
    
    # Test range search (NYC area)
    results = ds.range_search(40.0, -75.0, 41.0, -73.0)
    print(f"Found {len(results)} properties in NYC range")
    for r in results:
        print(f" - {r['address']}, {r['city']} (${r['price']})")
        
    # Test price filter
    price_results = ds.filter_by_price(400000, 500000)
    print(f"Found {len(price_results)} properties between $400k and $500k")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
