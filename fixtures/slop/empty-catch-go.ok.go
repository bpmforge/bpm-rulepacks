package svc

import (
	"fmt"
	"log"
	"os"
)

// loadConfigPropagate propagates a read failure to the caller instead of
// dropping it.
func loadConfigPropagate(path string) ([]byte, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("load config %s: %w", path, err)
	}
	return data, nil
}

// loadConfigLog handles a read failure by logging it with context before
// falling back to an explicit, intentional zero value.
func loadConfigLog(path string) []byte {
	data, err := os.ReadFile(path)
	if err != nil {
		log.Printf("load config %s: %v", path, err)
	}
	return data
}

// loadConfigBare propagates the bare error unchanged.
func loadConfigBare(path string) ([]byte, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return data, err
	}
	return data, nil
}

// mustLoadConfig handles the failure by terminating instead of silently
// continuing with bad state.
func mustLoadConfig(path string) []byte {
	data, err := os.ReadFile(path)
	if err != nil {
		panic(fmt.Sprintf("load config %s: %v", path, err))
	}
	return data
}
