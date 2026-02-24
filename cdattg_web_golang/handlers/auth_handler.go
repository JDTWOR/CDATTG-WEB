package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/services"
)

type AuthHandler struct {
	authService services.AuthService
}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{
		authService: services.NewAuthService(),
	}
}

// NewAuthHandlerWithService permite inyectar el servicio (p. ej. para tests).
func NewAuthHandlerWithService(authService services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Login maneja la autenticación de usuarios
// @Summary Iniciar sesión
// @Description Autentica un usuario y retorna un token JWT
// @Tags auth
// @Accept json
// @Produce json
// @Param request body dto.LoginRequest true "Credenciales de login"
// @Success 200 {object} dto.LoginResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /api/auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}

	response, err := h.authService.Login(req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetCurrentUser obtiene la información del usuario autenticado
// @Summary Obtener usuario actual
// @Description Retorna la información del usuario autenticado
// @Tags auth
// @Security BearerAuth
// @Produce json
// @Success 200 {object} dto.UserResponse
// @Failure 401 {object} map[string]string
// @Router /api/auth/me [get]
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	user, err := h.authService.GetCurrentUser(userID.(uint))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

// ChangePassword permite al usuario autenticado cambiar su contraseña
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	var req dto.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}

	if err := h.authService.ChangePassword(userID.(uint), req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Contraseña actualizada correctamente"})
}
