import React from 'react';
import { motion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1];

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.25 } }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 24 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 350, damping: 28 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.94, 
    y: 24,
    transition: { duration: 0.2, ease: 'easeIn' }
  }
};

const getPropertyImage = (property) => {
  if (!property) return "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&auto=format&fit=crop&q=80";
  
  const type = (property.property_type || property.type || "house").toLowerCase();
  const id = property.property_id || property.id || 0;
  
  const images = {
    apartment: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80"
    ],
    villa: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80"
    ],
    house: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1602075752385-e6d995221304?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80"
    ],
    plot: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1444653300604-1de7df85203a?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80"
    ]
  };

  let category = "house";
  if (type.includes("apartment") || type.includes("flat")) {
    category = "apartment";
  } else if (type.includes("villa")) {
    category = "villa";
  } else if (type.includes("plot") || type.includes("land")) {
    category = "plot";
  } else if (type.includes("house")) {
    category = "house";
  }
  
  const list = images[category];
  const index = Math.abs(id) % list.length;
  return list[index];
};

const PropertyDetailModal = ({ property: p, onClose }) => {
  if (!p) return null;
  const isNewLaunch = p.description?.toLowerCase().includes('new') || p.description?.toLowerCase().includes('launch');

  // Handle overlay click to close
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <motion.div
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 150,
        background: 'rgba(12, 12, 11, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <motion.div
        variants={modalVariants}
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-strong)',
          borderRadius: 24,
          maxWidth: 640,
          width: '100%',
          boxShadow: 'var(--shadow-hover), 0 24px 64px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <motion.button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 20,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(12, 12, 11, 0.7)',
            backdropFilter: 'blur(8px)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-strong)',
            fontSize: '1.4rem',
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          whileHover={{ 
            scale: 1.08, 
            borderColor: 'var(--gold)',
            color: 'var(--gold)',
            boxShadow: '0 0 16px var(--gold-glow)'
          }}
          whileTap={{ scale: 0.94 }}
        >
          &times;
        </motion.button>

        {/* Hero Image */}
        <div style={{ position: 'relative', height: 280, background: 'var(--surface-3)', overflow: 'hidden' }}>
          <img
            src={getPropertyImage(p)}
            alt={p.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(12,12,11,0.2) 0%, rgba(12,12,11,0.85) 100%)',
            pointerEvents: 'none',
          }} />

          {/* Badges layered on bottom of image */}
          <div style={{ position: 'absolute', bottom: 20, left: 24, display: 'flex', gap: 10 }}>
            <span style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-strong)',
              borderRadius: 99,
              padding: '6px 16px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              {p.property_type}
            </span>
            <span style={{
              background: isNewLaunch ? 'var(--gold)' : 'rgba(255,255,255,0.08)',
              border: isNewLaunch ? 'none' : '1px solid rgba(255,255,255,0.15)',
              borderRadius: 99,
              padding: '6px 16px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: isNewLaunch ? 'var(--text-inverse)' : 'var(--text-primary)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              position: 'relative',
            }}>
              {isNewLaunch && (
                <span style={{
                  position: 'absolute', inset: -3, borderRadius: 99,
                  border: '2px solid var(--gold)', opacity: 0.4,
                  animation: 'ping 1.8s ease-out infinite', pointerEvents: 'none',
                }} />
              )}
              {p.description || "For Sale"}
            </span>
          </div>
        </div>

        {/* Content Details */}
        <div style={{ padding: '32px 36px' }}>
          
          {/* Header Row: Title & Price */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.9rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.25,
              }}>
                {p.title}
              </h2>
              <p style={{ 
                color: 'var(--text-muted)', 
                fontSize: '0.88rem', 
                margin: '8px 0 0', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6 
              }}>
                <svg width="15" height="15" fill="none" stroke="var(--gold)" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {p.location_name}, Hyderabad
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.1rem',
                fontWeight: 600,
                color: 'var(--gold)',
                display: 'block',
                lineHeight: 1,
              }}>
                ₹{p.price.toLocaleString('en-IN')}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-faint)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Estimated Price
              </span>
            </div>
          </div>

          {/* Specs Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '16px 20px',
            margin: '28px 0',
          }}>
            {[
              { val: p.bedrooms, label: 'Bedrooms', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v-2.63c0-1.28-1.04-2.32-2.32-2.32h-11.8c-1.28 0-2.32 1.04-2.32 2.32v2.63m16.44 0v4.85H3.76v-4.85m16.44 0h-1.63m-14.81 0h1.63M12 9.2v4.8m3.6-4.8v2.4M8.4 9.2v2.4"/></svg> },
              { val: p.bathrooms, label: 'Bathrooms', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15h7.5M8.25 15h-1.5a1.5 1.5 0 0 0-1.5 1.5v3h10.5v-3a1.5 1.5 0 0 0-1.5-1.5M12 3v12M9 6v6m6-6v6"/></svg> },
              { val: p.area, label: 'Square Feet', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v16.5h16.5V3.75H3.75zM12 3.75v16.5M3.75 12h16.5"/></svg> },
            ].map(({ val, label, icon }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ color: 'var(--gold)', marginBottom: 2, display: 'flex', alignItems: 'center' }}>
                  {icon}
                </div>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem', lineHeight: 1 }}>
                  {val}
                </span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Description Section */}
          <div style={{ marginBottom: 32 }}>
            <h4 style={{ 
              fontSize: '0.72rem', 
              fontWeight: 700, 
              color: 'var(--text-faint)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.12em',
              margin: '0 0 8px'
            }}>
              Property Information
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
              This premium {p.property_type.toLowerCase()} located in the prime locality of {p.location_name} offers a grand lifestyle with meticulously planned spaces, state-of-the-art facilities, and close proximity to key landmarks. Perfectly designed to cater to modern luxury and convenience.
            </p>
          </div>

          {/* CTA Button Group */}
          <div style={{ display: 'flex', gap: 16 }}>
            <motion.button
              style={{
                flex: 1,
                padding: '16px 0',
                borderRadius: 12,
                border: 'none',
                background: 'var(--gold)',
                color: 'var(--text-inverse)',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                letterSpacing: '0.04em',
                boxShadow: '0 0 24px var(--gold-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              whileHover={{ 
                scale: 1.02, 
                boxShadow: '0 0 32px var(--gold-glow)',
                background: 'var(--gold-light)'
              }}
              whileTap={{ scale: 0.98 }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742h.01m3.999 0h.01m3.999 0h.01M9 16.5h.01m3.999 0h.01m3.999 0h.01M5.625 21h12.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H5.625c-.621 0-1.125.504-1.125 1.125v14.25c0 .621.504 1.125 1.125 1.125z"/></svg>
              Schedule Visit
            </motion.button>
            <motion.button
              style={{
                flex: 1,
                padding: '16px 0',
                borderRadius: 12,
                border: '1px solid var(--border-strong)',
                background: 'var(--surface-3)',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s',
              }}
              whileHover={{ 
                scale: 1.02, 
                borderColor: 'var(--gold)',
                background: 'var(--surface-4)',
                color: 'var(--text-primary)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 3.75v4.5m0-4.5h-4.5m4.5 0l-6 6m3 12c-5.054 0-9.15-4.096-9.15-9.15 0-2.402.932-4.587 2.455-6.22M20.25 12c0 2.402-.932 4.587-2.455 6.22"/></svg>
              Contact Agent
            </motion.button>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
};

export default PropertyDetailModal;
