#include <stdexcept>
#include <vector>

void processAll(const std::vector<int>& items) {
    try {
        for (size_t i = 0; i < items.size(); ++i) {
            processOne(items[i]);
        }
    } catch (const std::exception& e) {
        logError(e);
    }
}

void processOne(int item);
void logError(const std::exception& e);
