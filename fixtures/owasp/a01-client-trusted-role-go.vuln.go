package handlers

import "net/http"

func AdminAction(w http.ResponseWriter, r *http.Request) {
	if r.FormValue("is_admin") == "true" {
		performAdminAction(w)
		return
	}
	http.Error(w, "forbidden", http.StatusForbidden)
}

func performAdminAction(w http.ResponseWriter) {
	w.Write([]byte("done"))
}
