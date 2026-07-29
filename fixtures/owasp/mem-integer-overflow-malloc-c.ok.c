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

/* The element-size idiom. This fixture asserted the OPPOSITE until
 * 2026-07-29 -- it sat in the .vuln file described as "exactly the
 * canonical attacker-controlled CWE-190 shape". The corpus disagreed:
 * across all 64,099 Juliet C/C++ cases this shape accounted for 100% of
 * the rule's firings and 0% of its true positives. On a 64-bit target,
 * overflowing size_t via n * sizeof(T) needs n above 2^61. Deliberately
 * clean; see packs/owasp/mem-integer-overflow-malloc.yaml. */
void *alloc_record_array(size_t count) {
    return malloc(count * sizeof(int));
}
