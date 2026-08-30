/**
 * Pruebo la foto de la impresora: con cédula y cuando no hay.
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/services"
)

func TestVerFotoImpresoraFelizYFalta(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewCarnetHandlerWithService(&mockCarnetSvc{
		foto: &services.PersonaFotoArchivo{Bytes: []byte("jpg"), ContentType: "image/jpeg"},
	})
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/impresora/carnets/foto?documento=1", nil)
	h.VerFotoImpresora(c)
	if w.Code != http.StatusOK {
		t.Fatalf("feliz %d", w.Code)
	}

	h = NewCarnetHandlerWithService(&mockCarnetSvc{err: errors.New("no")})
	w = httptest.NewRecorder()
	c, _ = gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/impresora/carnets/foto?documento=9", nil)
	h.VerFotoImpresora(c)
	if w.Code != http.StatusNotFound {
		t.Fatalf("falta %d", w.Code)
	}
}
