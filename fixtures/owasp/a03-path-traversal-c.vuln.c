#include <stdio.h>
#include <stdlib.h>

/* Opens a report file named by an operator-configured environment
 * variable and streams it back to the caller. */
FILE *open_report(void) {
    char *report_name = getenv("REPORT_FILE");
    return fopen(report_name, "r");
}
