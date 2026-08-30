/**
 * Pruebo el listado y la foto de biblioteca: feliz y error.
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
	"github.com/sena/cdattg-web-golang/services"
)

func TestListarBibliotecaFelizYError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewCarnetHandlerWithService(&mockCarnetSvc{
		biblio: &dto.CarnetBibliotecaResponse{Items: []dto.CarnetBibliotecaItem{{ID: 3}}},
	})
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/carnets/biblioteca", nil)
	h.ListarBiblioteca(c)
	if w.Code != http.StatusOK {
		t.Fatalf("feliz %d", w.Code)
	}
	var got dto.CarnetBibliotecaResponse
	if err := json.Unmarshal(w.Body.Bytes(), &got); err != nil || len(got.Items) != 1 {
		t.Fatalf("body %s", w.Body.String())
	}

	h = NewCarnetHandlerWithService(&mockCarnetSvc{err: errors.New("falló")})
	w = httptest.NewRecorder()
	c, _ = gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/carnets/biblioteca", nil)
	h.ListarBiblioteca(c)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("error %d", w.Code)
	}
}

func TestVerFotoBibliotecaFelizYFalta(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewCarnetHandlerWithService(&mockCarnetSvc{
		foto: &services.PersonaFotoArchivo{Bytes: []byte("jpg"), ContentType: "image/jpeg"},
	})
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "id", Value: "9"}}
	c.Request = httptest.NewRequest(http.MethodGet, "/api/carnets/biblioteca/9/foto", nil)
	h.VerFotoBiblioteca(c)
	if w.Code != http.StatusOK {
		t.Fatalf("feliz %d", w.Code)
	}

	h = NewCarnetHandlerWithService(&mockCarnetSvc{err: errors.New("no")})
	w = httptest.NewRecorder()
	c, _ = gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "id", Value: "9"}}
	c.Request = httptest.NewRequest(http.MethodGet, "/api/carnets/biblioteca/9/foto", nil)
	h.VerFotoBiblioteca(c)
	if w.Code != http.StatusNotFound {
		t.Fatalf("falta %d", w.Code)
	}
}

func TestDescargarExcelBibliotecaFelizYError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewCarnetHandlerWithService(&mockCarnetSvc{})
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/carnets/biblioteca/excel", nil)
	h.DescargarExcelBiblioteca(c)
	if w.Code != http.StatusOK || w.Body.Len() == 0 {
		t.Fatalf("feliz %d", w.Code)
	}

	h = NewCarnetHandlerWithService(&mockCarnetSvc{err: errors.New("falló")})
	w = httptest.NewRecorder()
	c, _ = gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/carnets/biblioteca/excel", nil)
	h.DescargarExcelBiblioteca(c)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("error %d", w.Code)
	}
}
