package handlers

import "net/http"

type Session struct {
	Role string
}

func getSession(r *http.Request) *Session {
	return &Session{Role: "user"}
}

func AdminAction(w http.ResponseWriter, r *http.Request) {
	session := getSession(r)
	if session.Role == "admin" {
		performAdminAction(w)
		return
	}
	http.Error(w, "forbidden", http.StatusForbidden)
}

func performAdminAction(w http.ResponseWriter) {
	w.Write([]byte("done"))
}
