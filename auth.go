package main

import (
	"crypto/subtle"
	"net/http"
	"os"
)

func adminCredentials() (user, pass string) {
	user = os.Getenv("ADMIN_USER")
	if user == "" {
		user = "adminipo"
	}
	pass = os.Getenv("ADMIN_PASS")
	if pass == "" {
		pass = "adminn"
	}
	return user, pass
}

func requireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		expectedUser, expectedPass := adminCredentials()
		user, pass, ok := r.BasicAuth()
		if !ok ||
			subtle.ConstantTimeCompare([]byte(user), []byte(expectedUser)) != 1 ||
			subtle.ConstantTimeCompare([]byte(pass), []byte(expectedPass)) != 1 {
			w.Header().Set("WWW-Authenticate", `Basic realm="IPO Admin"`)
			http.Error(w, "No autorizado", http.StatusUnauthorized)
			return
		}
		next(w, r)
	}
}
