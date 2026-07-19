#include <stdlib.h>

int *build_buffer(size_t n) {
    // Step 1: allocate the buffer
    int *buf = malloc(n * sizeof(int));
    // Step 2: zero it out
    for (size_t i = 0; i < n; i++) {
        buf[i] = 0;
    }
    // Step 3: return the buffer
    return buf;
}
