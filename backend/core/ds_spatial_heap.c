#include "ds_core.h"
#include <stdlib.h>
#include <math.h>

/* --- AVL Tree Implementation (Indexing by Price) --- */

static int32_t get_height(AVLNode* n) {
    return n ? n->height : 0;
}

static int32_t max(int32_t a, int32_t b) {
    return (a > b) ? a : b;
}

static AVLNode* create_node(Property* p) {
    AVLNode* node = (AVLNode*)malloc(sizeof(AVLNode));
    node->property = p;
    node->left = node->right = NULL;
    node->height = 1;
    return node;
}

static AVLNode* right_rotate(AVLNode* y) {
    AVLNode* x = y->left;
    AVLNode* T2 = x->right;
    x->right = y;
    y->left = T2;
    y->height = max(get_height(y->left), get_height(y->right)) + 1;
    x->height = max(get_height(x->left), get_height(x->right)) + 1;
    return x;
}

static AVLNode* left_rotate(AVLNode* x) {
    AVLNode* y = x->right;
    AVLNode* T2 = y->left;
    y->left = x;
    x->right = T2;
    x->height = max(get_height(x->left), get_height(x->right)) + 1;
    y->height = max(get_height(y->left), get_height(y->right)) + 1;
    return y;
}

static int32_t get_balance(AVLNode* n) {
    return n ? get_height(n->left) - get_height(n->right) : 0;
}

AVLNode* ds_avl_insert(AVLNode* node, Property* p) {
    if (!node) return create_node(p);

    if (p->price < node->property->price)
        node->left = ds_avl_insert(node->left, p);
    else
        node->right = ds_avl_insert(node->right, p);

    node->height = 1 + max(get_height(node->left), get_height(node->right));
    int32_t balance = get_balance(node);

    // Left Left
    if (balance > 1 && p->price < node->left->property->price)
        return right_rotate(node);
    // Right Right
    if (balance < -1 && p->price > node->right->property->price)
        return left_rotate(node);
    // Left Right
    if (balance > 1 && p->price > node->left->property->price) {
        node->left = left_rotate(node->left);
        return right_rotate(node);
    }
    // Right Left
    if (balance < -1 && p->price < node->right->property->price) {
        node->right = right_rotate(node->right);
        return left_rotate(node);
    }
    return node;
}

/* --- Spatial & Heap Logic --- */

void ds_spatial_range(PropertyEngine* engine, double lat_min, double lon_min, double lat_max, double lon_max, Property*** results, int32_t* count) {
    /* Since K-D Tree is replaced by Price-AVL, we fallback to O(N) scan for spatial ranges */
    *results = NULL; *count = 0;
    for (int i = 0; i < engine->count; i++) {
        Property* p = &engine->data[i];
        if (p->latitude >= lat_min && p->latitude <= lat_max && p->longitude >= lon_min && p->longitude <= lon_max) {
            *results = realloc(*results, (*count + 1) * sizeof(Property*));
            (*results)[(*count)++] = p;
        }
    }
}

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

static void avl_filter_recursive(AVLNode* root, double min_p, double max_p, int32_t min_area, int32_t beds, int32_t baths, Property** results, int32_t* count) {
    if (!root) return;
    if (root->property->price > min_p)
        avl_filter_recursive(root->left, min_p, max_p, min_area, beds, baths, results, count);
    
    if (root->property->price >= min_p && root->property->price <= max_p) {
        Property* p = root->property;
        if (p->area >= min_area && (beds == -1 || p->bedrooms == beds) && (baths == -1 || p->bathrooms == baths)) {
            results[(*count)++] = p;
        }
    }
    
    if (root->property->price < max_p)
        avl_filter_recursive(root->right, min_p, max_p, min_area, beds, baths, results, count);
}

void ds_filter_and_sort_optimized(PropertyEngine* engine, double min_p, double max_p, 
                         int32_t min_area, int32_t beds, int32_t baths, int32_t sort_mode, 
                         Property*** results, int32_t* count) {
    Property** temp = malloc(engine->count * sizeof(Property*));
    int found = 0;
    avl_filter_recursive(engine->avl_root, min_p, max_p, min_area, beds, baths, temp, &found);
    
    /* External sort call with sort_mode support */
    extern void merge_sort(Property** arr, int l, int r, int sort_mode);
    if (found > 1) merge_sort(temp, 0, found - 1, sort_mode);
    
    *results = temp;
    *count = found;
}

/* Lifecycle */
static void free_avl(AVLNode* n) { if (n) { free_avl(n->left); free_avl(n->right); free(n); } }
void ds_destroy_engine(PropertyEngine* engine) {
    if (!engine) return;
    free_avl(engine->avl_root);
    for (int i=0; i<HASH_SIZE; i++) {
        HashNode* curr = engine->hash_table[i];
        while (curr) { HashNode* tmp = curr; curr = curr->next; free(tmp); }
    }
    free(engine->data); free(engine);
}
void ds_free_results(Property** results) { if (results) free(results); }
