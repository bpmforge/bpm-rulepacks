package svc

import "os"

// loadConfig swallows a read failure: the empty if-block drops err with no
// caller notification, and data is whatever os.ReadFile happened to leave
// on the stack when it failed.
func loadConfig(path string) []byte {
	data, err := os.ReadFile(path)
	if err != nil {
	}
	return data
}

// loadConfigCommented swallows the same failure — a bare comment inside the
// block is not handling, it's the empty-catch shape wearing a fig leaf.
func loadConfigCommented(path string) []byte {
	data, err := os.ReadFile(path)
	if err != nil {
		// ignore
	}
	return data
}

// discardAssign swallows the error via a blank assignment instead of an
// empty if-block — same drop, different spelling.
func discardAssign(path string) []byte {
	data, err := os.ReadFile(path)
	_ = err
	return data
}

// discardCall swallows both return values of a call that returns (T, error).
func discardCall(path string) {
	_, _ = os.ReadFile(path)
}
