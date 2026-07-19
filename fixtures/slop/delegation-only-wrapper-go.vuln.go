package svc

type Dep struct{}

func (d *Dep) Close() error { return nil }

// Wrapper adds a type and a call frame for zero behavior — Close just
// forwards to dep.Close with no transformation, validation, or error
// mapping.
type Wrapper struct {
	dep *Dep
}

func (w *Wrapper) Close() error {
	return w.dep.Close()
}
