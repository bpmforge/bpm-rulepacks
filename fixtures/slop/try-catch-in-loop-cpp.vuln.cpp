#include <stdexcept>
#include <vector>

void processAll(const std::vector<int>& items) {
    for (size_t i = 0; i < items.size(); ++i) {
        try {
            processOne(items[i]);
        } catch (const std::exception& e) {
            logError(e);
        }
    }
}

void processOne(int item);
void logError(const std::exception& e);
