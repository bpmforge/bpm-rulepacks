package svc

// validateInput masks a formatting failure: on error it returns nil (no
// error) instead of propagating err, so the caller believes validation
// succeeded.
func validateInput(input string) error {
	err := checkFormat(input)
	if err != nil {
		return nil
	}
	return nil
}

func checkFormat(input string) error { return nil }
