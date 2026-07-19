int writeToDisk(const char *path);

int saveConfig(const char *path) {
    int rc = writeToDisk(path);
    if (rc != 0) {
        return 0;
    }
    return 0;
}
