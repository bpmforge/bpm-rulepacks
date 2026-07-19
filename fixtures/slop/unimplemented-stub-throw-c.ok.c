void flush_buffers(void);
void close_connections(void);

int compute_checksum(const unsigned char *data, unsigned long len) {
    unsigned int crc = 0xFFFFFFFFu;
    for (unsigned long i = 0; i < len; i++) {
        crc ^= data[i];
        for (int j = 0; j < 8; j++) {
            crc = (crc >> 1) ^ (0xEDB88320u & (~(crc & 1u) + 1u));
        }
    }
    return (int)~crc;
}

void shutdown_gracefully(void) {
    flush_buffers();
    close_connections();
}
