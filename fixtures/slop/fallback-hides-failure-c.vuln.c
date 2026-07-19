int write_to_disk(const char *path);

int save_config(const char *path) {
    int rc = write_to_disk(path);
    if (rc != 0) {
        return 0;
    }
    return 0;
}
