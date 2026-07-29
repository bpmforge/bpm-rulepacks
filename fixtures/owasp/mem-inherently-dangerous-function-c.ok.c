#include <stdio.h>

/* Same prompt, read with fgets(), which is told the destination size and
 * truncates instead of overflowing. */
void read_maintenance_response(void) {
    char response[16];
    if (fgets(response, sizeof(response), stdin) == NULL) {
        return;
    }
    printf("response: %s\n", response);
}
