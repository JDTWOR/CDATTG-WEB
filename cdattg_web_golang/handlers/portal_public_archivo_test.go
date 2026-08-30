/**
 * handlers: GET de imágenes del portal con extensión (.jpg).
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
)

/**
 * Comprueba que /archivos/*nombre sirve un jpg (el :nombre de gin no captura el punto).
 */
func TestArchivoPortalConExtension(t *testing.T) {
	gin.SetMode(gin.TestMode)
	tmp := t.TempDir()
	t.Chdir(tmp)
	if err := os.MkdirAll("storage/portal", 0o750); err != nil {
		t.Fatal(err)
	}
	nombre := "aabbccddeeff00112233445566778899.jpg"
	if err := os.WriteFile(filepath.Join("storage/portal", nombre), []byte("\xff\xd8\xff"), 0o640); err != nil {
		t.Fatal(err)
	}
	r := gin.New()
	h := &PortalPublicHandler{}
	r.GET("/api/public/portal/archivos/*nombre", h.Archivo)
	r.HEAD("/api/public/portal/archivos/*nombre", h.Archivo)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/public/portal/archivos/"+nombre, nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("status %d body %s", w.Code, w.Body.String())
	}
	head := httptest.NewRecorder()
	reqHead := httptest.NewRequest(http.MethodHead, "/api/public/portal/archivos/"+nombre, nil)
	r.ServeHTTP(head, reqHead)
	if head.Code != http.StatusOK {
		t.Fatalf("HEAD status %d", head.Code)
	}
}

/**
 * Nombres con barra extra o extensión prohibida no se sirven.
 */
func TestArchivoPortalNombreInvalido(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	h := &PortalPublicHandler{}
	r.GET("/api/public/portal/archivos/*nombre", h.Archivo)
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/public/portal/archivos/foto.exe", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status %d", w.Code)
	}
}
