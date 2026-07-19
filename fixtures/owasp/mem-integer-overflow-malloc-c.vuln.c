#include <stdlib.h>

/* Allocates a buffer for a batch of sensor readings, sized from a record
 * count and per-record size read out of an incoming message header. */
void *alloc_reading_batch(size_t record_count, size_t record_size) {
    return malloc(record_count * record_size);
}

/* Canonical CWE-190 shape: a runtime, attacker-controlled count multiplied
 * by sizeof(T). sizeof(...) is not an integer literal, so this must still
 * fire even with the both-constant exclusion in place. */
void *alloc_record_array(size_t count) {
    return malloc(count * sizeof(int));
}
