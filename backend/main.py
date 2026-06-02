from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import os
from bridge import EngineBridge

app = FastAPI(
    title="PropNexus: High-Performance Search Engine",
    description="A full-stack smart property search system with C-based indexing and AI-driven insights.",
    version="2.0.0"
)

# CORS Configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Strict origins should be used in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Engine (Singleton)
DATA_PATH = os.path.join(os.path.dirname(__file__), "synthetic_properties.csv")
try:
    engine = EngineBridge(DATA_PATH)
except Exception as e:
    print(f"CRITICAL: Failed to initialize C engine: {e}")
    engine = None

# --- Hugging Face Integration & Free LLM fallback ---
import requests
import json
HF_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"
HF_TOKEN = os.getenv("HF_TOKEN", "") 

def query_free_llm(prompt: str) -> Optional[str]:
    """
    Keyless free LLM provider fallback using DuckDuckGo AI Chat.
    Extremely robust and has no token or key requirements.
    """
    try:
        # Step 1: Get vqd token
        status_url = "https://duckduckgo.com/duckchat/v1/status"
        headers = {
            "x-vqd-accept": "1",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        res = requests.get(status_url, headers=headers, timeout=5)
        if res.status_code != 200:
            return None
        
        vqd = res.headers.get("x-vqd-4")
        if not vqd:
            return None
        
        # Step 2: Query the model
        chat_url = "https://duckduckgo.com/duckchat/v1/chat"
        chat_headers = {
            "x-vqd-4": vqd,
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}]
        }
        response = requests.post(chat_url, headers=chat_headers, json=payload, stream=True, timeout=10)
        if response.status_code != 200:
            return None
        
        # Parse stream response
        full_text = []
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8', errors='ignore')
                if line_str.startswith("data: "):
                    data_content = line_str[6:]
                    if data_content == "[DONE]":
                        break
                    try:
                        data_json = json.loads(data_content)
                        message = data_json.get("message")
                        if message:
                            full_text.append(message)
                    except:
                        pass
        return "".join(full_text)
    except Exception as e:
        print(f"Free LLM API error: {e}")
        return None

def query_hf(prompt: str):
    # Try the free keyless model first
    free_reply = query_free_llm(prompt)
    if free_reply:
        return [{"generated_text": free_reply}]

    if not HF_TOKEN:
        # Fallback to backend local RAG logic if no token
        return None
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    payload = {"inputs": prompt, "parameters": {"max_new_tokens": 250, "temperature": 0.7, "return_full_text": False}}
    try:
        response = requests.post(HF_API_URL, headers=headers, json=payload, timeout=10)
        return response.json()
    except Exception as e:
        print(f"AI Error: {e}")
        return None

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

# --- Pydantic V2 Models ---
class SearchRequest(BaseModel):
    min_price: float = Field(0.0, ge=0)
    max_price: float = Field(1e12, ge=0)
    min_area: int = Field(0, ge=0)
    bedrooms: int = Field(-1, ge=-1)
    bathrooms: int = Field(-1, ge=-1)
    sort_mode: int = Field(0, ge=0, le=3)
    page: int = Field(1, ge=1)
    limit: int = Field(200, ge=1, le=1000)

class PropertyCreate(BaseModel):
    title: str
    location_name: str
    property_type: str = "Apartment"
    price: float
    area: int
    bedrooms: int
    bathrooms: int
    latitude: float = 17.3850
    longitude: float = 78.4867
    amenities: str = ""
    description: str = ""

class SpatialRequest(BaseModel):
    latitude: float
    longitude: float
    k: int = Field(5, ge=1, le=50)

class AIExplainRequest(BaseModel):
    property_ids: List[int]
    user_context: str = "Looking for a family-friendly neighborhood with good value."

# --- API Endpoints ---

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "engine": "healthy" if engine else "degraded",
        "dataset": DATA_PATH
    }

