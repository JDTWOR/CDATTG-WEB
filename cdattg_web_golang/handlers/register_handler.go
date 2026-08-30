/**
 * handlers: registro público de usuario.
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/services"
)

// RegisterHandler POST /api/auth/register
type RegisterHandler struct {
	svc *services.RegisterService
}

// NewRegisterHandler constructor.
func NewRegisterHandler() *RegisterHandler {
	return &RegisterHandler{svc: services.NewRegisterService()}
}

// Register crea persona y usuario VISITANTE.
func (h *RegisterHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}
	if err := h.svc.Registrar(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Registro exitoso"})
}
