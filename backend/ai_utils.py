import re
from typing import Dict, Any, List

def parse_natural_query(text: str) -> Dict[str, Any]:
    """
    Parses a natural language query into structured filters.
    Ported and enhanced from frontend logic.
    """
    filters = {}
    lower = text.lower()

    # Bedrooms (1-5 BHK)
    bed_match = re.search(r'(\d)\s*b(hk|ed|r)', lower)
    if bed_match:
        filters['bedrooms'] = int(bed_match.group(1))
    
    # Bathrooms
    bath_match = re.search(r'(\d)\s*bath', lower)
    if bath_match:
        filters['bathrooms'] = int(bath_match.group(1))

    # Price handling (Crores, Lakhs, K)
    # Match "under 2 Cr", "below 80 Lakhs", "within 50000"
    price_pattern = r'(?:under|below|within|budget of)\s*(?:₹|rs\.?|)?\s*([\d\.]+)\s*(cr|lakh|l|k)?'
    price_match = re.search(price_pattern, lower)
    if price_match:
        val = float(price_match.group(1))
        unit = price_match.group(2)
        
        if unit in ['cr']:
            val *= 10000000
        elif unit in ['lakh', 'l']:
            val *= 100000
        elif unit == 'k':
            val *= 1000
        # If no unit but val > 1000, assume it's direct INR. 
        # If val < 100 and no unit, could be Cr or Lakhs, but let's be conservative.
        
        filters['max_price'] = val

    # Locations
    locations = [
        "kukatpally", "gachibowli", "madhapur", "kondapur", 
        "hitec city", "manikonda", "jubilee hills", "banjara hills", 
        "tellapur", "narsingi", "miyapur", "uppal", "lb nagar"
    ]
    for loc in locations:
        if loc in lower:
            filters['location'] = loc.title()
            break

    # Property type
    if any(word in lower for word in ["apartment", "flat", "condo"]):
        filters['property_type'] = "Apartment"
    elif any(word in lower for word in ["house", "villa", "bungalow"]):
        filters['property_type'] = "House"
    elif "plot" in lower:
        filters['property_type'] = "Plot"

    return filters

def format_property_for_ai(p: Dict[str, Any]) -> str:
    return (
        f"- {p['title']} in {p['location_name']}: "
        f"₹{p['price']:,.0f}, {p['bedrooms']} BHK, {p['area']} sqft. "
        f"Type: {p['property_type']}. {p['amenities']}"
    )

def get_recommendation_prompt(user_query: str, properties: List[Dict[str, Any]]) -> str:
    if not properties:
        return f"The user is looking for: '{user_query}'. I couldn't find exact matches in the database. Help them refine their search or explain what PropNexus offers in Hyderabad."

    prop_list = "\n".join([format_property_for_ai(p) for p in properties[:5]])
    
    return f"""
    You are PropNexus AI, a premium real estate advisor.
    User is looking for: "{user_query}"
    
    I found these matching properties in our high-performance C-engine:
    {prop_list}
    
    Task: 
    1. Acknowledge the user's requirements.
    2. Recommend the best 2-3 options from the list above.
    3. Explain WHY these are good choices based on their query.
    4. Keep it professional, helpful, and concise (max 150 words).
    5. If no perfect match is found, suggest the closest alternatives.
    """

FAQ_KNOWLEDGE_BASE = [
    {
        "keywords": ["what", "propnexus", "about"],
        "answer": "PropNexus is a high-performance smart property search system built with a C-based backend for ultra-fast indexing and a modern React frontend. We specialize in premium real estate."
    },
    {
        "keywords": ["how", "search", "work", "technology", "c", "avl", "fast"],
        "answer": "Our search engine uses advanced C data structures, including AVL trees for O(log N + K) price-based range searches and Min-Heaps for spatial queries, making it significantly faster than traditional databases."
    },
    {
        "keywords": ["contact", "support", "help", "agent", "broker"],
        "answer": "You can reach out to our dedicated PropNexus real estate agents via the 'Contact' page, or email us at support@propnexus.com for personalized assistance."
    },
    {
        "keywords": ["locations", "city", "where", "areas", "hyderabad"],
        "answer": "We currently specialize in premium properties across major areas in Hyderabad, including Gachibowli, Kukatpally, Madhapur, Kondapur, HITEC City, and Jubilee Hills."
    },
    {
        "keywords": ["post", "sell", "list", "property", "add"],
        "answer": "To post a property, click the 'Post Property' button on the top right of the dashboard. You can list apartments, houses, and plots instantly."
    },
    {
        "keywords": ["price", "cost", "fee", "charge", "subscription"],
        "answer": "Browsing and searching for properties on PropNexus is completely free! We only charge a nominal service fee upon successful property closure."
    }
]

def get_rag_fallback_response(query: str) -> str:
    """
    Acts as a local Retrieval-Augmented Generation (RAG) fallback 
    when the external LLM API is unavailable. Matches user query 
    to an internal knowledge base.
    """
    lower_query = query.lower()
    
    # Simple scoring based on keyword overlap
    best_match = None
    max_score = 0
    
    for item in FAQ_KNOWLEDGE_BASE:
        # Score increases for each matching keyword
        score = sum(1 for kw in item["keywords"] if kw in lower_query)
        if score > max_score:
            max_score = score
            best_match = item["answer"]
            
    # If we found a good match, return it
    if best_match and max_score > 0:
        return best_match
        
    # Default generic fallback if no knowledge base match
    return "I am currently running in lightweight mode, but I can still help you search for properties! Try asking for something like 'Find me a 3BHK in Gachibowli'."

