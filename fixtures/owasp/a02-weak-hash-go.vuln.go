package integrity

import "crypto/md5"

// Checksum hashes upload contents for a "has this file changed" integrity
// check using a broken digest.
func Checksum(data []byte) [16]byte {
	return md5.Sum(data)
}
