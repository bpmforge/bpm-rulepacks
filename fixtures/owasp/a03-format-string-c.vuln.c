#include <stdio.h>
#include <stdlib.h>

/* Prints a startup banner that includes an operator-supplied greeting
 * pulled from an environment variable. */
void print_banner(void) {
    char *greeting = getenv("BANNER_GREETING");
    printf(greeting);
}
