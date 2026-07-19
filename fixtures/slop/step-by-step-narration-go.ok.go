package svc

// process transforms items into a new slice.
func process(items []string) []string {
	out := make([]string, 0, len(items))
	for _, it := range items {
		out = append(out, it)
	}
	return out
}
