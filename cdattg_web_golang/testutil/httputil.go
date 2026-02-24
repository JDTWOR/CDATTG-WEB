package testutil

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

// RequestJSON crea un http.Request con body JSON para tests.
func RequestJSON(method, path string, body interface{}) *http.Request {
	var bodyReader io.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		bodyReader = bytes.NewReader(b)
	}
	req := httptest.NewRequest(method, path, bodyReader)
	req.Header.Set("Content-Type", "application/json")
	return req
}

// RequestWithBody crea un http.Request con body raw (para JSON inválido, etc.).
func RequestWithBody(method, path string, rawBody []byte, contentType string) *http.Request {
	req := httptest.NewRequest(method, path, bytes.NewReader(rawBody))
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	return req
}

// GinContext crea un gin.Context de test con el request dado.
func GinContext(w *httptest.ResponseRecorder, req *http.Request) *gin.Context {
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	return c
}

// RecorderAndContext devuelve un ResponseRecorder y un gin.Context listos para ejecutar un handler.
func RecorderAndContext(method, path string, body interface{}) (*httptest.ResponseRecorder, *gin.Context) {
	w := httptest.NewRecorder()
	req := RequestJSON(method, path, body)
	c := GinContext(w, req)
	return w, c
}

// AssertStatus verifica el código HTTP y falla el test si no coincide.
func AssertStatus(t *testing.T, w *httptest.ResponseRecorder, expected int) {
	t.Helper()
	if w.Code != expected {
		t.Errorf("status: got %d, want %d; body: %s", w.Code, expected, w.Body.String())
	}
}

// DecodeJSON decodifica el body de la respuesta en v. Fallo del test si hay error.
func DecodeJSON(t *testing.T, w *httptest.ResponseRecorder, v interface{}) {
	t.Helper()
	if err := json.NewDecoder(w.Body).Decode(v); err != nil {
		t.Fatalf("decode response JSON: %v; body: %s", err, w.Body.String())
	}
}

// AssertJSONKey verifica que el body JSON contenga la clave con el valor esperado (string).
func AssertJSONKey(t *testing.T, w *httptest.ResponseRecorder, key, expected string) {
	t.Helper()
	var m map[string]interface{}
	DecodeJSON(t, w, &m)
	if got, ok := m[key].(string); !ok || got != expected {
		t.Errorf("JSON[%q]: got %v, want %q", key, m[key], expected)
	}
}
