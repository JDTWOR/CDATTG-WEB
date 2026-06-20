package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/services"
)

type ConfiguracionAsistenciaHandler struct {
	svc *services.ConfiguracionAsistenciaService
}

func NewConfiguracionAsistenciaHandler() *ConfiguracionAsistenciaHandler {
	return &ConfiguracionAsistenciaHandler{svc: services.NewConfiguracionAsistenciaService()}
}

func (h *ConfiguracionAsistenciaHandler) Get(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"data": h.svc.Get()})
}

func (h *ConfiguracionAsistenciaHandler) Update(c *gin.Context) {
	var req dto.ConfiguracionAsistenciaUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item, err := h.svc.Update(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": item})
}
