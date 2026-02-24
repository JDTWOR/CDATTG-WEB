package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/services"
)

type InventarioDashboardHandler struct {
	svc services.InventarioDashboardService
}

func NewInventarioDashboardHandler() *InventarioDashboardHandler {
	return &InventarioDashboardHandler{svc: services.NewInventarioDashboardService()}
}

func (h *InventarioDashboardHandler) GetDashboard(c *gin.Context) {
	resp, err := h.svc.GetDashboard()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}
