#include <cstdlib>
#include <climits>

/* Grows a resizable event ring buffer to hold a larger number of
 * elements, both taken from a config-reload request. The multiplication
 * is checked for overflow before it is ever used as an allocation
 * size, and realloc() is called with the pre-validated total rather than
 * an inline multiplication. */
void *grow_event_ring(void *old_ptr, size_t new_capacity, size_t element_size) {
    if (element_size != 0 && new_capacity > SIZE_MAX / element_size) {
        return nullptr;
    }
    size_t total_size = new_capacity * element_size;
    return realloc(old_ptr, total_size);
}
