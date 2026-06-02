import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import AISearchBar from "./components/AISearchBar";
import Chatbot from "./components/Chatbot";
import { useCountUp } from "./hooks/useCountUp";

const API_BASE = 'http://localhost:8000/api';
const EASE = [0.16, 1, 0.3, 1];

const App = () => {
  const [allProperties, setAllProperties] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    min_price: 0,
    max_price: 100000000,
    bedrooms: -1,
    bathrooms: -1,
    min_area: 0,
    sort_mode: 0,
    limit: 1000,
    location: '',
    property_type: ''
  });

  // Scroll state
  const { scrollY } = useScroll();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setShowScrollTop(latest > 300);
  });

  // Count-up
  const animatedCount = useCountUp(properties.length, 1000);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const cleanFilters = {
        ...filters,
        min_price: Number(filters.min_price) || 0,
        max_price: Number(filters.max_price) || 1000000000,
        bedrooms: Number(filters.bedrooms),
        bathrooms: Number(filters.bathrooms),
        min_area: Number(filters.min_area) || 0,
        sort_mode: Number(filters.sort_mode),
        limit: Number(filters.limit)
      };
      const res = await axios.post(`${API_BASE}/search`, cleanFilters);
      let fetchedProps = Array.isArray(res.data) ? res.data : (res.data.properties || []);

      if (filters.location) {
        const loc = filters.location.toLowerCase();
        fetchedProps = fetchedProps.filter(p => p.location_name.toLowerCase().includes(loc));
      }
      if (filters.property_type) {
        const type = filters.property_type.toLowerCase();
        fetchedProps = fetchedProps.filter(p => p.property_type.toLowerCase().includes(type));
      }

      setProperties(fetchedProps);
      if (allProperties.length === 0) setAllProperties(fetchedProps);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAISearch = (parsedFilters) => {
    setFilters(prev => ({
      ...prev,
      bedrooms: parsedFilters.bedrooms !== undefined ? parsedFilters.bedrooms : prev.bedrooms,
      bathrooms: parsedFilters.bathrooms !== undefined ? parsedFilters.bathrooms : prev.bathrooms,
      max_price: parsedFilters.maxPrice !== undefined ? parsedFilters.maxPrice : prev.max_price,
      location: parsedFilters.city !== undefined ? parsedFilters.city : prev.location,
      property_type: parsedFilters.type !== undefined ? parsedFilters.type : prev.property_type,
    }));
  };

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters = filters.bedrooms !== -1 || filters.bathrooms !== -1 || filters.max_price !== 100000000 || filters.location || filters.property_type;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>

      {/* ═══ HEADER ═══ */}
      <header style={{
        background: 'rgba(12,12,11,0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.div
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--gold)', color: 'var(--text-inverse)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.1rem',
              }}
              animate={{ y: [-2, 2] }}
              transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
            >
              P
            </motion.div>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: '1.3rem',
              fontWeight: 500, letterSpacing: '0.06em', margin: 0,
              color: 'var(--text-primary)',
            }}>
              PropNexus
            </h1>
          </div>
          <motion.button
            style={{
              padding: '10px 22px', borderRadius: 10, border: 'none',
              background: 'var(--gold)', color: 'var(--text-inverse)',
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem',
              cursor: 'pointer', letterSpacing: '0.02em',
              boxShadow: '0 0 24px var(--gold-glow)',
            }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 32px var(--gold-glow)' }}
            whileTap={{ scale: 0.98 }}
          >
            Post Property
          </motion.button>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px', display: 'flex', gap: 32 }}>

        {/* ═══ SIDEBAR FILTERS ═══ */}
        <motion.aside
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
          style={{
            width: 300, flexShrink: 0,
            background: 'var(--surface-1)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '28px 24px',
            boxShadow: 'var(--shadow-card)',
            position: 'sticky', top: 104, alignSelf: 'flex-start',
          }}
        >
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 500,
            marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8,
            color: 'var(--text-primary)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
            Search Filters
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Price Range */}
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: 10 }}>Price Range</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[{ key: 'min_price', ph: 'Min' }, { key: 'max_price', ph: 'Max' }].map(({ key, ph }) => (
                  <input
                    key={key}
                    type="number"
                    placeholder={ph}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1px solid var(--border)', background: 'var(--surface-3)',
                      color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none',
                      fontFamily: 'var(--font-body)', transition: 'border-color 0.2s',
                    }}
                    value={filters[key]}
                    onChange={(e) => setFilters({ ...filters, [key]: parseInt(e.target.value) || 0 })}
                    onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.3)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                ))}
              </div>
            </div>

            {/* Bedrooms */}
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: 10 }}>Bedrooms</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[-1, 1, 2, 3, 4, 5].map(val => (
                  <motion.button
                    key={val}
                    onClick={() => setFilters({ ...filters, bedrooms: val })}
                    style={{
                      padding: '8px 16px', borderRadius: 10, fontSize: '0.82rem', fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                      border: filters.bedrooms === val ? 'none' : '1px solid var(--border)',
                      background: filters.bedrooms === val ? 'var(--gold)' : 'var(--surface-3)',
                      color: filters.bedrooms === val ? 'var(--text-inverse)' : 'var(--text-muted)',
                      boxShadow: filters.bedrooms === val ? '0 0 16px var(--gold-glow)' : 'none',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    {val === -1 ? 'Any' : val === 5 ? '5+' : val}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: 10 }}>Sort By</label>
              <select
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'var(--surface-3)',
                  color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none',
                  fontFamily: 'var(--font-body)', cursor: 'pointer',
                }}
                value={filters.sort_mode}
                onChange={(e) => setFilters({ ...filters, sort_mode: parseInt(e.target.value) })}
              >
                <option value="0">Price (Lowest First)</option>
                <option value="1">Area (Largest First)</option>
                <option value="2">Advanced (BHK + Loc + Status)</option>
                <option value="3">Market Status (New/Sale/Resale)</option>
              </select>
            </div>

            {/* Apply Filters */}
            <motion.button
              onClick={fetchProperties}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                background: 'var(--gold)', color: 'var(--text-inverse)',
                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                fontFamily: 'var(--font-body)', letterSpacing: '0.02em',
                position: 'relative', overflow: 'hidden',
                transition: 'box-shadow 0.3s',
              }}
              whileHover={{ boxShadow: '0 0 32px var(--gold-glow)' }}
              whileTap={{ scale: 0.97 }}
            >
              {/* Shimmer sweep overlay */}
              <motion.span
                style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
                  pointerEvents: 'none',
                }}
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              />
              Apply Filters
            </motion.button>
          </div>
        </motion.aside>

        {/* ═══ RESULTS ═══ */}
        <section style={{ flex: 1, minWidth: 0 }}>
          <AISearchBar onAISearch={handleAISearch} />

          {/* Active Filter Badges */}
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
                  marginBottom: 24, padding: '14px 18px',
                  background: 'var(--gold-dim)', border: '1px solid rgba(201,168,76,0.2)',
                  borderRadius: 12, overflow: 'hidden',
                }}
              >
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: 4 }}>Active Filters:</span>

                {filters.location && (
                  <FilterBadge label={`📍 ${filters.location}`} onClear={() => setFilters(prev => ({ ...prev, location: '' }))} />
                )}
                {filters.property_type && (
                  <FilterBadge label={`🏠 ${filters.property_type}`} onClear={() => setFilters(prev => ({ ...prev, property_type: '' }))} />
                )}
                {filters.bedrooms !== -1 && (
                  <FilterBadge label={`🛏️ ${filters.bedrooms} BHK`} onClear={() => setFilters(prev => ({ ...prev, bedrooms: -1 }))} />
                )}
                {filters.bathrooms !== -1 && (
                  <FilterBadge label={`🛁 ${filters.bathrooms} Baths`} onClear={() => setFilters(prev => ({ ...prev, bathrooms: -1 }))} />
                )}
                {filters.max_price !== 100000000 && (
                  <FilterBadge label={`💰 Under ₹${(filters.max_price / 10000000).toFixed(1)} Cr`} onClear={() => setFilters(prev => ({ ...prev, max_price: 100000000 }))} />
                )}

                <button
                  onClick={() => setFilters({
                    min_price: 0, max_price: 100000000, bedrooms: -1, bathrooms: -1,
                    min_area: 0, sort_mode: 0, limit: 1000, location: '', property_type: ''
                  })}
                  style={{
                    fontSize: '0.72rem', fontWeight: 700, color: '#e87171',
                    background: 'none', border: 'none', cursor: 'pointer',
                    marginLeft: 'auto', transition: 'opacity 0.2s',
                  }}
                >
                  Clear All
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Count */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 500, margin: 0 }}>
              {loading ? (
                <span style={{ color: 'var(--text-muted)' }}>Searching...</span>
              ) : (
                <>
                  <span style={{ color: 'var(--gold)' }}>{animatedCount.toLocaleString('en-IN')}</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> Properties Found</span>
                </>
              )}
            </h2>
          </div>

          {/* Skeleton or Cards */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              {properties.map((p, index) => (
                <PropertyCard key={p.property_id} property={p} index={index} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Chatbot />

      {/* Scroll-to-top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            className="scroll-to-top"
            onClick={scrollToTop}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Scroll to top"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ═══════════════════════════════════════
   FilterBadge — reusable active filter chip
   ═══════════════════════════════════════ */
const FilterBadge = ({ label, onClear }) => (
  <motion.span
    initial={{ scale: 0.7, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px', borderRadius: 99,
      background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
      fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)',
    }}
  >
    {label}
    <button
      onClick={onClear}
      style={{
        background: 'none', border: 'none', color: 'var(--text-faint)',
        cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', padding: 0,
        lineHeight: 1, transition: 'color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.color = '#e87171'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
    >
      ×
    </button>
  </motion.span>
);

/* ═══════════════════════════════════════
   CardSkeleton — shimmer loading placeholder
   ═══════════════════════════════════════ */
const CardSkeleton = () => (
  <div style={{
    borderRadius: 16, overflow: 'hidden',
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-card)',
  }}>
    <div className="skeleton" style={{ height: 200, borderRadius: 0 }} />
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="skeleton" style={{ height: 18, width: '75%' }} />
      <div className="skeleton" style={{ height: 14, width: '50%' }} />
      <div style={{ display: 'flex', gap: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        <div className="skeleton" style={{ height: 14, width: 50 }} />
        <div className="skeleton" style={{ height: 14, width: 50 }} />
        <div className="skeleton" style={{ height: 14, width: 60 }} />
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════
   PropertyCard — dark luxury card with hover + badges
   ═══════════════════════════════════════ */
const PropertyCard = ({ property: p, index }) => {
  const isNewLaunch = p.description?.toLowerCase().includes('new') || p.description?.toLowerCase().includes('launch');

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE, delay: index * 0.06 }}
      whileHover={{
        y: -6,
        boxShadow: 'var(--shadow-hover)',
        borderColor: 'rgba(201,168,76,0.2)',
        transition: { duration: 0.25 },
      }}
      style={{
        background: 'var(--surface-2)', borderRadius: 16,
        border: '1px solid var(--border)', overflow: 'hidden',
        boxShadow: 'var(--shadow-card)', cursor: 'pointer',
      }}
    >
      {/* Image */}
      <div style={{ overflow: 'hidden', aspectRatio: '16/9', position: 'relative', background: 'var(--surface-3)' }}>
        <motion.img
          src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
          alt={p.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.5, ease: EASE }}
        />
        {/* Badges */}
        <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 8 }}>
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18, delay: index * 0.06 + 0.2 }}
            style={{
              background: 'rgba(12,12,11,0.75)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 99,
              padding: '4px 12px', fontSize: '0.7rem', fontWeight: 700,
              color: 'var(--text-primary)', letterSpacing: '0.02em',
            }}
          >
            {p.property_type}
          </motion.div>
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18, delay: index * 0.06 + 0.3 }}
            style={{
              background: isNewLaunch ? 'var(--gold)' : 'rgba(12,12,11,0.75)',
              backdropFilter: isNewLaunch ? 'none' : 'blur(8px)',
              border: isNewLaunch ? 'none' : '1px solid rgba(255,255,255,0.12)',
              borderRadius: 99, padding: '4px 12px',
              fontSize: '0.7rem', fontWeight: 700,
              color: isNewLaunch ? 'var(--text-inverse)' : 'var(--text-primary)',
              position: 'relative', letterSpacing: '0.02em',
            }}
          >
            {/* Ping ring on New Launch */}
            {isNewLaunch && (
              <span style={{
                position: 'absolute', inset: -3, borderRadius: 99,
                border: '2px solid var(--gold)', opacity: 0.6,
                animation: 'ping 1.8s ease-out infinite', pointerEvents: 'none',
              }} />
            )}
            {p.description}
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <h3 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 500,
            margin: 0, color: 'var(--text-primary)', lineHeight: 1.3,
            maxWidth: '60%',
          }}>
            {p.title}
          </h3>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 600,
            color: 'var(--gold)', whiteSpace: 'nowrap',
          }}>
            ₹{p.price.toLocaleString('en-IN')}
          </span>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          {p.location_name}
        </p>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 28,
          paddingTop: 16, borderTop: '1px solid var(--border)',
        }}>
          {[
            { val: p.bedrooms, label: 'Beds' },
            { val: p.bathrooms, label: 'Baths' },
            { val: p.area, label: 'Sqft' },
          ].map(({ val, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{val}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default App;