#include <vector>

// insertion sort in place: O(n^2) worst case, O(n) when nearly sorted
void sortInPlace(std::vector<int>& items) {
    for (size_t i = 1; i < items.size(); i++) {
        int key = items[i];
        size_t j = i;
        while (j > 0 && items[j - 1] > key) {
            items[j] = items[j - 1];
            j--;
        }
        items[j] = key;
    }
}

/* memoized: lookupCached avoids re-computing a value already resolved this run */
int lookupCached(int key);
