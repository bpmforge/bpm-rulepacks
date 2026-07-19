#include <stdlib.h>

const char *get_api_key(void) {
    return getenv("API_KEY") ?: "sk-live-hardcoded12345";
}
