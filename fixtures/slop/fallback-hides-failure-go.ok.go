package svc

import (
	"fmt"
	"log"
)

// validateInput propagates the formatting failure to the caller.
func validateInput(input string) error {
	err := checkFormat(input)
	if err != nil {
		return err
	}
	return nil
}

// loadConfig wraps the failure with context instead of hiding it — the
// wrapped return still carries err, so this is propagation, not a fallback.
func loadConfig(path string) ([]byte, error) {
	data, err := readFile(path)
	if err != nil {
		return nil, fmt.Errorf("load config %s: %w", path, err)
	}
	return data, nil
}

// singleValueWrap: single-return-value form of the same wrap idiom.
func singleValueWrap(path string) error {
	err := checkFormat(path)
	if err != nil {
		return fmt.Errorf("check format %s: %w", path, err)
	}
	return nil
}

// logThenReturn: err is handled (logged) then a bare zero-value return
// follows in a separate statement — not a same-block fallback.
func logThenReturn(input string) {
	err := checkFormat(input)
	if err != nil {
		log.Println(err)
	}
}

func checkFormat(input string) error       { return nil }
func readFile(path string) ([]byte, error) { return nil, nil }
