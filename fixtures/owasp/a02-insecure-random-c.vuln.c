#include <stdlib.h>
#include <time.h>

/* Generates a session token for a newly authenticated user. */
int session_token;

void generate_session_token(void) {
    srand((unsigned int)time(NULL));
    session_token = rand();
}
