package main

import (
	"log"
	"net/http"
	"os"
	"strings"
)

func main() {
	if err := loadTemplates(); err != nil {
		log.Fatal("templates:", err)
	}

	store, err := NewTechniqueStore()
	if err != nil {
		log.Fatal("store:", err)
	}

	limiter := newIPLimiter()
	mux := http.NewServeMux()
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	mux.HandleFunc("/", homeHandler(store))
	mux.HandleFunc("/tecnicas/", detailHandler(store))
	mux.HandleFunc("/admin", adminPageHandler)
	mux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasPrefix(r.URL.Path, "/api/techniques") {
			http.NotFound(w, r)
			return
		}
		routeAPI(w, r, store, limiter)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	addr := ":" + port
	log.Println("Servidor en http://localhost" + addr)
	log.Println("Admin: http://localhost" + addr + "/admin (ADMIN_USER / ADMIN_PASS env)")
	log.Fatal(http.ListenAndServe(addr, mux))
}
