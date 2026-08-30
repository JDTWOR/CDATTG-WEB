/**
 * handlers: lecturas públicas del portal y semilleros.
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/services"
	"gorm.io/gorm"
)

// PortalPublicHandler API sin JWT.
type PortalPublicHandler struct {
	svc *services.PortalPublicService
}

// NewPortalPublicHandler constructor.
func NewPortalPublicHandler() *PortalPublicHandler {
	return &PortalPublicHandler{svc: services.NewPortalPublicService()}
}

// Home GET /api/public/portal
func (h *PortalPublicHandler) Home(c *gin.Context) {
	data, err := h.svc.Home()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo cargar el portal"})
		return
	}
	c.JSON(http.StatusOK, data)
}

// Semilleros GET /api/public/semilleros
func (h *PortalPublicHandler) Semilleros(c *gin.Context) {
	data, err := h.svc.SemillerosPublicados()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudieron listar los semilleros"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// Semillero GET /api/public/semilleros/:slug
func (h *PortalPublicHandler) Semillero(c *gin.Context) {
	item, err := h.svc.SemilleroPorSlug(c.Param("slug"))
	if errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Semillero no encontrado"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo abrir el semillero"})
		return
	}
	c.JSON(http.StatusOK, item)
}

// Archivo GET /api/public/portal/archivos/*nombre (la extensión .jpg/.png entra en el comodín).
func (h *PortalPublicHandler) Archivo(c *gin.Context) {
	ruta, err := services.RutaArchivoPortal(c.Param("nombre"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.File(ruta)
}
