package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/testutil"
)

// mockAuthService implementa services.AuthService para tests.
type mockAuthService struct {
	loginFunc       func(dto.LoginRequest) (*dto.LoginResponse, error)
	getCurrentUser  func(uint) (*dto.UserResponse, error)
	changePassword  func(uint, dto.ChangePasswordRequest) error
}

func (m *mockAuthService) Login(req dto.LoginRequest) (*dto.LoginResponse, error) {
	if m.loginFunc != nil {
		return m.loginFunc(req)
	}
	return nil, nil
}

func (m *mockAuthService) GetCurrentUser(userID uint) (*dto.UserResponse, error) {
	if m.getCurrentUser != nil {
		return m.getCurrentUser(userID)
	}
	return nil, nil
}

func (m *mockAuthService) ChangePassword(userID uint, req dto.ChangePasswordRequest) error {
	if m.changePassword != nil {
		return m.changePassword(userID, req)
	}
	return nil
}

func TestAuthHandler_Login(t *testing.T) {
	tests := []struct {
		name           string
		setupRequest   func() (*httptest.ResponseRecorder, *gin.Context)
		mockLogin      func(dto.LoginRequest) (*dto.LoginResponse, error)
		wantStatus     int
		wantErrMessage string
		wantToken      bool
	}{
		{
			name: "body_vacio_retorna_400",
			setupRequest: func() (*httptest.ResponseRecorder, *gin.Context) {
				w := httptest.NewRecorder()
				req := httptest.NewRequest(http.MethodPost, "/api/auth/login", nil)
				req.Header.Set("Content-Type", "application/json")
				c, _ := gin.CreateTestContext(w)
				c.Request = req
				return w, c
			},
			wantStatus: http.StatusBadRequest,
		},
		{
			name: "json_invalido_retorna_400",
			setupRequest: func() (*httptest.ResponseRecorder, *gin.Context) {
				w := httptest.NewRecorder()
				req := testutil.RequestWithBody(http.MethodPost, "/api/auth/login", []byte(`{invalid}`), "application/json")
				c, _ := gin.CreateTestContext(w)
				c.Request = req
				return w, c
			},
			wantStatus: http.StatusBadRequest,
		},
		{
			name: "campos_requeridos_faltantes_retorna_400",
			setupRequest: func() (*httptest.ResponseRecorder, *gin.Context) {
				return testutil.RecorderAndContext(http.MethodPost, "/api/auth/login", map[string]string{"email": "test@test.com"})
			},
			wantStatus: http.StatusBadRequest,
		},
		{
			name: "credenciales_invalidas_retorna_401",
			setupRequest: func() (*httptest.ResponseRecorder, *gin.Context) {
				return testutil.RecorderAndContext(http.MethodPost, "/api/auth/login", dto.LoginRequest{Email: "user@test.com", Password: "wrong"})
			},
			mockLogin: func(dto.LoginRequest) (*dto.LoginResponse, error) {
				return nil, errors.New("credenciales inválidas")
			},
			wantStatus:     http.StatusUnauthorized,
			wantErrMessage: "credenciales inválidas",
		},
		{
			name: "login_exitoso_retorna_200_y_token",
			setupRequest: func() (*httptest.ResponseRecorder, *gin.Context) {
				return testutil.RecorderAndContext(http.MethodPost, "/api/auth/login", dto.LoginRequest{Email: "user@test.com", Password: "secret"})
			},
			mockLogin: func(dto.LoginRequest) (*dto.LoginResponse, error) {
				return &dto.LoginResponse{
					Token: "jwt-token-here",
					Type:  "Bearer",
					User:  dto.UserResponse{ID: 1, Email: "user@test.com", FullName: "Test User", Status: true},
					Roles: []string{"ADMIN"}, Permissions: []string{"VER PERSONAS"},
				}, nil
			},
			wantStatus: http.StatusOK,
			wantToken:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gin.SetMode(gin.TestMode)
			mock := &mockAuthService{loginFunc: tt.mockLogin}
			h := NewAuthHandlerWithService(mock)
			w, c := tt.setupRequest()
			h.Login(c)
			testutil.AssertStatus(t, w, tt.wantStatus)
			if tt.wantErrMessage != "" {
				var m map[string]interface{}
				if err := json.NewDecoder(w.Body).Decode(&m); err != nil {
					t.Fatalf("decode response: %v", err)
				}
				if errMsg, ok := m["error"].(string); !ok || errMsg != tt.wantErrMessage {
					t.Errorf("error message: got %v, want %q", m["error"], tt.wantErrMessage)
				}
			}
			if tt.wantToken {
				var m map[string]interface{}
				if err := json.NewDecoder(bytes.NewReader(w.Body.Bytes())).Decode(&m); err != nil {
					t.Fatalf("decode response: %v", err)
				}
				if _, ok := m["token"]; !ok {
					t.Error("expected token in response")
				}
			}
		})
	}
}

