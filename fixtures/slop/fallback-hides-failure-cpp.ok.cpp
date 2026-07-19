#include <iostream>

int writeToDisk(const char *path);

int saveConfig(const char *path) {
    int rc = writeToDisk(path);
    if (rc != 0) {
        std::cerr << "failed to save config " << path << ": rc=" << rc << std::endl;
        return rc;
    }
    return 0;
}
