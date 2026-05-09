#ifndef DS_CORE_H
#define DS_CORE_H

#include <stdint.h>
#include <stdbool.h>

/* Constants for fixed-length strings (FFI Readiness) */
#define MAX_TITLE_LEN 128
#define MAX_LOCATION_LEN 128
#define MAX_TYPE_LEN 32
#define MAX_AMENITIES_LEN 512
#define MAX_DESCRIPTION_LEN 1024
#define HASH_SIZE 2048

/* 
 * Core Property Structure (Packed for bit-level FFI accuracy)
 */
#pragma pack(push, 1)
typedef struct {
    int32_t property_id;
    char title[MAX_TITLE_LEN];
    char location_name[MAX_LOCATION_LEN];
    char property_type[MAX_TYPE_LEN];
    double latitude;
    double longitude;
    double price;
    int32_t area;
    int32_t bedrooms;
    int32_t bathrooms;
    char amenities[MAX_AMENITIES_LEN];
    char description[MAX_DESCRIPTION_LEN];
} Property;
#pragma pack(pop)

/* Hash Node for O(1) ID lookups */
typedef struct HashNode {
    Property* property;
    struct HashNode* next;
} HashNode;

/* AVL Tree Node for Price Indexing */
typedef struct AVLNode {
    Property* property;
    struct AVLNode *left, *right;
    int32_t height;
} AVLNode;

/* Min-Heap Node for Top-K Ranking */
typedef struct {
    double distance_sq;
    Property* property;
} HeapNode;

typedef struct {
    HeapNode* nodes;
    int32_t size;
    int32_t capacity;
} MinHeap;

/* The Master Engine Structure */
typedef struct {
    Property* data;
    int32_t count;
    int32_t capacity;
    HashNode* hash_table[HASH_SIZE];
    AVLNode* avl_root;
} PropertyEngine;

#ifdef __cplusplus
extern "C" {
#endif

/* Engine & Lifecycle */
PropertyEngine* ds_create_engine(const char* csv_path);
void ds_destroy_engine(PropertyEngine* engine);

/* ID Indexing & Sorting (ds_hash_sort.c) */
Property* ds_get_by_id(PropertyEngine* engine, int32_t id);
void ds_filter_and_sort(PropertyEngine* engine, double min_p, double max_p, 
                        int32_t min_area, int32_t beds, int32_t baths, int32_t sort_mode, 
                        Property*** results, int32_t* count);

/* Spatial Search & Ranking (ds_spatial_heap.c) */
void ds_spatial_range(PropertyEngine* engine, double lat_min, double lon_min, 
                      double lat_max, double lon_max, Property*** results, int32_t* count);
void ds_get_top_k_nearby(PropertyEngine* engine, double lat, double lon, int32_t k, 
                         Property*** results, int32_t* count);
AVLNode* ds_avl_insert(AVLNode* node, Property* p);

/* Utility */
void ds_free_results(Property** results);

#ifdef __cplusplus
}
#endif

#endif /* DS_CORE_H */