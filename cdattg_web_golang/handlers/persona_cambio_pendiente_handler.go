package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/services"
)

type PersonaCambioPendienteHandler struct {
	svc services.PersonaCambioPendienteService
}

func NewPersonaCambioPendienteHandler() *PersonaCambioPendienteHandler {
	return &PersonaCambioPendienteHandler{
		svc: services.NewPersonaCambioPendienteService(),
	}
}

type RechazarRequest struct {
	Motivo string `json:"motivo"`
}

// ListarPendientes retorna todos los cambios pendientes (solo vigilancia).
func (h *PersonaCambioPendienteHandler) ListarPendientes(c *gin.Context) {
	cambios, err := h.svc.ListarPendientes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al listar cambios pendientes"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": cambios})
}

// VerFotoPendiente entrega la foto propuesta por el visitante en un cambio
// pendiente, para que el vigilante la compare con la que tiene la persona.
func (h *PersonaCambioPendienteHandler) VerFotoPendiente(c *gin.Context) {
	var id uint
	if _, err := fmt.Sscan(c.Param("id"), &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	arch, err := h.svc.LeerFoto(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.Data(http.StatusOK, arch.ContentType, arch.Bytes)
}

// Aprobar aprueba un cambio pendiente y lo aplica a la persona.
func (h *PersonaCambioPendienteHandler) Aprobar(c *gin.Context) {
	user, _ := c.Get("user")
	currentUser, _ := user.(*models.User)
	if currentUser == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	var id uint
	if _, err := fmt.Sscan(c.Param("id"), &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.svc.Aprobar(id, currentUser.ID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cambio aprobado correctamente"})
}

// Rechazar rechaza un cambio pendiente.
func (h *PersonaCambioPendienteHandler) Rechazar(c *gin.Context) {
	user, _ := c.Get("user")
	currentUser, _ := user.(*models.User)
	if currentUser == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}

	var id uint
	if _, err := fmt.Sscan(c.Param("id"), &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req RechazarRequest
	_ = c.ShouldBindJSON(&req)

	if err := h.svc.Rechazar(id, currentUser.ID, req.Motivo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cambio rechazado"})
}

// VerificarPendiente verifica si el usuario tiene cambios pendientes.
func (h *PersonaCambioPendienteHandler) VerificarPendiente(c *gin.Context) {
	user, _ := c.Get("user")
	currentUser, _ := user.(*models.User)
	if currentUser == nil || currentUser.PersonaID == nil {
		c.JSON(http.StatusOK, gin.H{"pendiente": false})
		return
	}

	tiene := h.svc.TieneCambioPendiente(*currentUser.PersonaID)
	c.JSON(http.StatusOK, gin.H{"pendiente": tiene})
}
