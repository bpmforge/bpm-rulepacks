#include <vector>

std::vector<int> buildBuffer(size_t n) {
    // Step 1: allocate the vector
    std::vector<int> buf(n);
    // Step 2: zero it out
    for (size_t i = 0; i < n; i++) {
        buf[i] = 0;
    }
    // Step 3: return the buffer
    return buf;
}
