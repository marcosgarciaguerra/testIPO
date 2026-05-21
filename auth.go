package main

import (
	"crypto/subtle"
	"net/http"
)

const (
	adminUser = "adminipo"
	adminPass = "adminn"
)

func requireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user, pass, ok := r.BasicAuth()
		if !ok ||
			subtle.ConstantTimeCompare([]byte(user), []byte(adminUser)) != 1 ||
			subtle.ConstantTimeCompare([]byte(pass), []byte(adminPass)) != 1 {
			w.Header().Set("WWW-Authenticate", `Basic realm="IPO Admin"`)
			http.Error(w, "No autorizado", http.StatusUnauthorized)
			return
		}
		next(w, r)
	}
}
