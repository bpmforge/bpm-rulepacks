package tokens

import (
	"crypto/rand"
	"encoding/hex"
)

// GeneratePasswordResetToken derives a one-time reset token from a
// cryptographically secure random source.
func GeneratePasswordResetToken() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
