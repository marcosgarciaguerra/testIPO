package main

import (
	"log"
	"net/http"
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

	mux := http.NewServeMux()
	mux.HandleFunc("/", homeHandler(store))
	mux.HandleFunc("/tecnicas/", detailHandler(store))
	mux.HandleFunc("/admin", adminPageHandler)
	mux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasPrefix(r.URL.Path, "/api/techniques") {
			http.NotFound(w, r)
			return
		}
		routeAPI(w, r, store)
	})

	log.Println("Servidor en http://localhost:8080")
	log.Println("Admin UI: http://localhost:8080/admin (adminipo / adminn)")
	log.Println("API: GET/POST /api/techniques · GET/PUT/DELETE /api/techniques/{id}")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
