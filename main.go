package main

import (
	"html/template"
	"log"
	"net/http"
	"strings"
	"unicode/utf8"
)

type Technique struct {
	ID           string
	Name         string
	Objective    string
	Lifecycle    string
	MethodType   string
	QualQuant    string
	Requirements string
	ImageAlt     string
	Duration     string // poco | medio | mucho
	Phase        string // comma-separated: idea,diseño,producto
	Category     string // cuestionarios | observacion | opiniones
}

type PageData struct {
	Techniques []Technique
}

// Filter facets derived from technique descriptions in the project brief.
var techniques = []Technique{
	{
		ID:           "heuristica",
		Name:         "Evaluación Heurística",
		Objective:    "Expertos analizan el sistema según principios de usabilidad para predecir y detectar problemas evidentes.",
		Lifecycle:    "Desde diseño temprano hasta sistemas funcionales.",
		MethodType:   "Inspection method",
		QualQuant:    "Cualitativo",
		Requirements: "1 a 2 horas, 3–5 evaluadores expertos.",
		ImageAlt:     "Evaluación heurística de usabilidad",
		Duration:     "poco",
		Phase:        "idea,diseño,producto",
		Category:     "observacion",
	},
	{
		ID:           "card-sorting",
		Name:         "Card Sorting",
		Objective:    "Usuarios organizan tarjetas en categorías para mejorar la arquitectura de la información.",
		Lifecycle:    "Fase inicial de toma de requisitos.",
		MethodType:   "Inquiry method",
		QualQuant:    "Cualitativo y cuantitativo",
		Requirements: "15 a 30 usuarios representativos.",
		ImageAlt:     "Card sorting para arquitectura de información",
		Duration:     "mucho",
		Phase:        "idea",
		Category:     "opiniones",
	},
	{
		ID:           "cinco-segundos",
		Name:         "Test de los 5 Segundos",
		Objective:    "Medir primeras impresiones para saber si el diseño comunica su propósito inmediatamente.",
		Lifecycle:    "Diseño visual y mockups.",
		MethodType:   "Inquiry method",
		QualQuant:    "Cuantitativo",
		Requirements: "Menos de 5 minutos.",
		ImageAlt:     "Test de los cinco segundos",
		Duration:     "poco",
		Phase:        "diseño",
		Category:     "observacion",
	},
	{
		ID:           "think-aloud",
		Name:         "Protocolo Think Aloud",
		Objective:    "Usuarios utilizan el sistema mientras expresan en voz alta lo que piensan.",
		Lifecycle:    "Prototipos o primeras versiones funcionales.",
		MethodType:   "Testing method",
		QualQuant:    "Cualitativo",
		Requirements: "30–45 minutos, 5–8 usuarios.",
		ImageAlt:     "Protocolo think aloud",
		Duration:     "medio",
		Phase:        "diseño",
		Category:     "observacion",
	},
	{
		ID:           "sus",
		Name:         "Cuestionario SUS (System Usability Scale)",
		Objective:    "Evaluar la percepción subjetiva y satisfacción mediante un cuestionario estandarizado.",
		Lifecycle:    "Pruebas funcionales o validación post-lanzamiento.",
		MethodType:   "Inquiry method",
		QualQuant:    "Cuantitativo",
		Requirements: "2 a 5 minutos, idealmente más de 30 usuarios.",
		ImageAlt:     "Cuestionario SUS de usabilidad",
		Duration:     "poco",
		Phase:        "producto",
		Category:     "cuestionarios",
	},
}

var indexTmpl *template.Template

func initialLetter(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return "?"
	}
	r, _ := utf8.DecodeRuneInString(s)
	return string(r)
}

func init() {
	funcMap := template.FuncMap{
		"initial": initialLetter,
	}
	var err error
	indexTmpl, err = template.New("index.html").Funcs(funcMap).ParseFiles("templates/index.html")
	if err != nil {
		log.Fatal("parse template:", err)
	}
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	if err := indexTmpl.Execute(w, PageData{Techniques: techniques}); err != nil {
		log.Println("execute template:", err)
		http.Error(w, "Error interno del servidor", http.StatusInternalServerError)
	}
}

func main() {
	http.HandleFunc("/", homeHandler)
	log.Println("Servidor en http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
