#include <string>

class Store {
public:
    std::string get(const std::string& key);
};

class Cache {
public:
    explicit Cache(Store& store) : store_(store) {}

    std::string get(const std::string& key) {
        return store_.get(key);
    }

private:
    Store& store_;
};
