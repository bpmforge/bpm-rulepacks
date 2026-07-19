package svc

// validateInput propagates the formatting failure to the caller.
func validateInput(input string) error {
	err := checkFormat(input)
	if err != nil {
		return err
	}
	return nil
}

func checkFormat(input string) error { return nil }
