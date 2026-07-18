package files

import (
	"net/http"
	"os"
)

// DownloadHandler serves a fixed set of static assets from a hardcoded
// base directory; the request never selects the filesystem path.
func DownloadHandler(w http.ResponseWriter, r *http.Request) {
	data, err := os.ReadFile("static/readme.txt")
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	w.Write(data)
}
