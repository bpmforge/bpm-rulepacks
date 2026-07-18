#include <cstring>
#include <unistd.h>

/* Launches a converter tool selected from a fixed, hardcoded allowlist
 * keyed by a command-line format label (never executing an
 * attacker-supplied path directly). */
void launch_converter(char *argv[]) {
    char *format = argv[1];
    const char *tool_path;
    if (format != nullptr && strcmp(format, "png") == 0) {
        tool_path = "/usr/local/bin/png-converter";
    } else {
        tool_path = "/usr/local/bin/default-converter";
    }
    char *const args[] = {(char *)tool_path, nullptr};
    execvp(tool_path, args);
}
