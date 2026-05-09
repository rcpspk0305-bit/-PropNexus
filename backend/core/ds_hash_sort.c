#include "ds_core.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

/* Forward declaration for spatial build */
AVLNode* ds_avl_insert(AVLNode* node, Property* p);

/* Hash Table Logic: O(1) Average Case */
static uint32_t hash_id(int32_t id) {
    return (uint32_t)id % HASH_SIZE;
}

static void hash_insert(PropertyEngine* engine, Property* p) {
    uint32_t index = hash_id(p->property_id);
    HashNode* node = malloc(sizeof(HashNode));
    node->property = p;
    node->next = engine->hash_table[index];
    engine->hash_table[index] = node;
}

Property* ds_get_by_id(PropertyEngine* engine, int32_t id) {
    uint32_t index = hash_id(id);
    HashNode* curr = engine->hash_table[index];
    while (curr) {
        if (curr->property->property_id == id) return curr->property;
        curr = curr->next;
    }
    return NULL;
}

/* Multi-criteria comparison: BHK -> Location -> Listing Type -> Furnished -> Price -> Bathrooms */
static int compare_multi(const Property* a, const Property* b) {
    if (a->bedrooms != b->bedrooms) return a->bedrooms - b->bedrooms;
    int loc_cmp = strcmp(a->location_name, b->location_name);
    if (loc_cmp != 0) return loc_cmp;
    int type_cmp = strcmp(a->description, b->description); // Listing Type
    if (type_cmp != 0) return type_cmp;
    int furn_cmp = strcmp(a->amenities, b->amenities);
    if (furn_cmp != 0) return furn_cmp;
    if (a->price != b->price) return (a->price < b->price) ? -1 : 1;
    return a->bathrooms - b->bathrooms;
}

/* Stable Merge Sort for Properties: O(N log N) */
static void merge(Property** arr, int l, int m, int r, int sort_mode) {
    int n1 = m - l + 1, n2 = r - m;
    Property **L = malloc(n1 * sizeof(Property*)), **R = malloc(n2 * sizeof(Property*));
    for (int i = 0; i < n1; i++) L[i] = arr[l + i];
    for (int j = 0; j < n2; j++) R[j] = arr[m + 1 + j];
    int i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
        bool condition;
        if (sort_mode == 3) { // Listing Type (Description)
            condition = (strcmp(L[i]->description, R[j]->description) <= 0);
        } else if (sort_mode == 2) {
            condition = (compare_multi(L[i], R[j]) <= 0);
        } else if (sort_mode == 1) { // Area Desc
            condition = (L[i]->area >= R[j]->area);
        } else { // Price Asc
            condition = (L[i]->price <= R[j]->price);
        }
        if (condition) arr[k++] = L[i++]; else arr[k++] = R[j++];
    }
    while (i < n1) arr[k++] = L[i++];
    while (j < n2) arr[k++] = R[j++];
    free(L); free(R);
}

void merge_sort(Property** arr, int l, int r, int sort_mode) {
    if (l < r) {
        int m = l + (r - l) / 2;
        merge_sort(arr, l, m, sort_mode);
        merge_sort(arr, m + 1, r, sort_mode);
        merge(arr, l, m, r, sort_mode);
    }
}

/* Filter and Sort: Now delegates to optimized AVL-based search in ds_spatial_heap.c */
extern void ds_filter_and_sort_optimized(PropertyEngine* engine, double min_p, double max_p, 
                         int32_t min_area, int32_t beds, int32_t baths, bool sort_by_price, 
                         Property*** results, int32_t* count);

void ds_filter_and_sort(PropertyEngine* engine, double min_p, double max_p, 
                        int32_t min_area, int32_t beds, int32_t baths, int32_t sort_mode, 
                        Property*** results, int32_t* count) {
    ds_filter_and_sort_optimized(engine, min_p, max_p, min_area, beds, baths, sort_mode, results, count);
}

/* Robust CSV Parsing & Engine Initialization */
static const char* parse_field(const char* line, char* out, int max_len) {
    if (!line || *line == '\0') {
        if (max_len > 0) out[0] = '\0';
        return NULL;
    }
    int i = 0; bool in_quotes = false;
    while (*line == ' ') line++;
    if (*line == '"') { in_quotes = true; line++; }
    while (*line != '\0') {
        if (in_quotes) {
            if (*line == '"') {
                if (*(line + 1) == '"') { if (i < max_len - 1) out[i++] = '"'; line += 2; continue; }
                else { in_quotes = false; line++; break; }
            }
        } else if (*line == ',') break;
        if (i < max_len - 1) out[i++] = *line; line++;
    }
    out[i] = '\0';
    while (*line != '\0' && *line != ',') line++;
    if (*line == ',') line++;
    return line;
}

PropertyEngine* ds_create_engine(const char* csv_path) {
    FILE* f = fopen(csv_path, "r");
    if (!f) return NULL;
    PropertyEngine* engine = calloc(1, sizeof(PropertyEngine));
    char line[4096], field[MAX_DESCRIPTION_LEN];
    fgets(line, sizeof(line), f); // Header
    
    while (fgets(line, sizeof(line), f)) {
        line[strcspn(line, "\r\n")] = 0;
        engine->data = realloc(engine->data, (engine->count + 1) * sizeof(Property));
        Property* p = &engine->data[engine->count];
        const char* ptr = line;
        for (int i = 0; i < 14; i++) {
            ptr = parse_field(ptr, field, sizeof(field));
            switch(i) {
                case 0: p->property_id = atoi(field); break;
                case 1: strncpy(p->title, field, MAX_TITLE_LEN-1); p->title[MAX_TITLE_LEN-1] = 0; break;
                case 2: strncpy(p->property_type, field, MAX_TYPE_LEN-1); p->property_type[MAX_TYPE_LEN-1] = 0; break;
                case 3: strncpy(p->location_name, field, MAX_LOCATION_LEN-1); p->location_name[MAX_LOCATION_LEN-1] = 0; break;
                case 6: p->price = atof(field); break;
                case 7: p->area = atoi(field); break;
                case 8: p->bedrooms = atoi(field); break;
                case 9: p->bathrooms = atoi(field); break;
                case 10: strncpy(p->amenities, field, MAX_AMENITIES_LEN-1); p->amenities[MAX_AMENITIES_LEN-1] = 0; break;
                case 11: p->latitude = atof(field); break;
                case 12: p->longitude = atof(field); break;
                case 13: strncpy(p->description, field, MAX_DESCRIPTION_LEN-1); p->description[MAX_DESCRIPTION_LEN-1] = 0; break;
            }
        }
        engine->count++;
    }
    fclose(f);

    if (engine->count > 0) {
        for (int i = 0; i < engine->count; i++) {
            Property* p = &engine->data[i];
            hash_insert(engine, p);
            engine->avl_root = ds_avl_insert(engine->avl_root, p);
        }
    }
    
    return engine;
}
