import { useState } from "react";

const SAMPLE_SUGGESTIONS = [
  "3BHK near HITEC City under 2Cr",
  "Villas in Gachibowli with 3+ baths",
  "Apartments in Kondapur under 80 Lakhs",
];

export default function AISearchBar({ onAISearch }) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

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

    // Max price (e.g. "under 2Cr", "below 80 Lakhs", "under 1.5 Cr", "within 50k", "budget of 1.2 Crore")
    const priceMatch = lower.match(/(?:under|below|within|budget of)\s*(?:₹|rs\.?|)?\s*([\d.]+)\s*(cr|crore|lakh|l|k)?/);
    if (priceMatch) {
      let val = parseFloat(priceMatch[1]);
      const unit = priceMatch[2];
      if (unit === 'cr' || unit === 'crore') {
        val *= 10000000;
      } else if (unit === 'lakh' || unit === 'l') {
        val *= 100000;
      } else if (unit === 'k') {
        val *= 1000;
      } else if (val < 100) {
        // If they write "under 2" without unit, assume they mean Crores
        val *= 10000000;
      }
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
    <div className="ai-search-wrapper">
      <div className="ai-search-label">
        <span className="ai-badge">✦ AI</span>
        <span>Describe your ideal property in plain English</span>
      </div>

      <div className="ai-search-bar">
        <input
          type="text"
          className="ai-search-input"
          placeholder='e.g. "3BHK near good schools in Hyderabad under 2Cr"'
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
            <span className="ai-spinner">⟳</span>
          ) : (
            "Search"
          )}
        </button>
      </div>

      {showSuggestions && (
        <div className="ai-suggestions">
          <p className="ai-suggestions-label">Try asking:</p>
          {SAMPLE_SUGGESTIONS.map((s, i) => (
            <div
              key={i}
              className="ai-suggestion-item"
              onMouseDown={() => {
                setQuery(s);
                setShowSuggestions(false);
              }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
