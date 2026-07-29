#include <stdio.h>

/* Reads the operator's console response to a maintenance prompt into a
 * fixed on-stack buffer. gets() has no bound argument at all, so a
 * response longer than the buffer overflows it and there is no calling
 * convention that would prevent that. */
void read_maintenance_response(void) {
    char response[16];
    gets(response);
    printf("response: %s\n", response);
}
