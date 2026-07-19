#include <stdio.h>

int write_to_disk(const char *path);

int save_config(const char *path) {
    int rc = write_to_disk(path);
    if (rc != 0) {
        fprintf(stderr, "failed to save config %s: rc=%d\n", path, rc);
        return rc;
    }
    return 0;
}
