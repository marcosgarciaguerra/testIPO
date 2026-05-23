package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"
)

func testStore(t *testing.T) *TechniqueStore {
	t.Helper()
	dir := t.TempDir()
	old := techniquesFile
	techniquesFile = filepath.Join(dir, "techniques.json")
	t.Cleanup(func() { techniquesFile = old })
	store, err := NewTechniqueStore()
	if err != nil {
		t.Fatal(err)
	}
	return store
}

func TestAPI_GetTechniquesPublic(t *testing.T) {
	store := testStore(t)
	limiter := newIPLimiter()
	req := httptest.NewRequest(http.MethodGet, "/api/techniques", nil)
	rec := httptest.NewRecorder()
	apiTechniquesHandler(store, limiter)(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d", rec.Code)
	}
	var list []Technique
	if err := json.NewDecoder(rec.Body).Decode(&list); err != nil {
		t.Fatal(err)
	}
	if len(list) == 0 {
		t.Fatal("empty list")
	}
}

func TestAPI_PostWithoutAuth(t *testing.T) {
	store := testStore(t)
	limiter := newIPLimiter()
	body := bytes.NewBufferString(`{"id":"x","name":"X","objective":"O","introduction":"I","lifecycle":"L","methodType":"M","qualQuant":"Q","requirements":"R","duration":"poco","phase":"idea","category":"observacion"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/techniques", body)
	rec := httptest.NewRecorder()
	apiTechniquesHandler(store, limiter)(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestAPI_PostWithAuth(t *testing.T) {
	store := testStore(t)
	limiter := newIPLimiter()
	t.Setenv("ADMIN_USER", "adminipo")
	t.Setenv("ADMIN_PASS", "adminn")

	payload, _ := json.Marshal(Technique{
		ID: "api-test", Name: "API Test", Introduction: "i", Objective: "o",
		Lifecycle: "l", MethodType: "m", QualQuant: "q", Requirements: "r",
		People: "1", Modality: "online", Tipo: "inquiry", Duration: "30min", Results: "cualitativos",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/techniques", bytes.NewReader(payload))
	req.SetBasicAuth("adminipo", "adminn")
	rec := httptest.NewRecorder()
	apiTechniquesHandler(store, limiter)(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d body %s", rec.Code, rec.Body.String())
	}
}
