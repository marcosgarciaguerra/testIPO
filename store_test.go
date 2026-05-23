package main

import (
	"path/filepath"
	"testing"
)

func TestTechniqueStore_CRUD(t *testing.T) {
	dir := t.TempDir()
	old := techniquesFile
	techniquesFile = filepath.Join(dir, "techniques.json")
	t.Cleanup(func() { techniquesFile = old })

	store, err := NewTechniqueStore()
	if err != nil {
		t.Fatal(err)
	}
	if len(store.List()) == 0 {
		t.Fatal("expected default techniques")
	}

	custom := Technique{
		ID:           "test-tech",
		Name:         "Test",
		Introduction: "Intro",
		Objective:    "Obj",
		Lifecycle:    "Life",
		MethodType:   "Test",
		QualQuant:    "Cual",
		Requirements: "Req",
		People:       "1",
		Modality:     "online",
		Tipo:         "inquiry",
		Duration:     "30min",
		Results:      "cualitativos",
	}
	if err := store.Create(custom); err != nil {
		t.Fatal("create:", err)
	}
	got, err := store.Get("test-tech")
	if err != nil {
		t.Fatal("get:", err)
	}
	if got.Name != "Test" {
		t.Fatalf("got name %q", got.Name)
	}

	custom.Name = "Test Updated"
	if err := store.Update("test-tech", custom); err != nil {
		t.Fatal("update:", err)
	}

	store2, err := NewTechniqueStore()
	if err != nil {
		t.Fatal("reload:", err)
	}
	reloaded, _ := store2.Get("test-tech")
	if reloaded.Name != "Test Updated" {
		t.Fatalf("persist failed: %q", reloaded.Name)
	}

	if err := store.Delete("test-tech"); err != nil {
		t.Fatal("delete:", err)
	}
	if _, err := store.Get("test-tech"); err == nil {
		t.Fatal("expected not found after delete")
	}
}

func TestValidateTechnique(t *testing.T) {
	if validateTechnique(Technique{}) == nil {
		t.Fatal("empty technique should fail")
	}
}

func TestEnrichTechniques(t *testing.T) {
	list := []Technique{{ID: "heuristica", Name: "H", Objective: "O"}}
	out := enrichTechniques(list)
	if out[0].Introduction == "" {
		t.Fatal("expected introduction from defaults")
	}
	if out[0].ImageURL == "" {
		t.Fatal("expected imageURL")
	}
}
