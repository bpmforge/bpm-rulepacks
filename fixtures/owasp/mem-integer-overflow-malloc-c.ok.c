#include <stdlib.h>

/* Allocates a buffer for a batch of sensor readings, sized from a record
 * count and per-record size read out of an incoming message header.
 * calloc() rejects a multiplication that would overflow instead of
 * silently wrapping and returning an undersized buffer. */
void *alloc_reading_batch(size_t record_count, size_t record_size) {
    return calloc(record_count, record_size);
}

/* Both operands are compile-time integer literals — this can never
 * overflow from runtime input, so the both-constant exclusion clears it
 * even though the shape is otherwise identical to the vuln fixture. */
void *alloc_fixed_header(void) {
    return malloc(4 * 8);
}
