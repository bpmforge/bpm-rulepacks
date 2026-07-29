#include <cstdio>
#include <cstring>

/* Appends a firmware build tag received from an update server onto a
 * fixed-size banner buffer. strcat() is never told the destination's
 * capacity, and the source is not a literal. */
void append_build_tag(const char *reported_tag) {
    char banner[32] = "firmware ";
    strcat(banner, reported_tag);
    printf("%s\n", banner);
}
