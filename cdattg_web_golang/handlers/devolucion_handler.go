package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/services"
)

type DevolucionHandler struct {
	svc services.DevolucionService
}

func NewDevolucionHandler() *DevolucionHandler {
	return &DevolucionHandler{svc: services.NewDevolucionService()}
}

func (h *DevolucionHandler) Create(c *gin.Context) {
	user, _ := c.Get("user")
	u, _ := user.(*models.User)
	if u == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autenticado"})
		return
	}
	var req dto.DevolucionCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}
	resp, err := h.svc.Create(req, u.ID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, resp)
}
