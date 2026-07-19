#include <cstdlib>
#include <optional>
#include <string>

std::optional<std::string> getApiToken() {
    const char *raw = getenv("AUTH_TOKEN");
    if (raw == nullptr) {
        return std::nullopt;
    }
    return std::string(raw);
}

std::string getListenPort() {
    return getenv("PORT") ? getenv("PORT") : "3000";
}
