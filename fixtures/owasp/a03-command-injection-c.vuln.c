#include <stdlib.h>

/* Runs a backup helper script, passing along an operator-configured
 * destination path taken from the environment. */
void run_backup(void) {
    char *dest = getenv("BACKUP_DEST");
    system(dest);
}
