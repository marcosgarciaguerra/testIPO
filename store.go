package main

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"sync"
)

const techniquesFile = "data/techniques.json"

var (
	errNotFound      = errors.New("technique not found")
	errDuplicateID   = errors.New("technique id already exists")
	errInvalidTechnique = errors.New("invalid technique data")
)

type TechniqueStore struct {
	mu         sync.RWMutex
	techniques []Technique
}

func defaultTechniques() []Technique {
	return []Technique{
		{
			ID:           "heuristica",
			Name:         "Evaluación Heurística",
			Introduction: "Revisión rápida por expertos con reglas de usabilidad (heurísticas de Nielsen). Ideal para detectar problemas obvios sin usuarios finales.",
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
			Introduction: "Los usuarios agrupan conceptos en categorías. Sirve para diseñar menús, etiquetas y estructura de la información antes de programar.",
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
			Introduction: "Muestras una pantalla unos segundos y preguntas qué recuerda el usuario. Comprueba si el propósito del diseño se entiende al instante.",
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
			Introduction: "El usuario piensa en voz alta mientras usa la app. Revela confusiones y expectativas que no salen en una encuesta.",
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
			Introduction: "Cuestionario estándar de 10 ítems con puntuación 0–100. Mide percepción global de usabilidad en productos ya usables.",
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
}

func NewTechniqueStore() (*TechniqueStore, error) {
	s := &TechniqueStore{}
	if err := s.load(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *TechniqueStore) load() error {
	if err := os.MkdirAll(filepath.Dir(techniquesFile), 0o755); err != nil {
		return err
	}
	data, err := os.ReadFile(techniquesFile)
	if err != nil {
		if os.IsNotExist(err) {
			s.techniques = defaultTechniques()
			return s.persist()
		}
		return err
	}
	var list []Technique
	if err := json.Unmarshal(data, &list); err != nil {
		return err
	}
	if len(list) == 0 {
		s.techniques = defaultTechniques()
		return s.persist()
	}
	s.techniques = list
	return nil
}

func (s *TechniqueStore) persist() error {
	data, err := json.MarshalIndent(s.techniques, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(techniquesFile, data, 0o644)
}

func (s *TechniqueStore) List() []Technique {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]Technique, len(s.techniques))
	copy(out, s.techniques)
	return out
}

func (s *TechniqueStore) Get(id string) (Technique, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, t := range s.techniques {
		if t.ID == id {
			return t, nil
		}
	}
	return Technique{}, errNotFound
}

func validateTechnique(t Technique) error {
	if t.ID == "" || t.Name == "" || t.Objective == "" {
		return errInvalidTechnique
	}
	return nil
}

func (s *TechniqueStore) Create(t Technique) error {
	if err := validateTechnique(t); err != nil {
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, existing := range s.techniques {
		if existing.ID == t.ID {
			return errDuplicateID
		}
	}
	s.techniques = append(s.techniques, t)
	return s.persist()
}

func (s *TechniqueStore) Update(id string, t Technique) error {
	if err := validateTechnique(t); err != nil {
		return err
	}
	t.ID = id
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, existing := range s.techniques {
		if existing.ID == id {
			s.techniques[i] = t
			return s.persist()
		}
	}
	return errNotFound
}

func (s *TechniqueStore) Delete(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i, existing := range s.techniques {
		if existing.ID == id {
			s.techniques = append(s.techniques[:i], s.techniques[i+1:]...)
			return s.persist()
		}
	}
	return errNotFound
}
