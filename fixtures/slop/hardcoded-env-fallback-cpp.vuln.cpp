#include <cstdlib>
#include <string>

std::string getApiToken() {
    return getenv("AUTH_TOKEN") ? getenv("AUTH_TOKEN") : "ghp_hardcoded1234567890";
}