@app.post("/api/search")
async def search_properties(req: SearchRequest):
    if not engine:
        raise HTTPException(status_code=503, detail="Search engine is currently unavailable.")
    
    results = engine.search_advanced(
        req.min_price, req.max_price, req.min_area, req.bedrooms, req.bathrooms, req.sort_mode
    )
    print(f"DEBUG: C-Engine found {len(results)} properties. Requested Limit: {req.limit}")
    
    # Simple pagination
    start = (req.page - 1) * req.limit
    end = start + req.limit
    
    return {
        "total_results": len(results),
        "page": req.page,
        "limit": req.limit,
        "properties": results[start:end]
    }

@app.post("/api/nearest")
async def find_nearby(req: SpatialRequest):
    if not engine:
        raise HTTPException(status_code=503, detail="Search engine is unavailable.")
    
    results = engine.get_top_k(req.latitude, req.longitude, req.k)
    return {"count": len(results), "properties": results}

@app.get("/api/property/{prop_id}")
async def get_property(prop_id: int):
    if not engine:
        raise HTTPException(status_code=503, detail="Search engine is unavailable.")
    
    p = engine.get_by_id(prop_id)
    if not p:
        raise HTTPException(status_code=404, detail="Property not found.")
    return p

@app.post("/api/property")
async def create_property(prop: PropertyCreate):
    """
    Adds a new property to the dataset and reloads the C engine.
    """
    if not os.path.exists(DATA_PATH):
        # Create header if file doesn't exist
        with open(DATA_PATH, 'w', encoding='utf-8') as f:
            f.write("property_id,title,property_type,location_name,city,state,price_inr,area_sqft,bedrooms,bathrooms,furnishing_status,latitude,longitude,listing_type\n")
    
    # Generate new ID (simple counter based on file length)
    try:
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            new_id = len(lines) 
    except:
        new_id = 1000

    # Append using CSV writer to handle commas in fields
    import csv
    with open(DATA_PATH, 'a', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            new_id, prop.title, prop.property_type, prop.location_name, 
            "Hyderabad", "Telangana", prop.price, prop.area, 
            prop.bedrooms, prop.bathrooms, prop.amenities, 
            prop.latitude, prop.longitude, prop.description
        ])
    
    # Reload engine to include new data
    if engine:
        engine.reload(DATA_PATH)
        
    return {"status": "success", "property_id": new_id}

@app.post("/api/ai-explain")
async def ai_insights(req: AIExplainRequest):
    """
    AI Analysis: Generates a natural language summary of selected properties.
    Uses Hugging Face Inference API if token is provided, otherwise falls back to logic.
    """
    if not engine:
        raise HTTPException(status_code=503, detail="AI service unavailable.")
    
    selected_props = []
    for pid in req.property_ids:
        p = engine.get_by_id(pid)
        if p: selected_props.append(p)
    
    if not selected_props:
        return {"summary": "No valid properties found for analysis."}

    # Prepare prompt for LLM
    prop_details = "\n".join([
        f"- {p['title']} in {p['location_name']}: ${p['price']:,.0f}, {p['bedrooms']} beds, {p['area']} sqft"
        for p in selected_props
    ])
    
    prompt = f"""
    User Context: {req.user_context}
    
    Selected Properties:
    {prop_details}
    
    Task: Act as a premium real estate advisor. Analyze these properties and explain why they match the user's context. 
    Provide a concise, professional summary in 3-4 sentences.
    """

    ai_response = query_hf(prompt)
    
    if ai_response and isinstance(ai_response, list) and len(ai_response) > 0:
        summary = ai_response[0].get("generated_text", "").replace(prompt, "").strip()
    else:
        # Fallback to rule-based logic
        avg_price = sum(p['price'] for p in selected_props) / len(selected_props)
        summary = (
            f"I've analyzed {len(selected_props)} properties for you. "
            f"With an average price of ₹{avg_price:,.0f}, these options in "
            f"{', '.join(set(p['location_name'] for p in selected_props))} "
            f"align well with your goal: '{req.user_context}'."
        )
    
    return {
        "summary": summary,
        "selected_count": len(selected_props)
    }

from ai_utils import parse_natural_query, get_recommendation_prompt, get_rag_fallback_response

