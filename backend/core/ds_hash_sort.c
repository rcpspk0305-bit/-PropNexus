#include "ds_core.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

/* Forward declaration for spatial build */
KDNode* build_kd_tree(Property** props, int32_t n, int8_t depth);

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

/* Stable Merge Sort for Properties: O(N log N) */
static void merge(Property** arr, int l, int m, int r, bool by_price) {
    int n1 = m - l + 1, n2 = r - m;
    Property **L = malloc(n1 * sizeof(Property*)), **R = malloc(n2 * sizeof(Property*));
    for (int i = 0; i < n1; i++) L[i] = arr[l + i];
    for (int j = 0; j < n2; j++) R[j] = arr[m + 1 + j];
    int i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
        bool condition = by_price ? (L[i]->price <= R[j]->price) : (L[i]->area >= R[j]->area);
        if (condition) arr[k++] = L[i++]; else arr[k++] = R[j++];
    }
    while (i < n1) arr[k++] = L[i++];
    while (j < n2) arr[k++] = R[j++];
    free(L); free(R);
}

static void merge_sort(Property** arr, int l, int r, bool by_price) {
    if (l < r) {
        int m = l + (r - l) / 2;
        merge_sort(arr, l, m, by_price);
        merge_sort(arr, m + 1, r, by_price);
        merge(arr, l, m, r, by_price);
    }
}

/* Multi-criteria filtering: O(N) */
void ds_filter_and_sort(PropertyEngine* engine, double min_p, double max_p, 
                        int32_t min_area, int32_t beds, int32_t baths, bool sort_by_price, 
                        Property*** results, int32_t* count) {
    Property** temp = malloc(engine->count * sizeof(Property*));
    int found = 0;
    for (int i = 0; i < engine->count; i++) {
        Property* p = &engine->data[i];
        if (p->price >= min_p && p->price <= max_p && p->area >= min_area && 
           (beds == -1 || p->bedrooms == beds) && (baths == -1 || p->bathrooms == baths)) {
            temp[found++] = p;
        }
    }
    if (found > 1) merge_sort(temp, 0, found - 1, sort_by_price);
    *results = temp;
    *count = found;
}

/* Robust CSV Parsing & Engine Initialization */
static const char* parse_field(const char* line, char* out, int max_len) {
    if (!line || *line == '\0') return NULL;
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
    Property** ptrs = NULL;
    while (fgets(line, sizeof(line), f)) {
        line[strcspn(line, "\r\n")] = 0;
        engine->data = realloc(engine->data, (engine->count + 1) * sizeof(Property));
        Property* p = &engine->data[engine->count];
        const char* ptr = line;
        for (int i = 0; i < 14; i++) {
            ptr = parse_field(ptr, field, sizeof(field));
            switch(i) {
                case 0: p->property_id = atoi(field); break;
                case 1: strncpy(p->title, field, MAX_TITLE_LEN-1); break;
                case 2: strncpy(p->property_type, field, MAX_TYPE_LEN-1); break;
                case 3: strncpy(p->location_name, field, MAX_LOCATION_LEN-1); break;
                // case 4: city (ignored)
                // case 5: state (ignored)
                case 6: p->price = atof(field); break;
                case 7: p->area = atoi(field); break;
                case 8: p->bedrooms = atoi(field); break;
                case 9: p->bathrooms = atoi(field); break;
                case 10: strncpy(p->amenities, field, MAX_AMENITIES_LEN-1); break; // Using amenities for furnishing
                case 11: p->latitude = atof(field); break;
                case 12: p->longitude = atof(field); break;
                case 13: strncpy(p->description, field, MAX_DESCRIPTION_LEN-1); break; // Using description for listing_type
            }
        }
        hash_insert(engine, p);
        ptrs = realloc(ptrs, (engine->count + 1) * sizeof(Property*));
        ptrs[engine->count++] = p;
    }
    fclose(f);
    engine->spatial_root = build_kd_tree(ptrs, engine->count, 0);
    free(ptrs);
    return engine;
}
