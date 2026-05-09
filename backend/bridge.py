import ctypes
import os
from typing import List, Dict, Any, Optional

# Constants matching ds_core.h for fixed-length string mapping
MAX_TITLE_LEN = 128
MAX_LOCATION_LEN = 128
MAX_TYPE_LEN = 32
MAX_AMENITIES_LEN = 512
MAX_DESCRIPTION_LEN = 1024

class Property(ctypes.Structure):
    _pack_ = 1
    _fields_ = [
        ("property_id", ctypes.c_int32),
        ("title", ctypes.c_char * MAX_TITLE_LEN),
        ("location_name", ctypes.c_char * MAX_LOCATION_LEN),
        ("property_type", ctypes.c_char * MAX_TYPE_LEN),
        ("latitude", ctypes.c_double),
        ("longitude", ctypes.c_double),
        ("price", ctypes.c_double),
        ("area", ctypes.c_int32),
        ("bedrooms", ctypes.c_int32),
        ("bathrooms", ctypes.c_int32),
        ("amenities", ctypes.c_char * MAX_AMENITIES_LEN),
        ("description", ctypes.c_char * MAX_DESCRIPTION_LEN),
    ]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "property_id": self.property_id,
            "title": self.title.decode('utf-8', errors='ignore').strip(),
            "location_name": self.location_name.decode('utf-8', errors='ignore').strip(),
            "property_type": self.property_type.decode('utf-8', errors='ignore').strip(),
            "latitude": self.latitude,
            "longitude": self.longitude,
            "price": self.price,
            "area": self.area,
            "bedrooms": self.bedrooms,
            "bathrooms": self.bathrooms,
            "amenities": self.amenities.decode('utf-8', errors='ignore').strip(),
            "description": self.description.decode('utf-8', errors='ignore').strip(),
        }

class PropertyEngine(ctypes.Structure):
    pass

class EngineBridge:
    _instance = None
    def __new__(cls, *args, **kwargs):
        if not cls._instance: cls._instance = super(EngineBridge, cls).__new__(cls)
        return cls._instance

    def __init__(self, csv_path: str):
        if hasattr(self, 'initialized'): return
        ext = '.dll' if os.name == 'nt' else '.so'
        lib_name = f"libds_engine{ext}"
        self.lib_path = os.path.join(os.path.dirname(__file__), 'core', lib_name)
        try:
            self.lib = ctypes.CDLL(self.lib_path)
            self._setup_signatures()
            self.engine_ptr = self.lib.ds_create_engine(csv_path.encode('utf-8'))
            self.fallback = None
            print("SUCCESS: C-Engine loaded successfully (High Performance Mode)")
        except Exception as e:
            print(f"WARNING: C-Engine load failed: {e}")
            print("INFO: Switching to Python Fallback Engine (Compatibility Mode)")
            from c_fallback import PropertyFallback
            import csv
            data = []
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    data.append({
                        "property_id": int(row['property_id']),
                        "title": row['title'],
                        "location_name": row['location_name'],
                        "property_type": row['property_type'],
                        "latitude": float(row['latitude']),
                        "longitude": float(row['longitude']),
                        "price": float(row['price_inr']),
                        "area": int(row['area_sqft']),
                        "bedrooms": int(row['bedrooms']),
                        "bathrooms": int(row['bathrooms']),
                    })
            self.fallback = PropertyFallback(data)
            self.lib = None
        self.initialized = True

    def _setup_signatures(self):
        if not self.lib: return
        self.lib.ds_create_engine.argtypes = [ctypes.c_char_p]
        self.lib.ds_create_engine.restype = ctypes.POINTER(PropertyEngine)
        self.lib.ds_get_by_id.argtypes = [ctypes.POINTER(PropertyEngine), ctypes.c_int32]
        self.lib.ds_get_by_id.restype = ctypes.POINTER(Property)
        self.lib.ds_filter_and_sort.argtypes = [
            ctypes.POINTER(PropertyEngine), ctypes.c_double, ctypes.c_double, 
            ctypes.c_int32, ctypes.c_int32, ctypes.c_int32, ctypes.c_bool,
            ctypes.POINTER(ctypes.POINTER(ctypes.POINTER(Property))), ctypes.POINTER(ctypes.c_int32)
        ]
        self.lib.ds_get_top_k_nearby.argtypes = [
            ctypes.POINTER(PropertyEngine), ctypes.c_double, ctypes.c_double, ctypes.c_int32,
            ctypes.POINTER(ctypes.POINTER(ctypes.POINTER(Property))), ctypes.POINTER(ctypes.c_int32)
        ]
        self.lib.ds_free_results.argtypes = [ctypes.POINTER(ctypes.POINTER(Property))]
        self.lib.ds_destroy_engine.argtypes = [ctypes.POINTER(PropertyEngine)]

    def search_advanced(self, min_p, max_p, min_area, beds, baths, sort_price) -> List[Dict]:
        if self.fallback:
            return self.fallback.search_advanced(min_p, max_p, min_area, beds, baths, sort_price)
        results_ptr = ctypes.POINTER(ctypes.POINTER(Property))()
        count = ctypes.c_int32(0)
        self.lib.ds_filter_and_sort(self.engine_ptr, min_p, max_p, min_area, beds, baths, sort_price, ctypes.byref(results_ptr), ctypes.byref(count))
        output = [results_ptr[i].contents.to_dict() for i in range(count.value)]
        self.lib.ds_free_results(results_ptr)
        return output

    def get_top_k(self, lat, lon, k) -> List[Dict]:
        if self.fallback:
            return self.fallback.get_top_k(lat, lon, k)
        results_ptr = ctypes.POINTER(ctypes.POINTER(Property))()
        count = ctypes.c_int32(0)
        self.lib.ds_get_top_k_nearby(self.engine_ptr, lat, lon, k, ctypes.byref(results_ptr), ctypes.byref(count))
        output = [results_ptr[i].contents.to_dict() for i in range(count.value)]
        self.lib.ds_free_results(results_ptr)
        return output

    def get_by_id(self, prop_id: int) -> Optional[Dict]:
        if self.fallback:
            return self.fallback.get_by_id(prop_id)
        p_ptr = self.lib.ds_get_by_id(self.engine_ptr, prop_id)
        return p_ptr.contents.to_dict() if p_ptr else None
