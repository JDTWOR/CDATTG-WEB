package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/services"
)

type AprobacionHandler struct {
	svc services.AprobacionService
}

func NewAprobacionHandler() *AprobacionHandler {
	return &AprobacionHandler{svc: services.NewAprobacionService()}
}

func (h *AprobacionHandler) AprobarRechazar(c *gin.Context) {
	user, _ := c.Get("user")
	u, _ := user.(*models.User)
	if u == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autenticado"})
		return
	}
	var req dto.AprobarRechazarRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}
	if err := h.svc.AprobarRechazar(req, u.ID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Operación realizada"})
}
