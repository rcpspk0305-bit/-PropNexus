import sys
import os
import ctypes

# Add api to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'api'))

from bridge import EngineBridge

def test_engine():
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'properties.csv')
    print(f"Loading engine with {data_path}...")
    try:
        engine = EngineBridge(data_path)
        print("Engine loaded successfully!")
        
        # Test search
        results = engine.search_advanced(0, 10000000, 0, -1, -1, True)
        print(f"Search found {len(results)} properties.")
        if len(results) > 0:
            print(f"First property: {results[0]['title']} in {results[0]['location_name']}")
            print(f"Beds: {results[0]['bedrooms']}, Baths: {results[0]['bathrooms']}")
            
        # Test nearest
        lat, lon = results[0]['latitude'], results[0]['longitude']
        nearby = engine.get_top_k(lat, lon, 3)
        print(f"Found {len(nearby)} nearby properties.")
        
    except Exception as e:
        print(f"Test Failed: {e}")

if __name__ == "__main__":
    test_engine()
