#include <fcntl.h>

/* Opens a plugin manifest file named on the command line for a plugin
 * loader. */
int open_plugin_manifest(char *argv[]) {
    char *manifest_path = argv[1];
    return open(manifest_path, O_RDONLY);
}
