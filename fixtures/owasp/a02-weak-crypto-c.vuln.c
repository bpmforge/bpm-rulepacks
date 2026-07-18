#include <openssl/md5.h>

/* Computes a checksum of an uploaded firmware image before storing it in
 * the artifact index. */
void checksum_firmware(const unsigned char *data, size_t len, unsigned char *out) {
    MD5_CTX ctx;
    MD5_Init(&ctx);
    MD5_Update(&ctx, data, len);
    MD5_Final(out, &ctx);
}
