#include <unistd.h>

/* Launches a converter tool named on the command line to process an
 * incoming media file. */
void launch_converter(char *argv[]) {
    char *tool_path = argv[1];
    execvp(tool_path, argv);
}
