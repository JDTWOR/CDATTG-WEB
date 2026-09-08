/**
 * Handler de configuración del carnet (admin).
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/services"
)

// CarnetConfigHandler atiende /carnets/configuracion.
type CarnetConfigHandler struct {
	svc *services.CarnetConfigService
}

// NewCarnetConfigHandler crea el handler con el servicio inyectado.
func NewCarnetConfigHandler(svc *services.CarnetConfigService) *CarnetConfigHandler {
	return &CarnetConfigHandler{svc: svc}
}

type configuracionCarnetRequest struct {
	Nombre   string `json:"nombre"`
	Cargo    string `json:"cargo"`
	Regional string `json:"regional"`
}

// Obtener GET /carnets/configuracion.
func (h *CarnetConfigHandler) Obtener(c *gin.Context) {
	cfg, err := h.svc.Obtener()
	if err != nil {
		c.JSON(http.StatusOK, configuracionCarnetRequest{})
		return
	}
	c.JSON(http.StatusOK, configuracionCarnetRequest{
		Nombre:   cfg.Nombre,
		Cargo:    cfg.Cargo,
		Regional: cfg.Regional,
	})
}

// Guardar PUT /carnets/configuracion.
func (h *CarnetConfigHandler) Guardar(c *gin.Context) {
	var req configuracionCarnetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}
	_, err := h.svc.Guardar(req.Nombre, req.Cargo, req.Regional)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
