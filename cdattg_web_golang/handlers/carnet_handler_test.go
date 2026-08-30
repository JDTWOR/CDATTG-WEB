/**
 * Pruebo el handler del carnet: sin persona, feliz y error del servicio.
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/services"
)

type mockCarnetSvc struct {
	resp   *dto.CarnetDigitalResponse
	biblio *dto.CarnetBibliotecaResponse
	foto   *services.PersonaFotoArchivo
	err    error
}

func (m *mockCarnetSvc) ObtenerMiCarnet(uint) (*dto.CarnetDigitalResponse, error) {
	return m.resp, m.err
}
func (m *mockCarnetSvc) Solicitar(uint, uint) (*dto.CarnetDigitalResponse, error) {
	return m.resp, m.err
}
func (m *mockCarnetSvc) ListarPendientes(uint) ([]dto.CarnetPendienteItem, error) {
	return nil, m.err
}
func (m *mockCarnetSvc) Decidir(uint, uint, bool, string) error { return m.err }
func (m *mockCarnetSvc) LeerFotoPublicada(uint, uint) (*services.PersonaFotoArchivo, error) {
	return nil, m.err
}
func (m *mockCarnetSvc) LeerFotoSolicitud(uint, uint) (*services.PersonaFotoArchivo, error) {
	return nil, m.err
}
func (m *mockCarnetSvc) VerSolicitud(uint, uint) (*dto.CarnetVistaInstructor, error) {
	if m.err != nil {
		return nil, m.err
	}
	return &dto.CarnetVistaInstructor{ID: 1}, nil
}
func (m *mockCarnetSvc) ListarBiblioteca(uint) (*dto.CarnetBibliotecaResponse, error) {
	return m.biblio, m.err
}
func (m *mockCarnetSvc) ExcelBiblioteca(uint) ([]byte, error) {
	if m.err != nil {
		return nil, m.err
	}
	return []byte("xlsx"), nil
}
func (m *mockCarnetSvc) LeerFotoBiblioteca(uint) (*services.PersonaFotoArchivo, error) {
	return m.foto, m.err
}
func (m *mockCarnetSvc) LeerFotoBibliotecaPorDocumento(string) (*services.PersonaFotoArchivo, error) {
	return m.foto, m.err
}

func TestGetMiCarnetSinPersona(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewCarnetHandlerWithService(&mockCarnetSvc{})
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/carnets/mi-carnet", nil)
	c.Set("user", &models.User{})
	h.GetMiCarnet(c)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("code %d", w.Code)
	}
}

func TestGetMiCarnetFelizYError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	pid := uint(4)
	user := &models.User{PersonaID: &pid}

	h := NewCarnetHandlerWithService(&mockCarnetSvc{resp: &dto.CarnetDigitalResponse{Habilitado: true}})
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/carnets/mi-carnet", nil)
	c.Set("user", user)
	h.GetMiCarnet(c)
	if w.Code != http.StatusOK {
		t.Fatalf("feliz %d", w.Code)
	}
	var got dto.CarnetDigitalResponse
	if err := json.Unmarshal(w.Body.Bytes(), &got); err != nil || !got.Habilitado {
		t.Fatalf("body %s", w.Body.String())
	}

	hErr := NewCarnetHandlerWithService(&mockCarnetSvc{err: errors.New("falla")})
	w2 := httptest.NewRecorder()
	c2, _ := gin.CreateTestContext(w2)
	c2.Request = httptest.NewRequest(http.MethodGet, "/api/carnets/mi-carnet", nil)
	c2.Set("user", user)
	hErr.GetMiCarnet(c2)
	if w2.Code != http.StatusBadRequest {
		t.Fatalf("error %d", w2.Code)
	}
}
