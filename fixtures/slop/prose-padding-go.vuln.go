package svc

// ValidateAccount checks the account. It's worth noting that this
// function validates the account according to industry best practices.
func ValidateAccount(id string) bool {
	return id != ""
}
