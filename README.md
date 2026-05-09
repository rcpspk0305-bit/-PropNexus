# PropNexus: AI-Powered Spatial Search Engine

**PropNexus** is a full-stack smart property search system built for efficient real-estate listing retrieval. The core search engine is implemented in C using data structures such as hash tables or tree-based indexing for fast lookup, filtering, sorting, ranking, and spatial querying, while FastAPI powers the backend, React provides the frontend, and AI adds natural-language assistance and result explanations.

## 🚀 Key Features
- **Spatial K-D Tree**: Ultra-fast geographic range queries and nearest-neighbor searches in $O(\log N)$ or $O(\sqrt{N})$.
- **ID Hash Table**: Instant $O(1)$ property lookups by ID.
- **Merge Sort Engine**: Stable, high-speed ranking and filtering of property results.
- **Min-Heap Ranking**: Efficient Top-K nearest property retrieval.
- **AI-Powered Insights**: Natural language search and property comparison (Gemini-integrated).
- **Premium Frontend**: Modern, responsive dashboard built with React and TailwindCSS.

## 📁 Project Structure
```text
PropNexus/
├── backend/            # Python & C Logic
│   ├── core/           # C High-Performance Engine
│   │   ├── ds_core.h       # Structural blueprint & FFI definitions
│   │   ├── ds_hash_sort.c  # ID Indexing & Merge Sort logic
│   │   └── ds_spatial_heap.c # K-D Tree & Min-Heap logic
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
- **Runtime**: Python 3.9+, Node.js 18+
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
| **Spatial Query** | 2D K-D Tree | $O(\sqrt{N} + K)$ |
| **Top-K Ranking** | Binary Min-Heap | $O(N \log K)$ |
| **Result Sorting** | Merge Sort | $O(N \log N)$ |

---
*Created as a Data Structures Semester Project.*
