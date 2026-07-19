package svc

// ValidateAccount reports whether id is a non-empty account identifier.
func ValidateAccount(id string) bool {
	return id != ""
}
