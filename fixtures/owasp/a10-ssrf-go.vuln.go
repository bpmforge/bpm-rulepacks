package fetcher

import (
	"io"
	"net/http"
)

// PreviewHandler fetches whatever URL the caller supplies and echoes it
// back, letting the caller reach internal-only services.
func PreviewHandler(w http.ResponseWriter, r *http.Request) {
	target := r.URL.Query().Get("url")
	resp, err := http.Get(target)
	if err != nil {
		http.Error(w, "fetch failed", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()
	io.Copy(w, resp.Body)
}
