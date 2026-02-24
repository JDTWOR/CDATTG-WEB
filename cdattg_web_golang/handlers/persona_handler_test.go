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
	"github.com/sena/cdattg-web-golang/testutil"
)

type mockPersonaService struct {
	findAllFunc    func(int, int, string) ([]dto.PersonaResponse, int64, error)
	findByIDFunc   func(uint) (*dto.PersonaResponse, error)
	createFunc     func(dto.PersonaRequest) (*dto.PersonaResponse, error)
	updateFunc     func(uint, dto.PersonaRequest) (*dto.PersonaResponse, error)
	deleteFunc     func(uint) error
	resetPassword  func(uint) error
}

func (m *mockPersonaService) FindAll(page, pageSize int, search string) ([]dto.PersonaResponse, int64, error) {
	if m.findAllFunc != nil {
		return m.findAllFunc(page, pageSize, search)
	}
	return nil, 0, nil
}

func (m *mockPersonaService) FindByID(id uint) (*dto.PersonaResponse, error) {
	if m.findByIDFunc != nil {
		return m.findByIDFunc(id)
	}
	return nil, nil
}

func (m *mockPersonaService) FindByNumeroDocumento(string) (*dto.PersonaResponse, error) { return nil, nil }

func (m *mockPersonaService) Create(req dto.PersonaRequest) (*dto.PersonaResponse, error) {
	if m.createFunc != nil {
		return m.createFunc(req)
	}
	return nil, nil
}

func (m *mockPersonaService) Update(id uint, req dto.PersonaRequest) (*dto.PersonaResponse, error) {
	if m.updateFunc != nil {
		return m.updateFunc(id, req)
	}
	return nil, nil
}

func (m *mockPersonaService) Delete(id uint) error {
	if m.deleteFunc != nil {
		return m.deleteFunc(id)
	}
	return nil
}

func (m *mockPersonaService) ResetPassword(personaID uint) error {
	if m.resetPassword != nil {
		return m.resetPassword(personaID)
	}
	return nil
}

type mockPersonaImportService struct {
	listImportsFunc func(int) ([]services.ImportLogItem, error)
}

func (m *mockPersonaImportService) ImportFromExcel([]byte, string, uint) (*services.ImportResult, error) {
	return nil, nil
}

func (m *mockPersonaImportService) ImportFromExcelWithProgress([]byte, string, uint, func(services.ImportProgress)) (*services.ImportResult, error) {
	return nil, nil
}

func (m *mockPersonaImportService) ListImports(limit int) ([]services.ImportLogItem, error) {
	if m.listImportsFunc != nil {
		return m.listImportsFunc(limit)
	}
	return nil, nil
}

func TestPersonaHandler_GetByID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	tests := []struct {
		name           string
		idParam        string
		mockFindByID   func(uint) (*dto.PersonaResponse, error)
		wantStatus     int
		wantErrMessage string
	}{
		{
			name:           "id_invalido_retorna_400",
			idParam:        "abc",
			wantStatus:     http.StatusBadRequest,
			wantErrMessage: "ID inválido",
		},
		{
			name:       "persona_no_encontrada_retorna_404",
			idParam:    "999",
			mockFindByID: func(uint) (*dto.PersonaResponse, error) {
				return nil, errors.New("persona no encontrada")
			},
			wantStatus:     http.StatusNotFound,
			wantErrMessage: "Persona no encontrada",
		},
		{
			name:     "exito_retorna_200",
			idParam:  "1",
			mockFindByID: func(uint) (*dto.PersonaResponse, error) {
				return &dto.PersonaResponse{ID: 1, NumeroDocumento: "123", PrimerNombre: "Test", PrimerApellido: "User", FullName: "Test User"}, nil
			},
			wantStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockSvc := &mockPersonaService{findByIDFunc: tt.mockFindByID}
			mockImport := &mockPersonaImportService{}
			h := NewPersonaHandlerWithServices(mockSvc, mockImport)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest(http.MethodGet, "/api/personas/"+tt.idParam, nil)
			c.Params = gin.Params{{Key: "id", Value: tt.idParam}}
			h.GetByID(c)
			testutil.AssertStatus(t, w, tt.wantStatus)
			if tt.wantErrMessage != "" {
				var m map[string]interface{}
				_ = json.NewDecoder(w.Body).Decode(&m)
				if errMsg, ok := m["error"].(string); !ok || errMsg != tt.wantErrMessage {
					t.Errorf("error message: got %v, want %q", m["error"], tt.wantErrMessage)
				}
			}
		})
	}
}

