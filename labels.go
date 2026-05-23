package main

import "strings"

var (
	peopleLabels = map[string]string{
		"1":   "1",
		"2-3": "2-3",
		"5+":  "5+",
	}
	modalityLabels = map[string]string{
		"presencial": "Presencial",
		"online":     "Online",
	}
	tipoLabels = map[string]string{
		"insight": "Insight",
		"inquiry": "Inquiry",
		"testing": "Testing",
	}
	durationLabels = map[string]string{
		"30min": "30 min",
		"1h":    "1h",
		"1h+":   "1h+",
	}
	resultsLabels = map[string]string{
		"cuantitativos": "Cuantitativos",
		"cualitativos":  "Cualitativos",
	}
)

func labelPeople(v string) string {
	if l, ok := peopleLabels[v]; ok {
		return l
	}
	return v
}

func labelModality(v string) string {
	if l, ok := modalityLabels[v]; ok {
		return l
	}
	return v
}

func labelTipo(v string) string {
	if l, ok := tipoLabels[v]; ok {
		return l
	}
	return v
}

func labelDuration(v string) string {
	if l, ok := durationLabels[v]; ok {
		return l
	}
	return v
}

func labelResults(v string) string {
	if l, ok := resultsLabels[v]; ok {
		return l
	}
	return v
}

func labelCSV(mapFn func(string) string, csv string) string {
	parts := strings.Split(csv, ",")
	labels := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		labels = append(labels, mapFn(p))
	}
	return strings.Join(labels, ", ")
}

func labelModalitiesCSV(csv string) string  { return labelCSV(labelModality, csv) }
func labelResultsCSV(csv string) string     { return labelCSV(labelResults, csv) }
