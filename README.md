# PropNexus: AI-Powered Spatial Search Engine

**PropNexus** is a full-stack smart property search system built for efficient real-estate listing retrieval. The core search engine is implemented in C using data structures such as hash tables or tree-based indexing for fast lookup, filtering, sorting, ranking, and spatial querying, while FastAPI powers the backend, React provides the frontend, and AI adds natural-language assistance and result explanations.

## 🚀 Key Features
- **AVL Tree Indexing**: Efficient price-based range search in $O(\log N + K)$.
- **ID Hash Table**: Instant $O(1)$ property lookups by ID.
- **Merge Sort Engine**: Stable, high-speed ranking and filtering of property results.
- **Min-Heap Ranking**: Efficient Top-K nearest property retrieval.
- **Hybrid Gen-AI Engine**: 
  - **NLP Search**: Describe properties in plain English (e.g., "3BHK in Gachibowli under 2Cr").
  - **Expert Chatbot**: Personalized property recommendations based on your query context.
  - **Local RAG Fallback**: Robust knowledge retrieval system that ensures the assistant stays smart even if external APIs are down.
- **Premium Frontend**: Modern, high-performance dashboard built with React and custom-tuned CSS for a seamless user experience.

## 📁 Project Structure
```text
PropNexus/
├── backend/            # Python & C Logic
│   ├── core/           # C High-Performance Engine
│   │   ├── ds_core.h       # Structural blueprint & FFI definitions
│   │   ├── ds_hash_sort.c  # ID Indexing & Merge Sort logic
│   │   └── ds_spatial_heap.c # AVL Tree & Min-Heap logic
│   ├── data/           # Property datasets (CSV/Binary)
│   ├── scripts/        # Build and smoke test scripts
│   ├── main.py         # FastAPI REST Endpoints
│   └── bridge.py       # C-Python FFI Wrapper
└── frontend/           # React Application (Vite)
    ├── src/            # Components & App Logic
    ├── public/         # Static Assets
    └── index.html      # Entry Point
```

## 🛠️ Installation & Setup

### 1. Requirements
- **Compiler**: GCC (MinGW-w64 recommended for 64-bit Windows)
- **Runtime**: Python 3.14+, Node.js 18+
- **Environment**: 64-bit OS matching your Python/Compiler bitness

### 2. Build the C Engine
Navigate to the root and run the automated build script:
```powershell
cd backend
powershell -ExecutionPolicy Bypass -File scripts/build.ps1
```

### 3. Start the Backend API
Install dependencies and launch the FastAPI server:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 4. Start the Frontend Dashboard
Navigate to the frontend directory and launch the Vite dev server:
```bash
cd frontend
npm install
npm run dev
```

## 🧠 Data Structure Complexity Note
| Operation | Data Structure | Complexity |
| :--- | :--- | :--- |
| **ID Lookup** | Hash Table (Chaining) | $O(1)$ Average |
| **Price Search** | AVL Tree | $O(\log N + K)$ |
| **Top-K Ranking** | Binary Min-Heap | $O(N \log K)$ |
| **Result Sorting** | Merge Sort | $O(N \log N)$ |
| **AI Matching** | Hybrid (NLP + RAG) | $O(\text{Embedding/Keyword Search})$ |

## 🌟 Recent Updates (v2.1)
- **Advanced Chat Recommendations**: The assistant now suggests specific property cards within the chat interface.
- **RAG Knowledge Base**: Implemented a local retrieval-augmented generation fallback to answer general questions without relying on external LLM APIs.
- **NLP Query Parser**: Ported search logic to the backend for unified query understanding across the search bar and chatbot.
- **UI Polish**: Integrated custom scrollbars, micro-animations, and a unified color palette for a premium aesthetic.

---
*Created as a Data Structures Semester Project.*

# From the backend/core directory
..\scripts\mingw64\mingw64\bin\gcc.exe -O3 -march=native -Wall -Wextra -std=c11 -fPIC -shared -o libds_engine_avl.dll ds_hash_sort.c ds_spatial_heap.c
