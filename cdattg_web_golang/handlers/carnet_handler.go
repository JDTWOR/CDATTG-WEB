/**
 * Entrego el carnet del aprendiz: consulta, solicitud y foto publicada.
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/services"
)

// CarnetHandler atiende /carnets.
type CarnetHandler struct {
	svc services.CarnetDigitalService
}

// NewCarnetHandler crea el handler del carnet con el servicio de configuración.
func NewCarnetHandler(configSvc *services.CarnetConfigService) *CarnetHandler {
	return &CarnetHandler{svc: services.NewCarnetDigitalServiceWithConfig(configSvc)}
}

// NewCarnetHandlerWithService inyecto el servicio en las pruebas.
func NewCarnetHandlerWithService(svc services.CarnetDigitalService) *CarnetHandler {
	return &CarnetHandler{svc: svc}
}

// GetMiCarnet GET /carnets/mi-carnet.
func (h *CarnetHandler) GetMiCarnet(c *gin.Context) {
	personaID, ok := personaIDDelContexto(c)
	if !ok {
		return
	}
	carnet, err := h.svc.ObtenerMiCarnet(personaID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, carnet)
}

// SolicitarMiCarnet POST /carnets/solicitar.
func (h *CarnetHandler) SolicitarMiCarnet(c *gin.Context) {
	personaID, ok := personaIDDelContexto(c)
	if !ok {
		return
	}
	var req dto.CarnetSolicitarRequest
	_ = c.ShouldBindJSON(&req)
	if req.FichaID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Seleccione la ficha"})
		return
	}
	carnet, err := h.svc.Solicitar(personaID, req.FichaID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, carnet)
}

// VerMiFotoCarnet GET /carnets/mi-foto.
func (h *CarnetHandler) VerMiFotoCarnet(c *gin.Context) {
	personaID, ok := personaIDDelContexto(c)
	if !ok {
		return
	}
	fichaID, _ := strconv.ParseUint(c.Query("ficha_id"), 10, 32)
	arch, err := h.svc.LeerFotoPublicada(personaID, uint(fichaID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.Data(http.StatusOK, arch.ContentType, arch.Bytes)
}
