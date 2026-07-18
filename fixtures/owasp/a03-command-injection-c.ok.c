#include <stdlib.h>
#include <string.h>

/* Runs a backup helper script, selecting one of two fixed, hardcoded
 * commands based on an operator-configured mode from the environment
 * (never passing the raw environment value to system() itself). */
void run_backup(void) {
    char *mode = getenv("BACKUP_MODE");
    const char *cmd;
    if (mode != NULL && strcmp(mode, "full") == 0) {
        cmd = "/usr/local/bin/backup --full";
    } else {
        cmd = "/usr/local/bin/backup --incremental";
    }
    system(cmd);
}
