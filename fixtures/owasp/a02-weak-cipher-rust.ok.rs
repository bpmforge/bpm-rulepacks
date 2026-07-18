use aes_gcm::{Aes256Gcm, KeyInit};

fn encrypt_modern(key: &[u8]) -> Aes256Gcm {
    Aes256Gcm::new(key.into())
}

// CBC (not a CWE-327 broken mode) uses the two-arg KeyIvInit::new(key, iv)
// constructor, distinct from the one-arg KeyInit::new(key) shape ECB uses —
// this must stay clean so the rule doesn't over-match every Encryptor/
// Decryptor type by name alone.
fn encrypt_cbc(key: &[u8], iv: &[u8]) -> cbc::Encryptor<aes::Aes256> {
    cbc::Encryptor::<aes::Aes256>::new(key.into(), iv.into())
}
