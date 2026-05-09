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

# --- Hugging Face Integration ---
import requests
HF_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"
# Note: User should set HF_TOKEN environment variable for production
HF_TOKEN = os.getenv("HF_TOKEN", "") 

def query_hf(prompt: str):
    if not HF_TOKEN:
        # Improved fallback logic if no token
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
    max_price: float = Field(1e12, gt=0)
    min_area: int = Field(0, ge=0)
    bedrooms: int = Field(-1, ge=-1)
    bathrooms: int = Field(-1, ge=-1)
    sort_by_price: bool = True
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)

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
        req.min_price, req.max_price, req.min_area, req.bedrooms, req.bathrooms, req.sort_by_price
    )
    
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

@app.post("/api/chat")
async def chat_bot(req: ChatRequest):
    """
    General AI Chatbot: Answers questions about real estate and PropNexus.
    """
    prompt = f"""
    Context: You are PropNexus Assistant, a specialized real estate AI. 
    User Question: {req.message}
    
    Task: Provide a helpful, professional response. If the user asks about property types or locations, 
    mention that PropNexus specializes in Hyderabad real estate (Kukatpally, Gachibowli, Madhapur, etc.).
    """
    
    ai_response = query_hf(prompt)
    
    if ai_response and isinstance(ai_response, list) and len(ai_response) > 0:
        reply = ai_response[0].get("generated_text", "").strip()
    else:
        # Intelligent fallback
        reply = "I'm currently in lightweight mode. PropNexus is a high-performance search engine for Hyderabad real estate, using C-based indexing for ultra-fast results. How can I help you find your dream home?"
    
    return {"reply": reply}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)