@app.post("/api/chat")
async def chat_bot(req: ChatRequest):
    """
    Enhanced AI Chatbot: Answers questions and recommends properties.
    """
    if not engine:
        return {"reply": "I'm having trouble accessing our property database right now. How else can I assist you?", "recommendations": []}

    lower_msg = req.message.lower()

    # 1. Check for property search intent
    locations = [
        "kukatpally", "gachibowli", "madhapur", "kondapur", "hitec city", 
        "manikonda", "jubilee hills", "banjara hills", "tellapur", 
        "narsingi", "miyapur", "uppal", "lb nagar"
    ]
    has_location = any(loc in lower_msg for loc in locations)
    has_bhk = any(x in lower_msg for x in ["bhk", "bedroom", "bed"])
    has_price = any(x in lower_msg for x in ["under", "below", "within", "budget", "cr", "lakh", "price", "cost", "inr", "rs"])
    has_type = any(x in lower_msg for x in ["apartment", "flat", "condo", "house", "villa", "bungalow", "plot"])
    
    search_intent = has_location or has_bhk or has_price or has_type

    if search_intent:
        # Parse query for parameters
        params = parse_natural_query(req.message)
        recommended_properties = []
        
        if params or search_intent:
            min_p = 0
            max_p = params.get('max_price', 1000000000)
            min_a = 0
            beds = params.get('bedrooms', -1)
            baths = params.get('bathrooms', -1)
            
            # Perform search via C-engine
            results = engine.search_advanced(min_p, max_p, min_a, beds, baths, 2) # Mode 2 for advanced sort
            
            # Filter by location if specified
            if 'location' in params:
                loc = params['location'].lower()
                results = [p for p in results if loc in p['location_name'].lower()]
            elif has_location:
                # Find which location matches
                for loc in locations:
                    if loc in lower_msg:
                        results = [p for p in results if loc in p['location_name'].lower()]
                        break
            
            # Filter by property type if specified
            if 'property_type' in params:
                ptype = params['property_type'].lower()
                results = [p for p in results if ptype in p['property_type'].lower()]
            
            recommended_properties = results[:5]

        # Construct prompt for the search recommendation
        prompt = get_recommendation_prompt(req.message, recommended_properties)
        ai_response = query_hf(prompt)
        
        if ai_response and isinstance(ai_response, list) and len(ai_response) > 0:
            reply = ai_response[0].get("generated_text", "").replace(prompt, "").strip()
        else:
            if recommended_properties:
                prop_names = ", ".join([p['title'] for p in recommended_properties[:3]])
                reply = f"I've searched our database and found some excellent matching properties for you, including {prop_names}. Based on your criteria, these options offer great value."
            else:
                reply = "I've searched our database, but didn't find any properties matching those exact filters. Try broadening your budget or searching in a different area."

        return {
            "reply": reply,
            "recommendations": recommended_properties
        }

    else:
        # No search intent detected -> Fall back to generic LLM response
        prompt = f"""
        You are a premium real estate assistant for PropNexus.
        Analyze the user's question: "{req.message}"
        
        Respond ONLY with a valid JSON object matching this schema:
        {{
          "intent": "general",
          "reply": "Your detailed answer to the user's question here. Mention that PropNexus specializes in Hyderabad real estate (Kukatpally, Gachibowli, Madhapur, etc.) if relevant."
        }}
        
        Do not include any explanation, code blocks, or markdown outside the JSON. Response:
        """
        
        ai_response = query_hf(prompt)
        reply = ""
        
        if ai_response and isinstance(ai_response, list) and len(ai_response) > 0:
            raw_text = ai_response[0].get("generated_text", "").replace(prompt, "").strip()
            
            # Strip potential JSON code fence formatting if the LLM returned it
            if "```json" in raw_text:
                raw_text = raw_text.split("```json")[1].split("```")[0].strip()
            elif "```" in raw_text:
                raw_text = raw_text.split("```")[1].split("```")[0].strip()
                
            try:
                data = json.loads(raw_text)
                reply = data.get("reply", "")
            except:
                reply = raw_text
                
        if not reply:
            reply = get_rag_fallback_response(req.message)
            
        return {
            "reply": reply,
            "recommendations": []
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)