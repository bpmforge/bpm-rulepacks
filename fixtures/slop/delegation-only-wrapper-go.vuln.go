package svc

type Dep struct{}

func (d *Dep) Close() error                             { return nil }
func (d *Dep) Fetch(id int, tag string) (string, error) { return "", nil }

// Wrapper adds a type and a call frame for zero behavior — Close just
// forwards to dep.Close with no transformation, validation, or error
// mapping.
type Wrapper struct {
	dep *Dep
}

func (w *Wrapper) Close() error {
	return w.dep.Close()
}

// Fetch forwards its arguments unchanged to the same-named dependency
// method — pure pass-through, no added logic.
func (w *Wrapper) Fetch(id int, tag string) (string, error) {
	return w.dep.Fetch(id, tag)
}

// ValueWrapper is the value-receiver shape of the same pure-forward pattern.
type ValueWrapper struct {
	dep *Dep
}

func (w ValueWrapper) Close() error {
	return w.dep.Close()
}
