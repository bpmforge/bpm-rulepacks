#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* Opens one of a fixed set of report files selected by a short label
 * from an operator-configured environment variable (never using the raw
 * environment value as a filesystem path). */
FILE *open_report(void) {
    char *report_kind = getenv("REPORT_FILE");
    const char *report_path;
    if (report_kind != NULL && strcmp(report_kind, "daily") == 0) {
        report_path = "/var/reports/daily.txt";
    } else {
        report_path = "/var/reports/summary.txt";
    }
    return fopen(report_path, "r");
}
