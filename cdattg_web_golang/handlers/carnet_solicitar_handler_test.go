/**
 * Pruebo pedir el carnet eligiendo ficha.
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func TestSolicitarMiCarnetSinFicha(t *testing.T) {
	gin.SetMode(gin.TestMode)
	pid := uint(4)
	h := NewCarnetHandlerWithService(&mockCarnetSvc{})
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/api/carnets/solicitar", strings.NewReader(`{}`))
	c.Set("user", &models.User{PersonaID: &pid})
	h.SolicitarMiCarnet(c)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("code %d", w.Code)
	}
}

func TestSolicitarMiCarnetFeliz(t *testing.T) {
	gin.SetMode(gin.TestMode)
	pid := uint(4)
	h := NewCarnetHandlerWithService(&mockCarnetSvc{resp: &dto.CarnetDigitalResponse{EstadoSolicitud: "pendiente"}})
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/api/carnets/solicitar", strings.NewReader(`{"ficha_id":52}`))
	c.Request.Header.Set("Content-Type", "application/json")
	c.Set("user", &models.User{PersonaID: &pid})
	h.SolicitarMiCarnet(c)
	if w.Code != http.StatusOK {
		t.Fatalf("code %d body %s", w.Code, w.Body.String())
	}
}
