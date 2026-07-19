#include <stdlib.h>

// build_buffer allocates an n-element zeroed int buffer.
int *build_buffer(size_t n) {
    int *buf = calloc(n, sizeof(int));
    return buf;
}
