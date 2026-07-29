#include <cstdio>
#include <cstring>

/* Same append, bounded by the space actually remaining in the banner.
 * The second case pins the literal-source exclusion: a compile-time
 * constant source has a length the author already accounted for, so it
 * must NOT fire. */
void append_build_tag(const char *reported_tag) {
    char banner[32] = "firmware ";
    strncat(banner, reported_tag, sizeof(banner) - strlen(banner) - 1);
    printf("%s\n", banner);
}

void append_fixed_suffix(void) {
    char banner[32] = "firmware ";
    strcat(banner, "-release");
    printf("%s\n", banner);
}