func TestPersonaHandler_GetAll(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mockSvc := &mockPersonaService{
		findAllFunc: func(page, pageSize int, search string) ([]dto.PersonaResponse, int64, error) {
			return []dto.PersonaResponse{
				{ID: 1, FullName: "Persona 1", NumeroDocumento: "111"},
			}, 1, nil
		},
	}
	h := NewPersonaHandlerWithServices(mockSvc, &mockPersonaImportService{})
	w, c := testutil.RecorderAndContext(http.MethodGet, "/api/personas?page=1&page_size=10", nil)
	c.Request.URL.RawQuery = "page=1&page_size=10"
	h.GetAll(c)
	testutil.AssertStatus(t, w, http.StatusOK)
	var m map[string]interface{}
	_ = json.NewDecoder(w.Body).Decode(&m)
	if _, ok := m["data"]; !ok {
		t.Error("expected 'data' in response")
	}
	if total, ok := m["total"].(float64); !ok || total != 1 {
		t.Errorf("total: got %v, want 1", m["total"])
	}
}

func TestPersonaHandler_Create(t *testing.T) {
	gin.SetMode(gin.TestMode)
	tests := []struct {
		name           string
		body           interface{}
		mockCreate     func(dto.PersonaRequest) (*dto.PersonaResponse, error)
		wantStatus     int
		wantErrMessage string
	}{
		{
			name:       "datos_invalidos_retorna_400",
			body:       map[string]string{"primer_nombre": "X"},
			wantStatus: http.StatusBadRequest,
		},
		{
			name: "servicio_retorna_error_400",
			body: dto.PersonaRequest{NumeroDocumento: "123", PrimerNombre: "A", PrimerApellido: "B"},
			mockCreate: func(dto.PersonaRequest) (*dto.PersonaResponse, error) {
				return nil, errors.New("el número de documento ya está registrado")
			},
			wantStatus:     http.StatusBadRequest,
			wantErrMessage: "el número de documento ya está registrado",
		},
		{
			name: "exito_retorna_201",
			body: dto.PersonaRequest{NumeroDocumento: "123", PrimerNombre: "A", PrimerApellido: "B"},
			mockCreate: func(dto.PersonaRequest) (*dto.PersonaResponse, error) {
				return &dto.PersonaResponse{ID: 1, NumeroDocumento: "123", FullName: "A B"}, nil
			},
			wantStatus: http.StatusCreated,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockSvc := &mockPersonaService{createFunc: tt.mockCreate}
			h := NewPersonaHandlerWithServices(mockSvc, &mockPersonaImportService{})
			w, c := testutil.RecorderAndContext(http.MethodPost, "/api/personas", tt.body)
			h.Create(c)
			testutil.AssertStatus(t, w, tt.wantStatus)
			if tt.wantErrMessage != "" {
				var m map[string]interface{}
				_ = json.NewDecoder(w.Body).Decode(&m)
				if errMsg, ok := m["error"].(string); !ok || errMsg != tt.wantErrMessage {
					t.Errorf("error message: got %v, want %q", m["error"], tt.wantErrMessage)
				}
			}
		})
	}
}

