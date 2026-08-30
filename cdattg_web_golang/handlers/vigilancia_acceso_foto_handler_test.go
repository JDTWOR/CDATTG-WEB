/**
 * Pruebo la foto de portería: con archivo y cuando no hay.
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
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/services"
)

type mockVigAccesoFoto struct {
	foto *services.PersonaFotoArchivo
	err  error
}

func (m *mockVigAccesoFoto) Lookup(dto.AccesoLookupRequest) (*dto.AccesoLookupResponse, error) {
	return nil, m.err
}
func (m *mockVigAccesoFoto) Ingreso(dto.AccesoIngresoRequest, uint) (*dto.AccesoRegistroResponse, error) {
	return nil, m.err
}
func (m *mockVigAccesoFoto) Salida(dto.AccesoSalidaRequest, uint) (*dto.AccesoRegistroResponse, error) {
	return nil, m.err
}
func (m *mockVigAccesoFoto) ListDentro(*uint) ([]dto.AccesoDentroItem, error) { return nil, m.err }
func (m *mockVigAccesoFoto) Historial(dto.AccesoHistorialFiltros) (*dto.AccesoHistorialResponse, error) {
	return nil, m.err
}
func (m *mockVigAccesoFoto) Estadisticas(dto.AccesoHistorialFiltros) (*dto.AccesoEstadisticasResponse, error) {
	return nil, m.err
}
func (m *mockVigAccesoFoto) LeerFotoAcceso(string) (*services.PersonaFotoArchivo, error) {
	return m.foto, m.err
}

func TestVerFotoAccesoFelizYFalta(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &VigilanciaAccesoHandler{svc: &mockVigAccesoFoto{
		foto: &services.PersonaFotoArchivo{Bytes: []byte("jpg"), ContentType: "image/jpeg"},
	}}
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/vigilancia/acceso/foto?documento=1", nil)
	h.VerFotoAcceso(c)
	if w.Code != http.StatusOK {
		t.Fatalf("feliz %d", w.Code)
	}

	h = &VigilanciaAccesoHandler{svc: &mockVigAccesoFoto{err: errors.New("no")}}
	w = httptest.NewRecorder()
	c, _ = gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/vigilancia/acceso/foto?documento=9", nil)
	h.VerFotoAcceso(c)
	if w.Code != http.StatusNotFound {
		t.Fatalf("falta %d", w.Code)
	}
}
