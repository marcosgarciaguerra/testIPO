package main

type Technique struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Introduction string   `json:"introduction"`
	Objective    string   `json:"objective"`
	Lifecycle    string   `json:"lifecycle"`
	MethodType   string   `json:"methodType"`
	QualQuant    string   `json:"qualQuant"`
	Requirements string   `json:"requirements"`
	ImageAlt     string   `json:"imageAlt"`
	ImageURL     string   `json:"imageURL"`
	HowTo        []string `json:"howTo"`
	People       string   `json:"people"`   // 1 | 2-3 | 5+
	Modality     string   `json:"modality"` // presencial | online (comma-separated)
	Tipo         string   `json:"tipo"`     // insight | inquiry | testing
	Duration     string   `json:"duration"` // 30min | 1h | 1h+
	Results      string   `json:"results"`  // cuantitativos | cualitativos (comma-separated)
}
