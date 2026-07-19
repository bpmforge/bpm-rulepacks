package api

import "net/http"

var allowedOrigins = map[string]bool{
	"https://app.example.com": true,
}

func PublicHandler(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	if allowedOrigins[origin] {
		w.Header().Set("Access-Control-Allow-Origin", origin)
	}
	w.Write([]byte("ok"))
}
