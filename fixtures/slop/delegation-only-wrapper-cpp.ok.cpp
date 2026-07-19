#include <optional>
#include <string>

class Store {
public:
    std::optional<std::string> get(const std::string& key);
};

class Metrics {
public:
    void recordMiss(const std::string& key);
};

class Cache {
public:
    explicit Cache(Store& store) : store_(store) {}

    std::optional<std::string> get(const std::string& key) {
        auto v = store_.get(key);
        if (!v.has_value()) {
            metrics_.recordMiss(key);
        }
        return v;
    }

private:
    Store& store_;
    Metrics metrics_;
};
