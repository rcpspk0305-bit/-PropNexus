import os
import sys
import time

# Add backend directory to path
sys.path.append(os.path.dirname(__file__))

from bridge import EngineBridge

def run_tests():
    data_path = os.path.join(os.path.dirname(__file__), "synthetic_properties.csv")
    print(f"[{time.strftime('%H:%M:%S')}] Loading engine with {data_path}...")
    
    # 1. Instantiate Engine
    start_time = time.perf_counter()
    engine = EngineBridge(data_path)
    load_time = time.perf_counter() - start_time
    print(f"[{time.strftime('%H:%M:%S')}] Engine loaded successfully in {load_time:.6f} seconds!")
    print(f"Fallback active: {engine.fallback is not None}")
    
    if engine.fallback:
        print("ERROR: Engine loaded in fallback compatibility mode! DLL was not loaded.")
        return

    # 2. Test get_by_id
    print("\n--- Testing O(1) ID Lookup ---")
    p = engine.get_by_id(1)
    if p:
        print(f"Found Property ID 1: {p['title']} in {p['location_name']}")
    else:
        print("ERROR: Property ID 1 not found!")

    # 3. Test search_advanced (Price/BHK/Baths filters & sorting)
    print("\n--- Testing Advanced Filtering & Sorting ---")
    start_time = time.perf_counter()
    results = engine.search_advanced(
        min_p=0, max_p=1000000000, min_area=0, beds=-1, baths=-1, sort_mode=0
    )
    search_time = time.perf_counter() - start_time
    print(f"Search completed in {search_time:.6f} seconds. Found {len(results)} properties.")
    
    if len(results) > 1:
        print("Verifying price sorting order (Ascending):")
        sorted_correctly = True
        for i in range(len(results) - 1):
            if results[i]['price'] > results[i+1]['price']:
                sorted_correctly = False
                print(f"  Sorting Error at index {i}: {results[i]['price']} > {results[i+1]['price']}")
                break
        if sorted_correctly:
            print(f"  SUCCESS: All {len(results)} properties are perfectly sorted by price!")

    # 4. Test spatial get_top_k nearest neighbors
    print("\n--- Testing Top-K Nearest (Spatial Max-Heap) ---")
    lat, lon = 17.4483, 78.3741 # Madhapur coordinates
    k = 5
    start_time = time.perf_counter()
    nearby = engine.get_top_k(lat, lon, k)
    spatial_time = time.perf_counter() - start_time
    print(f"Top-{k} spatial search completed in {spatial_time:.6f} seconds. Found {len(nearby)} properties.")
    
    for idx, p in enumerate(nearby):
        d_sq = (p['latitude'] - lat)**2 + (p['longitude'] - lon)**2
        print(f"  {idx+1}. ID: {p['property_id']} | Dist_Sq: {d_sq:.8f} | Title: {p['title']} in {p['location_name']}")

    print("\n--- Verification Complete! ---")

if __name__ == "__main__":
    run_tests()
