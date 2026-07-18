#include <cstdlib>

/* Grows a resizable event ring buffer to hold a larger number of
 * elements, both taken from a config-reload request. */
void *grow_event_ring(void *old_ptr, size_t new_capacity, size_t element_size) {
    return realloc(old_ptr, new_capacity * element_size);
}
