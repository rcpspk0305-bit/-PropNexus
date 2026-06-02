import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:8000/api';
const EASE = [0.16, 1, 0.3, 1];

const chatWindow = {
  hidden: { opacity: 0, scale: 0.92, y: 16 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', stiffness: 350, damping: 28 },
  },
  exit: {
    opacity: 0, scale: 0.92, y: 16,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am PropNexus AI. How can I help you find a property today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/chat`, { message: input });
      const botMsg = {
        role: 'assistant',
        content: res.data.reply,
        recommendations: res.data.recommendations || []
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-7 right-7 z-[100]">
      {/* Toggle Button — gold, bounce, ping ring */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center"
        style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--gold)', color: 'var(--text-inverse)',
          border: 'none', cursor: 'pointer',
          boxShadow: 'var(--shadow-card)',
        }}
        animate={{ y: isOpen ? 0 : [0, -6, 0] }}
        transition={{
          y: { duration: 3, repeat: isOpen ? 0 : Infinity, ease: 'easeInOut', repeatDelay: 1 },
        }}
        whileHover={{ scale: 1.12, rotate: 8 }}
        whileTap={{ scale: 0.92 }}
      >
        {/* Outer ping ring */}
        {!isOpen && (
          <span
            style={{
              position: 'absolute', inset: -6, borderRadius: '50%',
              border: '2px solid var(--gold)', opacity: 0.4,
              animation: 'ping 2.5s ease-out infinite', pointerEvents: 'none',
            }}
            aria-hidden="true"
          />
        )}
        {isOpen ? (
          <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        ) : (
          <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="flex flex-col overflow-hidden"
            style={{
              position: 'absolute', bottom: 64, right: 0,
              width: 384, height: 500,
              background: 'var(--surface-1)',
              borderRadius: 16,
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}
            variants={chatWindow}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, var(--surface-2), var(--surface-1))',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'var(--gold-dim)', color: 'var(--gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 12, border: '1px solid rgba(201,168,76,0.3)',
                }}>AI</div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>PropNexus</h3>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-faint)', margin: 0, letterSpacing: '0.04em' }}>AI-Powered Concierge</p>
                </div>
              </div>
              <button
                onClick={() => setMessages([{ role: 'assistant', content: 'Hi! I am PropNexus AI. How can I help you find a property today?' }])}
                style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-faint)', cursor: 'pointer', transition: 'color 0.2s' }}
                title="Clear Chat"
                onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>

            {/* Messages */}
            <div className="scrollbar-thin" style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg)' }}>
              {messages.length === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                  {['3 BHK under 1.5 Cr', 'Villas in Gachibowli', 'Apartments in Kukatpally'].map(s => (
                    <button
                      key={s}
                      onClick={() => { setInput(s); setTimeout(handleSend, 100); }}
                      style={{
                        textAlign: 'left', padding: '10px 14px',
                        background: 'var(--surface-2)', border: '1px solid var(--border)',
                        borderRadius: 12, fontSize: '0.78rem', color: 'var(--text-muted)',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'; e.currentTarget.style.color = 'var(--gold)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      "{s}"
                    </button>
                  ))}
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 8 }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <div style={{
                    maxWidth: '85%', padding: '10px 14px', borderRadius: 16, fontSize: '0.85rem', lineHeight: 1.5,
                    ...(msg.role === 'user'
                      ? { background: 'var(--gold)', color: 'var(--text-inverse)', borderTopRightRadius: 4 }
                      : { background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderTopLeftRadius: 4 }
                    ),
                  }}>
                    {msg.content}
                  </div>

                  {/* Recommendations */}
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="scrollbar-hide" style={{ width: '100%', overflowX: 'auto', paddingBottom: 4, display: 'flex', gap: 10 }}>
                      {msg.recommendations.map((p) => (
                        <div key={p.property_id} style={{
                          minWidth: 190, maxWidth: 190, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                          background: 'var(--surface-2)', border: '1px solid var(--border)',
                        }}>
                          <div style={{ height: 80, position: 'relative', background: 'var(--surface-3)' }}>
                            <img
                              src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              alt={p.title}
                            />
                            <div style={{
                              position: 'absolute', top: 6, right: 6,
                              background: 'var(--gold)', color: 'var(--text-inverse)',
                              fontSize: '0.6rem', padding: '2px 8px', borderRadius: 99, fontWeight: 700,
                            }}>
                              ₹{p.price > 10000000 ? (p.price/10000000).toFixed(1) + ' Cr' : (p.price/100000).toFixed(1) + ' L'}
                            </div>
                          </div>
                          <div style={{ padding: '10px 12px' }}>
                            <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '0.78rem', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{p.title}</h4>
                            <p style={{ fontSize: '0.62rem', color: 'var(--text-faint)', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.location_name}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)' }}>{p.bedrooms} BHK • {p.area} sqft</span>
                              <button style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer' }}>View</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: 12, borderRadius: 16, background: 'var(--surface-2)', border: '1px solid var(--border)', borderTopLeftRadius: 4 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[0, 1, 2].map(d => (
                        <div key={d} style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: 'var(--gold)', opacity: 0.6,
                          animation: `bounce 0.6s ease-in-out ${d * 0.15}s infinite alternate`,
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface-1)', display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Ask anything..."
                style={{
                  flex: 1, padding: '10px 16px',
                  background: 'var(--surface-3)', border: '1px solid var(--border)',
                  borderRadius: 12, outline: 'none', fontSize: '0.85rem',
                  color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
                  transition: 'border-color 0.2s',
                }}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.3)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                style={{
                  padding: '10px 12px', borderRadius: 12, border: 'none',
                  background: 'var(--gold)', color: 'var(--text-inverse)',
                  cursor: 'pointer', opacity: (loading || !input.trim()) ? 0.4 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20" style={{ transform: 'rotate(90deg)' }}><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chatbot;
