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

@app.post("/api/ai-explain")
async def ai_insights(req: AIExplainRequest):
    """
    AI Analysis: Generates a natural language summary of the selected properties.
    Uses Gemini-like reasoning for property evaluation.
    """
    if not engine:
        raise HTTPException(status_code=503, detail="AI service unavailable.")
    
    selected_props = []
    for pid in req.property_ids:
        p = engine.get_by_id(pid)
        if p: selected_props.append(p)
    
    if not selected_props:
        return {"summary": "No valid properties found for analysis."}

    # Intelligent summary logic (Academic/Mock mode)
    # In a real environment, you would call: 
    # response = genai.GenerativeModel('gemini-pro').generate_content(...)
    
    avg_price = sum(p['price'] for p in selected_props) / len(selected_props)
    locations = list(set(p['location_name'] for p in selected_props))
    
    insights = (
        f"Analysis of {len(selected_props)} properties in {', '.join(locations)}. "
        f"The portfolio averages ${avg_price:,.0f} with a mix of "
        f"{', '.join(set(p['property_type'] for p in selected_props))} types. "
        f"Strategic Advice: Based on your context ('{req.user_context}'), these options "
        "provide a strong spatial clustering which suggests a consistent neighborhood value."
    )
    
    return {
        "summary": insights,
        "selected_count": len(selected_props)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)