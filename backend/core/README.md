# PropNexus C-Engine Core (`backend/core`)

This directory contains the high-performance C-engine at the heart of PropNexus. The core is designed using advanced data structures and algorithms to handle real-estate listings with sub-millisecond retrieval speeds, low-overhead search, and spatial proximity filtering.

---

## 🛠️ Data Structures & Complexity Blueprints

| Feature | Data Structure | Best Case | Average Case | Worst Case | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ID Lookup** | Hash Table with Chaining | $O(1)$ | $O(1)$ | $O(N)$ | Fast $O(1)$ property lookup by ID |
| **Price Search** | AVL Tree | $O(\log N)$ | $O(\log N)$ | $O(\log N)$ | Fast price range queries |
| **Result Sorting** | Merge Sort (Stable) | $O(N \log N)$ | $O(N \log N)$ | $O(N \log N)$ | Sorting by price/area/status |
| **Nearest Neighbors**| Binary Min-Heap | $O(\log K)$ | $O(N \log K)$ | $O(N \log K)$ | Retrieving Top-$K$ closest properties |

---

## 📁 Source Code Breakdown

### 1. [ds_core.h](file:///c:/Users/rc821/OneDrive/Desktop/DS%20Project/backend/core/ds_core.h) (Structural & Interface Blueprints)
Acts as the central architecture file defining structural models and DLL-readiness FFI entry points:
- **`Property` Structure**: Packed with `#pragma pack(push, 1)` to maintain strict byte alignment across C and Python (FFI structure mappings).
- **`PropertyEngine` Master Structure**: Holds array pointers to properties, AVL root pointer (`avl_root`), and the fixed-size hash table buckets (`hash_table`).

### 2. [ds_core.c](file:///c:/Users/rc821/OneDrive/Desktop/DS%20Project/backend/core/ds_core.c) (Lifecycle & Price AVL Engine)
Manages the memory lifecycle and dynamic Price-indexed AVL tree of the core engine:
- **`ds_init_engine`**: Opens `synthetic_properties.csv`, reads line by line, parses commas, constructs packed `Property` records in continuous memory, and populates the balance-sorted AVL tree root.
- **`ds_destroy_engine`**: Safely cleans up all allocated structures, destroying loaded properties and recursively freeing AVL tree nodes to prevent memory leaks.

### 3. [ds_hash_sort.c](file:///c:/Users/rc821/OneDrive/Desktop/DS%20Project/backend/core/ds_hash_sort.c) (Hashing & Sorting Engine)
Handles precise searches and structured sorting:
- **Hash Table**: Implemented using **division hashing** over 2048 buckets with **linked list chaining** for collision resolution. Resolves property lookups by ID in $O(1)$ average time.
- **Merge Sort**: A high-performance, stable implementation used to sort properties. Supports four distinct sorting modes (Price Ascending, Area Descending, Advanced Multi-Filter matching, and Market Status).

### 4. [ds_spatial_heap.c](file:///c:/Users/rc821/OneDrive/Desktop/DS%20Project/backend/core/ds_spatial_heap.c) (AVL Tree & Proximity Heap)
Implements range searches and coordinate distance logic:
- **AVL Tree Indexing**: Standard self-balancing binary search tree sorted by property prices. Balance factors are monitored during insertions, triggering Left/Right rotations as required to preserve $O(\log N)$ heights.
- **Min-Heap Ranking**: A binary min-heap used to find the Top-$K$ nearest properties based on coordinate Euclidean distances. It processes distances dynamically using standard heapify-up/down bubble transitions.

---

## ⚙️ Compilation & DLL Packaging

The C source files are compiled into a shared library (`.dll` on Windows) which is loaded dynamically by Python's `ctypes` module inside `bridge.py`.

To compile the engine manually using GCC, run the following command from the `backend/core` folder:

```powershell
..\scripts\mingw64\mingw64\bin\gcc.exe -O3 -march=native -Wall -Wextra -std=c11 -fPIC -shared -o libds_engine_avl.dll ds_hash_sort.c ds_spatial_heap.c ds_core.c
```

### Build Parameters Explained:
- `-O3`: Activates compiler optimizations for high-performance execution.
- `-march=native`: Directs the compiler to generate instructions optimized for the local CPU architecture.
- `-shared -fPIC`: Outputs a position-independent shared dynamic library (.dll/.so) compatible with external FFI wrappers.
