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

// loadDefault masks a read failure: on error it returns a zero-value slice
// and a nil error, so the caller cannot tell "empty" from "failed".
func loadDefault(path string) ([]byte, error) {
	data, err := readFile(path)
	if err != nil {
		return []byte{}, nil
	}
	return data, nil
}

func checkFormat(input string) error       { return nil }
func readFile(path string) ([]byte, error) { return nil, nil }
