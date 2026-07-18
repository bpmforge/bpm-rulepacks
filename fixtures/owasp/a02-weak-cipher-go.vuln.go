package vault

import "crypto/des"

// EncryptLegacy encrypts a single 8-byte block with DES for a legacy
// integration that has not yet been migrated.
func EncryptLegacy(key, block []byte) ([]byte, error) {
	c, err := des.NewCipher(key)
	if err != nil {
		return nil, err
	}
	out := make([]byte, len(block))
	c.Encrypt(out, block)
	return out, nil
}
