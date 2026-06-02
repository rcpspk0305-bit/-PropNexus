import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTypewriter } from "../hooks/useTypewriter";

const SAMPLE_SUGGESTIONS = [
  "3BHK near HITEC City under 2Cr",
  "Villas in Gachibowli with 3+ baths",
  "Apartments in Kondapur under 80 Lakhs",
];

const EASE = [0.16, 1, 0.3, 1];

export default function AISearchBar({ onAISearch }) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const placeholderText = useTypewriter();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setShowSuggestions(false);

    // Parse query into filters (basic NLP logic)
    const parsed = parseNaturalQuery(query);
    setTimeout(() => {
      setIsLoading(false);
      onAISearch(parsed, query);
    }, 800);
  };

  const parseNaturalQuery = (text) => {
    const filters = {};
    const lower = text.toLowerCase();

    // Bedrooms (e.g. "3BHK", "3 BHK", "3 bed")
    const bedMatch = lower.match(/(\d)\s*b(hk|ed|r)/);
    if (bedMatch) filters.bedrooms = parseInt(bedMatch[1]);

    // Bathrooms (e.g. "3 baths", "2 bathroom")
    const bathMatch = lower.match(/(\d)\s*bath/);
    if (bathMatch) filters.bathrooms = parseInt(bathMatch[1]);

    // Max price
    const priceMatch = lower.match(/(?:under|below|within|budget of)\s*(?:₹|rs\.?)?\s*([\d.]+)\s*(cr|crore|lakh|l|k)?/);
    if (priceMatch) {
      let val = parseFloat(priceMatch[1]);
      const unit = priceMatch[2];
      if (unit === 'cr' || unit === 'crore') val *= 10000000;
      else if (unit === 'lakh' || unit === 'l') val *= 100000;
      else if (unit === 'k') val *= 1000;
      else if (val < 100) val *= 10000000;
      filters.maxPrice = val;
    }

    // City/Location
    const locations = [
      "kukatpally", "gachibowli", "madhapur", "kondapur",
      "hitec city", "manikonda", "jubilee hills", "banjara hills",
      "tellapur", "narsingi", "miyapur", "uppal", "lb nagar"
    ];
    const locFound = locations.find((l) => lower.includes(l));
    if (locFound) {
      filters.city = locFound.replace(/\b\w/g, (l) => l.toUpperCase());
    }

    // Property type
    if (lower.includes("apartment") || lower.includes("flat")) filters.type = "Apartment";
    if (lower.includes("house") || lower.includes("villa")) filters.type = "House";
    if (lower.includes("plot")) filters.type = "Plot";

    return filters;
  };

  return (
    <motion.div
      className="ai-search-wrapper"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      {/* Corner ambient glow */}
      <div className="ai-corner-glow" aria-hidden="true" />

      <motion.div
        className="ai-search-label"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
      >
        <span className="ai-badge">✦ AI</span>
        <span>Describe your ideal property in plain English</span>
      </motion.div>

      <motion.div
        className="ai-search-bar"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.2 }}
      >
        <input
          type="text"
          className="ai-search-input"
          placeholder={query ? undefined : (placeholderText || '"3BHK near good schools in Hyderabad under 2Cr"')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button
          className="ai-search-btn"
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
        >
          {isLoading ? (
            <div className="ai-search-spinner" />
          ) : (
            "Search"
          )}
        </button>
      </motion.div>

      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            className="ai-suggestions"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <p className="ai-suggestions-label">Try asking:</p>
            {SAMPLE_SUGGESTIONS.map((s, i) => (
              <motion.div
                key={i}
                className="ai-suggestion-item"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                onMouseDown={() => {
                  setQuery(s);
                  setShowSuggestions(false);
                }}
              >
                {s}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