func TestPersonaHandler_Update(t *testing.T) {
	gin.SetMode(gin.TestMode)
	tests := []struct {
		name           string
		idParam        string
		body           interface{}
		mockUpdate     func(uint, dto.PersonaRequest) (*dto.PersonaResponse, error)
		wantStatus     int
		wantErrMessage string
	}{
		{
			name:           "id_invalido_retorna_400",
			idParam:        "x",
			body:           dto.PersonaRequest{NumeroDocumento: "123", PrimerNombre: "A", PrimerApellido: "B"},
			wantStatus:     http.StatusBadRequest,
			wantErrMessage: "ID inválido",
		},
		{
			name:     "exito_retorna_200",
			idParam:  "1",
			body:     dto.PersonaRequest{NumeroDocumento: "123", PrimerNombre: "A", PrimerApellido: "B"},
			mockUpdate: func(id uint, req dto.PersonaRequest) (*dto.PersonaResponse, error) {
				return &dto.PersonaResponse{ID: id, FullName: "A B"}, nil
			},
			wantStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockSvc := &mockPersonaService{updateFunc: tt.mockUpdate}
			h := NewPersonaHandlerWithServices(mockSvc, &mockPersonaImportService{})
			w, c := testutil.RecorderAndContext(http.MethodPut, "/api/personas/"+tt.idParam, tt.body)
			c.Params = gin.Params{{Key: "id", Value: tt.idParam}}
			h.Update(c)
			testutil.AssertStatus(t, w, tt.wantStatus)
			if tt.wantErrMessage != "" {
				var m map[string]interface{}
				_ = json.NewDecoder(w.Body).Decode(&m)
				if errMsg, ok := m["error"].(string); !ok || errMsg != tt.wantErrMessage {
					t.Errorf("error message: got %v, want %q", m["error"], tt.wantErrMessage)
				}
			}
		})
	}
}

func TestPersonaHandler_Delete(t *testing.T) {
	gin.SetMode(gin.TestMode)
	tests := []struct {
		name           string
		idParam        string
		mockDelete     func(uint) error
		wantStatus     int
		wantErrMessage string
	}{
		{
			name:           "id_invalido_retorna_400",
			idParam:        "n",
			wantStatus:     http.StatusBadRequest,
			wantErrMessage: "ID inválido",
		},
		{
			name:       "persona_no_encontrada_retorna_404",
			idParam:    "999",
			mockDelete: func(uint) error { return errors.New("not found") },
			wantStatus:     http.StatusNotFound,
			wantErrMessage: "Persona no encontrada",
		},
		{
			name:       "exito_retorna_204",
			idParam:    "1",
			mockDelete: func(uint) error { return nil },
			wantStatus: http.StatusNoContent,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockSvc := &mockPersonaService{deleteFunc: tt.mockDelete}
			h := NewPersonaHandlerWithServices(mockSvc, &mockPersonaImportService{})
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest(http.MethodDelete, "/api/personas/"+tt.idParam, nil)
			c.Params = gin.Params{{Key: "id", Value: tt.idParam}}
			h.Delete(c)
			testutil.AssertStatus(t, w, tt.wantStatus)
			if tt.wantErrMessage != "" {
				var m map[string]interface{}
				_ = json.NewDecoder(w.Body).Decode(&m)
				if errMsg, ok := m["error"].(string); !ok || errMsg != tt.wantErrMessage {
					t.Errorf("error message: got %v, want %q", m["error"], tt.wantErrMessage)
				}
			}
		})
	}
}

func TestPersonaHandler_ListPersonaImports(t *testing.T) {
	gin.SetMode(gin.TestMode)
	mockImport := &mockPersonaImportService{
		listImportsFunc: func(limit int) ([]services.ImportLogItem, error) {
			return []services.ImportLogItem{
				{ID: 1, Filename: "test.xlsx", ProcessedCount: 10, Status: "completed"},
			}, nil
		},
	}
	h := NewPersonaHandlerWithServices(&mockPersonaService{}, mockImport)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/personas/imports?limit=50", nil)
	c.Request.URL.RawQuery = "limit=50"
	h.ListPersonaImports(c)
	testutil.AssertStatus(t, w, http.StatusOK)
	var m map[string]interface{}
	_ = json.NewDecoder(w.Body).Decode(&m)
	if _, ok := m["data"]; !ok {
		t.Error("expected 'data' in response")
	}
}

func TestPersonaHandler_DownloadPersonaImportTemplate(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewPersonaHandlerWithServices(&mockPersonaService{}, &mockPersonaImportService{})
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/api/personas/import/template", nil)
	h.DownloadPersonaImportTemplate(c)
	testutil.AssertStatus(t, w, http.StatusOK)
	if w.Header().Get("Content-Type") != "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" {
		t.Errorf("Content-Type: got %s", w.Header().Get("Content-Type"))
	}
	if w.Header().Get("Content-Disposition") == "" {
		t.Error("expected Content-Disposition for attachment")
	}
	if w.Body.Len() == 0 {
		t.Error("expected non-empty Excel body")
	}
}
