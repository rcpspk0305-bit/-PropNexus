import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const App = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    min_price: 0,
    max_price: 2000000,
    bedrooms: -1,
    bathrooms: -1,
    min_area: 0,
    sort_by_price: true
  });

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/search`, filters);
      setProperties(res.data.properties);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">P</div>
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              PropertyScan Pro
            </h1>
          </div>
          <div className="flex gap-4">
            <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
              Post Property
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
        {/* Filters Sidebar */}
        <aside className="w-80 flex-shrink-0">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-28">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
              Search Filters
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider block mb-3">Price Range</label>
                <div className="flex gap-3">
                  <input 
                    type="number" 
                    placeholder="Min"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={filters.min_price}
                    onChange={(e) => setFilters({...filters, min_price: parseInt(e.target.value) || 0})}
                  />
                  <input 
                    type="number" 
                    placeholder="Max"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={filters.max_price}
                    onChange={(e) => setFilters({...filters, max_price: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider block mb-3">Bedrooms</label>
                <div className="flex flex-wrap gap-2">
                  {[-1, 1, 2, 3, 4, 5].map(val => (
                    <button 
                      key={val}
                      onClick={() => setFilters({...filters, bedrooms: val})}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filters.bedrooms === val ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                    >
                      {val === -1 ? 'Any' : val === 5 ? '5+' : val}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={fetchProperties}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </aside>

        {/* Results Grid */}
        <section className="flex-1">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-gray-800">
              {loading ? 'Searching...' : `${properties.length} Properties Found`}
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-2xl"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {properties.map(p => (
                <div key={p.property_id} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
                  <div className="h-48 bg-gray-200 relative overflow-hidden">
                    <img 
                      src={`https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={p.title}
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                      {p.property_type}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg leading-tight group-hover:text-indigo-600 transition-colors">{p.title}</h3>
                      <span className="text-xl font-black text-indigo-600">${p.price.toLocaleString()}</span>
                    </div>
                    <p className="text-gray-500 text-sm mb-4 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      {p.location_name}
                    </p>
                    <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="font-bold text-gray-900">{p.bedrooms}</span>
                        <span className="text-xs text-gray-400 font-medium uppercase">Beds</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="font-bold text-gray-900">{p.bathrooms}</span>
                        <span className="text-xs text-gray-400 font-medium uppercase">Baths</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="font-bold text-gray-900">{p.area}</span>
                        <span className="text-xs text-gray-400 font-medium uppercase">Sqft</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;