package svc

import "fmt"

type Dep struct{}

func (d *Dep) Close() error                             { return nil }
func (d *Dep) Fetch(id int, tag string) (string, error) { return "", nil }
func (d *Dep) Shutdown() error                          { return nil }

// Wrapper adds a nil guard and error mapping, so Close is not pure
// delegation.
type Wrapper struct {
	dep   *Dep
	cache map[int]string
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

// Fetch adds a cache check before falling through to the dependency — real
// added behavior, not pure forwarding.
func (w *Wrapper) Fetch(id int, tag string) (string, error) {
	if v, ok := w.cache[id]; ok {
		return v, nil
	}
	return w.dep.Fetch(id, tag)
}

// RenamedWrapper forwards to a DIFFERENT method name on the dependency
// (Close -> Shutdown) — not a same-method-name pure forward, so this must
// stay clean even though the body is a single-statement return-and-call.
type RenamedWrapper struct {
	dep *Dep
}

func (w *RenamedWrapper) Close() error {
	return w.dep.Shutdown()
}
