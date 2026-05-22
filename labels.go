package main

import "strings"

var (
	durationLabels = map[string]string{
		"poco":  "Poco (<1 día)",
		"medio": "Medio (varios días)",
		"mucho": "Mucho (semanas)",
	}
	phaseLabels = map[string]string{
		"idea":     "Idea inicial",
		"diseño":   "Diseño (prototipo)",
		"producto": "Producto ya desarrollado",
	}
	categoryLabels = map[string]string{
		"cuestionarios": "Cuestionarios",
		"observacion":   "Observación directa",
		"opiniones":     "Opiniones / entrevistas",
	}
)

func labelDuration(v string) string {
	if l, ok := durationLabels[v]; ok {
		return l
	}
	return v
}

func labelCategory(v string) string {
	if l, ok := categoryLabels[v]; ok {
		return l
	}
	return v
}

func labelPhase(v string) string {
	if l, ok := phaseLabels[v]; ok {
		return l
	}
	return v
}

func labelPhasesCSV(csv string) string {
	parts := strings.Split(csv, ",")
	labels := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		labels = append(labels, labelPhase(p))
	}
	return strings.Join(labels, ", ")
}
