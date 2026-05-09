#include "ds_core.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <math.h>

/* Internal K-D Tree node */
typedef struct KDNode {
    Property* prop;
    struct KDNode *left, *right;
    int8_t axis;
} KDNode;

/* Engine implementation */
struct PropertyEngine {
    Property* data;
    int32_t count;
    KDNode* root;
};

/* Result Buffer (Vector Pattern) for O(1) amortized growth */
typedef struct {
    Property** items;
    int32_t size;
    int32_t capacity;
} ResultBuffer;

static ds_status_t rb_init(ResultBuffer* rb) {
    rb->capacity = 32;
    rb->size = 0;
    rb->items = (Property**)malloc(rb->capacity * sizeof(Property*));
    return rb->items ? DS_SUCCESS : DS_ERR_MALLOC_FAIL;
}

static ds_status_t rb_add(ResultBuffer* rb, Property* item) {
    if (rb->size >= rb->capacity) {
        int32_t new_cap = rb->capacity * 2;
        Property** new_items = (Property**)realloc(rb->items, new_cap * sizeof(Property*));
        if (!new_items) return DS_ERR_MALLOC_FAIL;
        rb->items = new_items;
        rb->capacity = new_cap;
    }
    rb->items[rb->size++] = item;
    return DS_SUCCESS;
}

/* 
 * Robust CSV Parsing logic 
 */
static const char* parse_field(const char* line, char* out, int max_len) {
    if (!line || *line == '\0') return NULL;
    int i = 0;
    bool in_quotes = false;
    while (*line == ' ') line++;
    if (*line == '"') { in_quotes = true; line++; }
    while (*line != '\0') {
        if (in_quotes) {
            if (*line == '"') {
                if (*(line + 1) == '"') { // Escaped
                    if (i < max_len - 1) out[i++] = '"';
                    line += 2; continue;
                } else { in_quotes = false; line++; break; }
            }
        } else {
            if (*line == ',') break;
        }
        if (i < max_len - 1) out[i++] = *line;
        line++;
    }
    out[i] = '\0';
    while (*line != '\0' && *line != ',') line++;
    if (*line == ',') line++;
    return line;
}

/* K-D Tree Construction */
static int compare_lat(const void* a, const void* b) {
    double diff = (*(Property**)a)->latitude - (*(Property**)b)->latitude;
    return (diff > 0) - (diff < 0);
}

static int compare_lon(const void* a, const void* b) {
    double diff = (*(Property**)a)->longitude - (*(Property**)b)->longitude;
    return (diff > 0) - (diff < 0);
}

static KDNode* build_recursive(Property** props, int32_t n, int8_t depth) {
    if (n <= 0) return NULL;
    int8_t axis = depth % 2;
    qsort(props, n, sizeof(Property*), axis == 0 ? compare_lat : compare_lon);
    int32_t mid = n / 2;
    KDNode* node = (KDNode*)malloc(sizeof(KDNode));
    if (!node) return NULL;
    node->prop = props[mid];
    node->axis = axis;
    node->left = build_recursive(props, mid, depth + 1);
    node->right = build_recursive(props + mid + 1, n - mid - 1, depth + 1);
    return node;
}

static void free_kd_nodes(KDNode* node) {
    if (!node) return;
    free_kd_nodes(node->left);
    free_kd_nodes(node->right);
    free(node);
}

/* Range Search logic */
static void range_search_recursive(KDNode* node, double lat_min, double lon_min, 
                                   double lat_max, double lon_max, ResultBuffer* rb) {
    if (!node) return;
    Property* p = node->prop;
    if (p->latitude >= lat_min && p->latitude <= lat_max &&
        p->longitude >= lon_min && p->longitude <= lon_max) {
        rb_add(rb, p);
    }
    double val = (node->axis == 0) ? p->latitude : p->longitude;
    double min_b = (node->axis == 0) ? lat_min : lon_min;
    double max_b = (node->axis == 0) ? lat_max : lon_max;
    if (min_b <= val) range_search_recursive(node->left, lat_min, lon_min, lat_max, lon_max, rb);
    if (max_b >= val) range_search_recursive(node->right, lat_min, lon_min, lat_max, lon_max, rb);
}

/* NN Search logic */
typedef struct {
    Property* prop;
    double dist_sq;
} BestNode;

static void nn_recursive(KDNode* root, double lat, double lon, int32_t n, BestNode* best, int32_t* found) {
    if (!root) return;
    double d2 = pow(root->prop->latitude - lat, 2) + pow(root->prop->longitude - lon, 2);
    int32_t i;
    for (i = 0; i < *found; i++) { if (d2 < best[i].dist_sq) break; }
    if (i < n) {
        if (*found < n) (*found)++;
        for (int32_t j = *found - 1; j > i; j--) best[j] = best[j-1];
        best[i].prop = root->prop; best[i].dist_sq = d2;
    }
    double diff = (root->axis == 0) ? (lat - root->prop->latitude) : (lon - root->prop->longitude);
    KDNode *near = (diff < 0) ? root->left : root->right;
    KDNode *far = (diff < 0) ? root->right : root->left;
    nn_recursive(near, lat, lon, n, best, found);
    if (*found < n || (diff * diff) < best[*found - 1].dist_sq) nn_recursive(far, lat, lon, n, best, found);
}