func TestAuthHandler_GetCurrentUser(t *testing.T) {
	gin.SetMode(gin.TestMode)
	tests := []struct {
		name           string
		setUserID      bool
		userID         uint
		mockGetUser    func(uint) (*dto.UserResponse, error)
		wantStatus     int
		wantErrMessage string
	}{
		{
			name:       "sin_user_id_en_contexto_retorna_401",
			setUserID:  false,
			wantStatus: http.StatusUnauthorized,
			wantErrMessage: "Usuario no autenticado",
		},
		{
			name:       "usuario_no_encontrado_retorna_404",
			setUserID:  true,
			userID:     999,
			mockGetUser: func(uint) (*dto.UserResponse, error) {
				return nil, errors.New("usuario no encontrado")
			},
			wantStatus:     http.StatusNotFound,
			wantErrMessage: "usuario no encontrado",
		},
		{
			name:      "exito_retorna_200_y_usuario",
			setUserID: true,
			userID:    1,
			mockGetUser: func(uint) (*dto.UserResponse, error) {
				return &dto.UserResponse{ID: 1, Email: "user@test.com", FullName: "Test User", Status: true}, nil
			},
			wantStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mock := &mockAuthService{getCurrentUser: tt.mockGetUser}
			h := NewAuthHandlerWithService(mock)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
			if tt.setUserID {
				c.Set("userID", tt.userID)
			}
			h.GetCurrentUser(c)
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

func TestAuthHandler_ChangePassword(t *testing.T) {
	gin.SetMode(gin.TestMode)
	tests := []struct {
		name           string
		setUserID      bool
		userID         uint
		body           interface{}
		mockChange     func(uint, dto.ChangePasswordRequest) error
		wantStatus     int
		wantErrMessage string
	}{
		{
			name:       "sin_user_id_retorna_401",
			setUserID:  false,
			body:       dto.ChangePasswordRequest{PasswordActual: "old", PasswordNueva: "new123"},
			wantStatus: http.StatusUnauthorized,
			wantErrMessage: "Usuario no autenticado",
		},
		{
			name:      "datos_invalidos_retorna_400",
			setUserID: true,
			userID:    1,
			body:      map[string]string{"password_actual": "old"},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:      "contraseña_actual_incorrecta_retorna_400",
			setUserID: true,
			userID:    1,
			body:      dto.ChangePasswordRequest{PasswordActual: "wrong", PasswordNueva: "new123"},
			mockChange: func(uint, dto.ChangePasswordRequest) error {
				return errors.New("contraseña actual incorrecta")
			},
			wantStatus:     http.StatusBadRequest,
			wantErrMessage: "contraseña actual incorrecta",
		},
		{
			name:      "exito_retorna_200",
			setUserID: true,
			userID:    1,
			body:      dto.ChangePasswordRequest{PasswordActual: "old", PasswordNueva: "new123"},
			mockChange: func(uint, dto.ChangePasswordRequest) error {
				return nil
			},
			wantStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mock := &mockAuthService{changePassword: tt.mockChange}
			h := NewAuthHandlerWithService(mock)
			w, c := testutil.RecorderAndContext(http.MethodPost, "/api/auth/change-password", tt.body)
			if tt.setUserID {
				c.Set("userID", tt.userID)
			}
			h.ChangePassword(c)
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
