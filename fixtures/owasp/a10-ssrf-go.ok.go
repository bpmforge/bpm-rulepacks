package fetcher

import (
	"io"
	"net/http"
)

// PreviewHandler fetches a single fixed internal health-check endpoint;
// request input never selects the outbound URL.
func PreviewHandler(w http.ResponseWriter, r *http.Request) {
	resp, err := http.Get("https://status.internal.example.com/health")
	if err != nil {
		http.Error(w, "fetch failed", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()
	io.Copy(w, resp.Body)
}
