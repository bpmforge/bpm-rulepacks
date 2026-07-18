#include <stdio.h>
#include <string.h>

/* Copies a device nickname reported over a serial link into a fixed
 * on-stack label buffer for display on a status panel. */
void set_device_label(const char *reported_name) {
    char label[32];
    strcpy(label, reported_name);
    printf("device label: %s\n", label);
}
