package svc

import (
	"fmt"
	"os"
)

// loadConfig propagates a read failure to the caller instead of dropping it.
func loadConfig(path string) ([]byte, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("load config %s: %w", path, err)
	}
	return data, nil
}
