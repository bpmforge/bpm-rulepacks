#include <cstdio>

/* Reads an operator-entered PIN confirmation string from the console into
 * a fixed on-stack buffer before comparing it against the stored PIN. */
void read_pin_confirmation() {
    char confirmation[8];
    scanf("%s", confirmation);
    printf("confirmation: %s\n", confirmation);
}