/* API EXPORTS */

ds_status_t ds_init_engine(const char* csv_path, PropertyEngine** engine_out) {
    if (!csv_path || !engine_out) return DS_ERR_NULL_POINTER;
    FILE* f = fopen(csv_path, "r");
    if (!f) return DS_ERR_FILE_IO;
    
    PropertyEngine* engine = (PropertyEngine*)calloc(1, sizeof(PropertyEngine));
    if (!engine) { fclose(f); return DS_ERR_MALLOC_FAIL; }

    char line[4096];
    fgets(line, sizeof(line), f); // Header

    Property** temp_ptrs = NULL;
    char field[1024];

    while (fgets(line, sizeof(line), f)) {
        line[strcspn(line, "\r\n")] = 0;
        engine->data = (Property*)realloc(engine->data, (engine->count + 1) * sizeof(Property));
        Property* p = &engine->data[engine->count];
        const char* ptr = line;
        for (int i = 0; i < 11; i++) {
            ptr = parse_field(ptr, field, sizeof(field));
            switch(i) {
                case 0: p->id = atoi(field); break;
                case 1: strncpy(p->address, field, 255); break;
                case 2: strncpy(p->city, field, 63); break;
                case 3: strncpy(p->property_type, field, 31); break;
                case 4: p->latitude = atof(field); break;
                case 5: p->longitude = atof(field); break;
                case 6: p->price = atof(field); break;
                case 7: p->bedrooms = atoi(field); break;
                case 8: p->area_sqft = atoi(field); break;
                case 9: strncpy(p->amenities, field, 511); break;
                case 10: strncpy(p->description, field, 1023); break;
            }
        }
        temp_ptrs = (Property**)realloc(temp_ptrs, (engine->count + 1) * sizeof(Property*));
        temp_ptrs[engine->count++] = p;
    }
    fclose(f);
    engine->root = build_recursive(temp_ptrs, engine->count, 0);
    free(temp_ptrs);
    *engine_out = engine;
    return DS_SUCCESS;
}

ds_status_t ds_range_search(PropertyEngine* engine, double lat_min, double lon_min, 
                            double lat_max, double lon_max, 
                            Property*** results, int32_t* count) {
    if (!engine || !results || !count) return DS_ERR_NULL_POINTER;
    ResultBuffer rb;
    if (rb_init(&rb) != DS_SUCCESS) return DS_ERR_MALLOC_FAIL;
    range_search_recursive(engine->root, lat_min, lon_min, lat_max, lon_max, &rb);
    *results = rb.items;
    *count = rb.size;
    return DS_SUCCESS;
}

ds_status_t ds_nearest_n(PropertyEngine* engine, double lat, double lon, int32_t n, 
                         Property*** results, int32_t* count) {
    if (!engine || !results || !count) return DS_ERR_NULL_POINTER;
    BestNode* best = (BestNode*)malloc(n * sizeof(BestNode));
    int32_t found = 0;
    nn_recursive(engine->root, lat, lon, n, best, &found);
    *results = (Property**)malloc(found * sizeof(Property*));
    *count = found;
    for (int32_t i = 0; i < found; i++) (*results)[i] = best[i].prop;
    free(best);
    return DS_SUCCESS;
}

ds_status_t ds_filter_by_price(PropertyEngine* engine, double min_p, double max_p,
                               Property*** results, int32_t* count) {
    if (!engine || !results || !count) return DS_ERR_NULL_POINTER;
    ResultBuffer rb;
    rb_init(&rb);
    for (int32_t i = 0; i < engine->count; i++) {
        if (engine->data[i].price >= min_p && engine->data[i].price <= max_p) rb_add(&rb, &engine->data[i]);
    }
    *results = rb.items; *count = rb.size;
    return DS_SUCCESS;
}

ds_status_t ds_get_all(PropertyEngine* engine, Property*** results, int32_t* count) {
    if (!engine || !results || !count) return DS_ERR_NULL_POINTER;
    *results = (Property**)malloc(engine->count * sizeof(Property*));
    *count = engine->count;
    for (int32_t i = 0; i < engine->count; i++) (*results)[i] = &engine->data[i];
    return DS_SUCCESS;
}

ds_status_t ds_free_results(Property** results) {
    if (results) free(results);
    return DS_SUCCESS;
}

void ds_destroy_engine(PropertyEngine* engine) {
    if (!engine) return;
    free_kd_nodes(engine->root);
    free(engine->data);
    free(engine);
}
