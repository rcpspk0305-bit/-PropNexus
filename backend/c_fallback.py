import math

class PropertyFallback:
    def __init__(self, data):
        self.properties = data
        self.id_map = {p['property_id']: p for p in data}
        
    def search_advanced(self, min_p, max_p, min_area, beds, baths, sort_price):
        results = []
        for p in self.properties:
            if (min_p <= p['price'] <= max_p and 
                p['area'] >= min_area and 
                (beds == -1 or p['bedrooms'] == beds) and 
                (baths == -1 or p['bathrooms'] == baths)):
                results.append(p)
        
        if sort_price:
            results.sort(key=lambda x: x['price'])
        else:
            results.sort(key=lambda x: x['area'], reverse=True)
        return results

    def get_top_k(self, lat, lon, k):
        def dist(p):
            return math.sqrt((p['latitude'] - lat)**2 + (p['longitude'] - lon)**2)
        
        sorted_props = sorted(self.properties, key=dist)
        return sorted_props[:k]

    def get_by_id(self, prop_id):
        return self.id_map.get(prop_id)
