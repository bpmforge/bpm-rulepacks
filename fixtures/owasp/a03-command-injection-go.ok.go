package diag

import (
	"net/http"
	"os/exec"
)

// PingHandler always pings a fixed internal health-check target; request
// input never reaches the command at all.
func PingHandler(w http.ResponseWriter, r *http.Request) {
	out, err := exec.Command("ping", "-c", "1", "db-primary.internal").CombinedOutput()
	if err != nil {
		http.Error(w, "ping failed", http.StatusInternalServerError)
		return
	}
	w.Write(out)
}
