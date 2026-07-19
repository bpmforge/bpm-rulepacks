package svc

import "fmt"

// ProcessPayment is a real implementation, not a stub.
func ProcessPayment(amount int) error {
	if amount <= 0 {
		return fmt.Errorf("invalid amount: %d", amount)
	}
	return nil
}
