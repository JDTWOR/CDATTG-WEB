/**
 * Pruebo la puerta de la impresora: sin clave, clave mala, cabecera y URL.
 *
 * @author Cristian Deysdayr Jiménez
 */
package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestRequireClaveImpresora(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("CARNET_IMPRESORA_API_KEY", "secreto-impresora")

	// Sin clave: la impresora no entra.
	if code := pingImpresora(t, "/x", nil); code != http.StatusUnauthorized {
		t.Fatalf("sin clave %d", code)
	}
	// Clave mala.
	if code := pingImpresora(t, "/x", http.Header{"X-API-Key": []string{"otra"}}); code != http.StatusUnauthorized {
		t.Fatalf("mala %d", code)
	}
	// Cabecera buena.
	if code := pingImpresora(t, "/x", http.Header{"X-API-Key": []string{"secreto-impresora"}}); code != http.StatusOK {
		t.Fatalf("cabecera %d", code)
	}
	// URL buena: algunas impresoras solo pegan la clave en el enlace de la foto.
	if code := pingImpresora(t, "/x?api_key=secreto-impresora", nil); code != http.StatusOK {
		t.Fatalf("url %d", code)
	}
}

func TestRequireClaveImpresoraApagada(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("CARNET_IMPRESORA_API_KEY", "")
	if code := pingImpresora(t, "/x?api_key=lo-que-sea", nil); code != http.StatusUnauthorized {
		t.Fatalf("apagada %d", code)
	}
}

func pingImpresora(t *testing.T, path string, hdr http.Header) int {
	t.Helper()
	r := gin.New()
	r.GET("/x", RequireClaveImpresora(), func(c *gin.Context) { c.Status(http.StatusOK) })
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, path, nil)
	for k, vs := range hdr {
		for _, v := range vs {
			req.Header.Add(k, v)
		}
	}
	r.ServeHTTP(w, req)
	return w.Code
}
