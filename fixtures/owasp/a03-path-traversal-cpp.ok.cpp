#include <cstring>
#include <fcntl.h>

/* Opens one of a fixed set of plugin manifest files selected by a short
 * label on the command line (never opening an attacker-supplied path
 * directly). */
int open_plugin_manifest(char *argv[]) {
    char *plugin_name = argv[1];
    const char *manifest_path;
    if (plugin_name != nullptr && strcmp(plugin_name, "core") == 0) {
        manifest_path = "/etc/app/plugins/core.manifest";
    } else {
        manifest_path = "/etc/app/plugins/default.manifest";
    }
    return open(manifest_path, O_RDONLY);
}
