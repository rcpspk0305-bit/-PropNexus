#include "ds_core.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <math.h>

/* Internal AVL Tree Node (Indexed by Price) */
typedef struct AVLNode {
    Property* prop;
    struct AVLNode *left, *right;
    int32_t height;
} AVLNode;

/* Engine implementation */
struct PropertyEngine {
    Property* data;
    int32_t count;
    AVLNode* root;
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

/* --- AVL Tree Implementation Functions --- */

static int32_t get_height(AVLNode* n) {
    return n ? n->height : 0;
}

static int32_t max(int32_t a, int32_t b) {
    return (a > b) ? a : b;
}

static AVLNode* create_avl_node(Property* p) {
    AVLNode* node = (AVLNode*)malloc(sizeof(AVLNode));
    if (!node) return NULL;
    node->prop = p;
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

static AVLNode* insert_avl(AVLNode* node, Property* p) {
    if (!node) return create_avl_node(p);

    if (p->price < node->prop->price)
        node->left = insert_avl(node->left, p);
    else
        node->right = insert_avl(node->right, p);

    node->height = 1 + max(get_height(node->left), get_height(node->right));
    int32_t balance = get_balance(node);

    // Left Left Case
    if (balance > 1 && p->price < node->left->prop->price)
        return right_rotate(node);

    // Right Right Case
    if (balance < -1 && p->price > node->right->prop->price)
        return left_rotate(node);

    // Left Right Case
    if (balance > 1 && p->price > node->left->prop->price) {
        node->left = left_rotate(node->left);
        return right_rotate(node);
    }

    // Right Left Case
    if (balance < -1 && p->price < node->right->prop->price) {
        node->right = right_rotate(node->right);
        return left_rotate(node);
    }

    return node;
}

static void avl_range_search(AVLNode* node, double min_p, double max_p, ResultBuffer* rb) {
    if (!node) return;
    if (node->prop->price > min_p)
        avl_range_search(node->left, min_p, max_p, rb);
    if (node->prop->price >= min_p && node->prop->price <= max_p)
        rb_add(rb, node->prop);
    if (node->prop->price < max_p)
        avl_range_search(node->right, min_p, max_p, rb);
}

static void free_avl_nodes(AVLNode* node) {
    if (!node) return;
    free_avl_nodes(node->left);
    free_avl_nodes(node->right);
    free(node);
}

/* --- API EXPORTS --- */

ds_status_t ds_init_engine(const char* csv_path, PropertyEngine** engine_out) {
    if (!csv_path || !engine_out) return DS_ERR_NULL_POINTER;
    FILE* f = fopen(csv_path, "r");
    if (!f) return DS_ERR_FILE_IO;
    
    PropertyEngine* engine = (PropertyEngine*)calloc(1, sizeof(PropertyEngine));
    if (!engine) { fclose(f); return DS_ERR_MALLOC_FAIL; }

    char line[4096];
    fgets(line, sizeof(line), f); // Header

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
        engine->root = insert_avl(engine->root, p);
        engine->count++;
    }
    fclose(f);
    *engine_out = engine;
    return DS_SUCCESS;
}

ds_status_t ds_range_search(PropertyEngine* engine, double lat_min, double lon_min, 
                            double lat_max, double lon_max, 
                            Property*** results, int32_t* count) {
    if (!engine || !results || !count) return DS_ERR_NULL_POINTER;
    ResultBuffer rb;
    if (rb_init(&rb) != DS_SUCCESS) return DS_ERR_MALLOC_FAIL;
    for (int i = 0; i < engine->count; i++) {
        Property* p = &engine->data[i];
        if (p->latitude >= lat_min && p->latitude <= lat_max &&
            p->longitude >= lon_min && p->longitude <= lon_max) {
            rb_add(&rb, p);
        }
    }
    *results = rb.items;
    *count = rb.size;
    return DS_SUCCESS;
}

ds_status_t ds_nearest_n(PropertyEngine* engine, double lat, double lon, int32_t n, 
                         Property*** results, int32_t* count) {
    if (!engine || !results || !count) return DS_ERR_NULL_POINTER;
    /* Simple O(N) fallback for spatial proximity */
    typedef struct {
        Property* prop;
        double dist_sq;
    } DistNode;
    
    DistNode* list = (DistNode*)malloc(engine->count * sizeof(DistNode));
    for (int32_t i = 0; i < engine->count; i++) {
        list[i].prop = &engine->data[i];
        list[i].dist_sq = pow(engine->data[i].latitude - lat, 2) + pow(engine->data[i].longitude - lon, 2);
    }
    
    // Sort array by proximity
    for (int32_t i = 0; i < engine->count - 1; i++) {
        for (int32_t j = i + 1; j < engine->count; j++) {
            if (list[i].dist_sq > list[j].dist_sq) {
                DistNode temp = list[i];
                list[i] = list[j];
                list[j] = temp;
            }
        }
    }
    
    int32_t res_count = (n < engine->count) ? n : engine->count;
    *results = (Property**)malloc(res_count * sizeof(Property*));
    *count = res_count;
    for (int32_t i = 0; i < res_count; i++) (*results)[i] = list[i].prop;
    free(list);
    return DS_SUCCESS;
}

ds_status_t ds_filter_by_price(PropertyEngine* engine, double min_p, double max_p,
                               Property*** results, int32_t* count) {
    if (!engine || !results || !count) return DS_ERR_NULL_POINTER;
    ResultBuffer rb;
    if (rb_init(&rb) != DS_SUCCESS) return DS_ERR_MALLOC_FAIL;
    avl_range_search(engine->root, min_p, max_p, &rb);
    *results = rb.items;
    *count = rb.size;
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
    free_avl_nodes(engine->root);
    free(engine->data);
    free(engine);
}
