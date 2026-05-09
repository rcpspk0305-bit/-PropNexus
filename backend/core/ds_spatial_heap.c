#include "ds_core.h"
#include <stdlib.h>
#include <math.h>

/* K-D Tree Construction: O(N log N) */
static int compare_lat(const void* a, const void* b) {
    double d = (*(Property**)a)->latitude - (*(Property**)b)->latitude;
    return (d > 0) - (d < 0);
}
static int compare_lon(const void* a, const void* b) {
    double d = (*(Property**)a)->longitude - (*(Property**)b)->longitude;
    return (d > 0) - (d < 0);
}

KDNode* build_kd_tree(Property** props, int32_t n, int8_t depth) {
    if (n <= 0) return NULL;
    int8_t axis = depth % 2;
    qsort(props, n, sizeof(Property*), axis == 0 ? compare_lat : compare_lon);
    int32_t mid = n / 2;
    KDNode* node = malloc(sizeof(KDNode));
    node->property = props[mid];
    node->axis = axis;
    node->left = build_kd_tree(props, mid, depth + 1);
    node->right = build_kd_tree(props + mid + 1, n - mid - 1, depth + 1);
    return node;
}

/* Spatial Range Search: O(sqrt(N) + K) */
static void range_search_recursive(KDNode* root, double lat_min, double lon_min, double lat_max, double lon_max, Property*** results, int32_t* count) {
    if (!root) return;
    Property* p = root->property;
    if (p->latitude >= lat_min && p->latitude <= lat_max && p->longitude >= lon_min && p->longitude <= lon_max) {
        *results = realloc(*results, (*count + 1) * sizeof(Property*));
        (*results)[(*count)++] = p;
    }
    double val = (root->axis == 0) ? p->latitude : p->longitude;
    double min_v = (root->axis == 0) ? lat_min : lon_min;
    double max_v = (root->axis == 0) ? lat_max : lon_max;
    if (min_v <= val) range_search_recursive(root->left, lat_min, lon_min, lat_max, lon_max, results, count);
    if (max_v >= val) range_search_recursive(root->right, lat_min, lon_min, lat_max, lon_max, results, count);
}

void ds_spatial_range(PropertyEngine* engine, double lat_min, double lon_min, double lat_max, double lon_max, Property*** results, int32_t* count) {
    *results = NULL; *count = 0;
    range_search_recursive(engine->spatial_root, lat_min, lon_min, lat_max, lon_max, results, count);
}

/* Min-Heap Operations for Top-K: O(log K) */
static void heap_push(MinHeap* h, Property* p, double d2) {
    int i = h->size++;
    while (i > 0 && h->nodes[(i-1)/2].distance_sq > d2) { h->nodes[i] = h->nodes[(i-1)/2]; i = (i-1)/2; }
    h->nodes[i].property = p; h->nodes[i].distance_sq = d2;
}

static HeapNode heap_pop(MinHeap* h) {
    HeapNode root = h->nodes[0], last = h->nodes[--h->size];
    int i = 0;
    while (i*2+1 < h->size) {
        int child = i*2+1;
        if (child+1 < h->size && h->nodes[child+1].distance_sq < h->nodes[child].distance_sq) child++;
        if (last.distance_sq <= h->nodes[child].distance_sq) break;
        h->nodes[i] = h->nodes[child]; i = child;
    }
    h->nodes[i] = last; return root;
}

void ds_get_top_k_nearby(PropertyEngine* engine, double lat, double lon, int32_t k, Property*** results, int32_t* count) {
    MinHeap h = { malloc(engine->count * sizeof(HeapNode)), 0, engine->count };
    for (int i = 0; i < engine->count; i++) {
        double d2 = pow(engine->data[i].latitude - lat, 2) + pow(engine->data[i].longitude - lon, 2);
        heap_push(&h, &engine->data[i], d2);
    }
    int res_k = (k < engine->count) ? k : engine->count;
    *results = malloc(res_k * sizeof(Property*));
    for (int i = 0; i < res_k; i++) (*results)[i] = heap_pop(&h).property;
    *count = res_k; free(h.nodes);
}

/* Lifecycle & Cleanup */
static void free_kd(KDNode* n) { if (n) { free_kd(n->left); free_kd(n->right); free(n); } }
void ds_destroy_engine(PropertyEngine* engine) {
    if (!engine) return;
    free_kd(engine->spatial_root);
    for (int i=0; i<HASH_SIZE; i++) {
        HashNode* curr = engine->hash_table[i];
        while (curr) { HashNode* tmp = curr; curr = curr->next; free(tmp); }
    }
    free(engine->data); free(engine);
}
void ds_free_results(Property** results) { if (results) free(results); }
