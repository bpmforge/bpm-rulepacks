package svc

// process transforms items into a new slice.
func process(items []string) []string {
	// Step 1: validate the input
	// Step 2: transform each item
	// Step 3: return the result
	out := make([]string, 0, len(items))
	for _, it := range items {
		out = append(out, it)
	}
	return out
}
