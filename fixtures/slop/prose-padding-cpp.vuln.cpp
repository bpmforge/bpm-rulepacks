#include <vector>

// it should be mentioned that this sorts the vector in place
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

/* established patterns recommend caching this lookup */
int lookupCached(int key);
