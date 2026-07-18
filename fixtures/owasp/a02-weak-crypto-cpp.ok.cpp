#include <openssl/evp.h>

/* Encrypts a session-cache entry before writing it to a local disk cache
 * file. */
void encrypt_cache_entry(EVP_CIPHER_CTX *ctx, const unsigned char *key,
                          const unsigned char *iv) {
    EVP_EncryptInit_ex(ctx, EVP_aes_256_gcm(), nullptr, key, iv);
}
