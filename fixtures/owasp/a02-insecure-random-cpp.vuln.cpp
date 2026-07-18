#include <cstdlib>
#include <ctime>

/* Generates a CSRF token embedded in each rendered form. */
int csrf_token;

void generate_csrf_token() {
    std::srand((unsigned int)std::time(nullptr));
    csrf_token = rand();
}
