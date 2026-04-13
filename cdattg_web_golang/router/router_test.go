package router

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/sena/cdattg-web-golang/config"
)

const (
	testPathAuthLogin = "/api/auth/login"
	testPathAuthMe    = "/api/auth/me"
)

func init() {
	// Config debe estar cargada para que el middleware CORS no haga panic (config.AppConfig.CORS).
	config.LoadConfig()
}

// TestSetupRouterCreaRouter verifica que el router se crea sin panic.
func TestSetupRouterCreaRouter(t *testing.T) {
	r := SetupRouter()
	if r == nil {
		t.Fatal("SetupRouter no debe retornar nil")
	}
}

// TestRouterPOSTAuthLoginBodyInvalidoRetorna400 verifica que POST /api/auth/login
// con body inválido o vacío retorna 400 sin necesidad de base de datos
// (falla el binding antes de llamar al servicio).
func TestRouterPOSTAuthLoginBodyInvalidoRetorna400(t *testing.T) {
	r := SetupRouter()

	tests := []struct {
		name string
		body []byte
	}{
		{"body_vacio", []byte("")},
		{"json_vacio", []byte("{}")},
		{"json_invalido", []byte("{invalid}")},
		{"sin_password", []byte(`{"email":"a@b.com"}`)},
		{"sin_email", []byte(`{"password":"secret"}`)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodPost, testPathAuthLogin, bytes.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			r.ServeHTTP(w, req)
			if w.Code != http.StatusBadRequest {
				t.Errorf("status: got %d, want %d; body: %s", w.Code, http.StatusBadRequest, w.Body.String())
			}
		})
	}
}

// TestRouterRutasAPIExisten verifica que las rutas públicas responden (no 404).
// Sin token, GET /api/auth/me debe retornar 401.
func TestRouterRutasAPIExisten(t *testing.T) {
	r := SetupRouter()
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, testPathAuthMe, nil)
	r.ServeHTTP(w, req)
	if w.Code == http.StatusNotFound {
		t.Errorf("ruta %s no debe ser 404; got %d", testPathAuthMe, w.Code)
	}
	if w.Code != http.StatusUnauthorized {
		t.Errorf("GET %s sin token: got status %d, want 401", testPathAuthMe, w.Code)
	}
}
