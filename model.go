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
	Duration     string   `json:"duration"`
	Phase        string   `json:"phase"`
	Category     string   `json:"category"`
}
