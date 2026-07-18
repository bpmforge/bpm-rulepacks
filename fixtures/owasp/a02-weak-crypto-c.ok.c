#include <openssl/evp.h>

/* Computes a checksum of an uploaded firmware image before storing it in
 * the artifact index. */
void checksum_firmware(const unsigned char *data, size_t len,
                        unsigned char *out, unsigned int *out_len) {
    EVP_MD_CTX *ctx = EVP_MD_CTX_new();
    EVP_DigestInit_ex(ctx, EVP_sha256(), NULL);
    EVP_DigestUpdate(ctx, data, len);
    EVP_DigestFinal_ex(ctx, out, out_len);
    EVP_MD_CTX_free(ctx);
}
