package integrity

import "crypto/sha256"

// Checksum hashes upload contents for a "has this file changed" integrity
// check using a collision-resistant digest.
func Checksum(data []byte) [32]byte {
	return sha256.Sum256(data)
}
