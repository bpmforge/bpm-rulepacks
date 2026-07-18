#include <stdlib.h>

/* Allocates a buffer for a batch of sensor readings, sized from a record
 * count and per-record size read out of an incoming message header. */
void *alloc_reading_batch(size_t record_count, size_t record_size) {
    return malloc(record_count * record_size);
}
