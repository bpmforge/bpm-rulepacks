package svc

import "fmt"

type Dep struct{}

func (d *Dep) Close() error { return nil }

// Wrapper adds a nil guard and error mapping, so Close is not pure
// delegation.
type Wrapper struct {
	dep *Dep
}

func (w *Wrapper) Close() error {
	if w.dep == nil {
		return nil
	}
	if err := w.dep.Close(); err != nil {
		return fmt.Errorf("wrapper close: %w", err)
	}
	return nil
}
