package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
)

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func apiError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func apiTechniquesHandler(store *TechniqueStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			writeJSON(w, http.StatusOK, store.List())
		case http.MethodPost:
			requireAdmin(func(w http.ResponseWriter, r *http.Request) {
				var t Technique
				if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
					apiError(w, http.StatusBadRequest, "JSON inválido")
					return
				}
				if err := store.Create(t); err != nil {
					status := http.StatusInternalServerError
					if errors.Is(err, errDuplicateID) || errors.Is(err, errInvalidTechnique) {
						status = http.StatusBadRequest
					}
					apiError(w, status, err.Error())
					return
				}
				writeJSON(w, http.StatusCreated, t)
			})(w, r)
		default:
			apiError(w, http.StatusMethodNotAllowed, "método no permitido")
		}
	}
}

func apiTechniqueByIDHandler(store *TechniqueStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := strings.TrimPrefix(r.URL.Path, "/api/techniques/")
		if id == "" || strings.Contains(id, "/") {
			apiError(w, http.StatusBadRequest, "id requerido")
			return
		}

		switch r.Method {
		case http.MethodGet:
			t, err := store.Get(id)
			if err != nil {
				apiError(w, http.StatusNotFound, err.Error())
				return
			}
			writeJSON(w, http.StatusOK, t)
		case http.MethodPut:
			requireAdmin(func(w http.ResponseWriter, r *http.Request) {
				var t Technique
				if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
					apiError(w, http.StatusBadRequest, "JSON inválido")
					return
				}
				if err := store.Update(id, t); err != nil {
					status := http.StatusInternalServerError
					if errors.Is(err, errNotFound) {
						status = http.StatusNotFound
					} else if errors.Is(err, errInvalidTechnique) {
						status = http.StatusBadRequest
					}
					apiError(w, status, err.Error())
					return
				}
				t.ID = id
				writeJSON(w, http.StatusOK, t)
			})(w, r)
		case http.MethodDelete:
			requireAdmin(func(w http.ResponseWriter, r *http.Request) {
				if err := store.Delete(id); err != nil {
					apiError(w, http.StatusNotFound, err.Error())
					return
				}
				w.WriteHeader(http.StatusNoContent)
			})(w, r)
		default:
			apiError(w, http.StatusMethodNotAllowed, "método no permitido")
		}
	}
}
