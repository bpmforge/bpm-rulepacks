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
