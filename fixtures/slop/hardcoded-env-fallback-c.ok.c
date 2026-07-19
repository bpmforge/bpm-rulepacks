#include <stdlib.h>

const char *get_api_key(void) {
    const char *key = getenv("API_KEY");
    if (key == NULL) {
        return NULL;
    }
    return key;
}

const char *get_port(void) {
    return getenv("PORT") ?: "3000";
}
