/**
 * Pruebo que el líder pueda ver la solicitud completa.
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/models"
)

func TestVerSolicitudSinPersona(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewCarnetHandlerWithService(&mockCarnetSvc{})
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/carnets/1", nil)
	c.Set("user", &models.User{})
	h.VerSolicitud(c)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("code %d", w.Code)
	}
}
