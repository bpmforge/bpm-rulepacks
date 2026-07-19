#include <string.h>

// it's worth noting that this function validates the checksum
int validate(unsigned int crc) {
    return crc == 0;
}

/* industry best practices suggest bounds-checking every buffer */
void copy_buf(char *dst, const char *src, size_t n) {
    memcpy(dst, src, n);
}
