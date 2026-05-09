import { useState } from "react";

const SAMPLE_SUGGESTIONS = [
  "3BHK near top schools in Austin under $600k",
  "Apartments with gym in Seattle",
  "Houses with 2+ baths in Miami under $500k",
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

    // Bedrooms
    const bedMatch = lower.match(/(\d)\s*b(hk|ed|r)/);
    if (bedMatch) filters.bedrooms = parseInt(bedMatch[1]);

    // Max price
    const priceMatch = lower.match(/under\s*\$?([\d,]+)k?/);
    if (priceMatch) {
      let price = parseInt(priceMatch[1].replace(",", ""));
      if (lower.includes("k") && price < 10000) price *= 1000;
      filters.maxPrice = price;
    }

    // City
    const cities = ["austin", "miami", "seattle", "new york", "los angeles", "san francisco", "denver", "chicago", "houston", "phoenix"];
    const cityFound = cities.find((c) => lower.includes(c));
    if (cityFound) filters.city = cityFound.replace(/\b\w/g, (l) => l.toUpperCase());

    // Property type
    if (lower.includes("apartment")) filters.type = "Apartment";
    if (lower.includes("house")) filters.type = "House";
    if (lower.includes("townhouse")) filters.type = "Townhouse";

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
          placeholder='e.g. "3BHK near good schools in Austin under $600k"'
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
