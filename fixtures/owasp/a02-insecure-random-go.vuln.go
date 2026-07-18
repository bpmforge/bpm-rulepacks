package tokens

import (
	"fmt"
	"math/rand"
)

// GeneratePasswordResetToken derives a "one-time" reset token from a
// non-cryptographic PRNG, making it predictable.
func GeneratePasswordResetToken() string {
	return fmt.Sprintf("%06d", rand.Intn(1000000))
}
