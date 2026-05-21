package main

import (
	"html/template"
	"log"
	"net/http"
	"strings"
	"unicode/utf8"
)

type PageData struct {
	Techniques []Technique
}

type DetailData struct {
	Technique Technique
}

var templates *template.Template

func initialLetter(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return "?"
	}
	r, _ := utf8.DecodeRuneInString(s)
	return string(r)
}

func loadTemplates() error {
	funcMap := template.FuncMap{
		"initial": initialLetter,
	}
	var err error
	templates, err = template.New("").Funcs(funcMap).ParseGlob("templates/*.html")
	return err
}

func homeHandler(store *TechniqueStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		if err := templates.ExecuteTemplate(w, "index.html", PageData{Techniques: store.List()}); err != nil {
			log.Println("index template:", err)
			http.Error(w, "Error interno", http.StatusInternalServerError)
		}
	}
}

func detailHandler(store *TechniqueStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := strings.TrimPrefix(r.URL.Path, "/tecnicas/")
		if id == "" || strings.Contains(id, "/") {
			http.NotFound(w, r)
			return
		}
		t, err := store.Get(id)
		if err != nil {
			http.NotFound(w, r)
			return
		}
		if err := templates.ExecuteTemplate(w, "detail.html", DetailData{Technique: t}); err != nil {
			log.Println("detail template:", err)
			http.Error(w, "Error interno", http.StatusInternalServerError)
		}
	}
}

func adminPageHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/admin" {
		http.NotFound(w, r)
		return
	}
	if err := templates.ExecuteTemplate(w, "admin.html", nil); err != nil {
		log.Println("admin template:", err)
		http.Error(w, "Error interno", http.StatusInternalServerError)
	}
}

func routeAPI(w http.ResponseWriter, r *http.Request, store *TechniqueStore) {
	if r.URL.Path == "/api/techniques" {
		apiTechniquesHandler(store)(w, r)
		return
	}
	if strings.HasPrefix(r.URL.Path, "/api/techniques/") {
		apiTechniqueByIDHandler(store)(w, r)
		return
	}
	http.NotFound(w, r)
}
