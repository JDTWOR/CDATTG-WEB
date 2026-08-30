/**
 * handlers: lecturas públicas del área de investigación BIOGIGAS.
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/services"
	"gorm.io/gorm"
)

// BiogjgasPublicHandler vitrina sin JWT.
type BiogjgasPublicHandler struct {
	home *services.PortalPublicService
	edit *services.BiogjgasEditorialService
}

// NewBiogjgasPublicHandler constructor.
func NewBiogjgasPublicHandler() *BiogjgasPublicHandler {
	return &BiogjgasPublicHandler{
		home: services.NewPortalPublicService(),
		edit: services.NewBiogjgasEditorialService(),
	}
}

// Home GET /api/public/investigacion
func (h *BiogjgasPublicHandler) Home(c *gin.Context) {
	data, err := h.home.InvestigacionHome()
	if err != nil {
		portalJSONError(c, http.StatusInternalServerError, "No se pudo cargar investigación")
		return
	}
	c.JSON(http.StatusOK, data)
}

// Presentacion GET /api/public/investigacion/presentacion
func (h *BiogjgasPublicHandler) Presentacion(c *gin.Context) {
	data, err := h.home.Home()
	if err != nil {
		portalJSONError(c, http.StatusInternalServerError, "No se pudo cargar la presentación")
		return
	}
	if data.Presentacion == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Presentación no publicada"})
		return
	}
	c.JSON(http.StatusOK, data.Presentacion)
}

// Listar GET /api/public/investigacion/:kind
func (h *BiogjgasPublicHandler) Listar(c *gin.Context) {
	data, err := h.edit.Listar(c.Param("kind"), true)
	if err != nil {
		portalJSONError(c, http.StatusBadRequest, err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// Detalle GET /api/public/investigacion/:kind/:id
func (h *BiogjgasPublicHandler) Detalle(c *gin.Context) {
	kind := c.Param("kind")
	ref := c.Param("id")
	if kind == "revistas" {
		item, err := h.edit.RevistaPorSlug(ref)
		h.responderItem(c, item, err)
		return
	}
	id, err := strconv.ParseUint(ref, 10, 32)
	if err != nil {
		portalJSONError(c, http.StatusBadRequest, "Identificador inválido")
		return
	}
	item, err := h.edit.Obtener(kind, uint(id), true)
	h.responderItem(c, item, err)
}

func (h *BiogjgasPublicHandler) responderItem(c *gin.Context, item any, err error) {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		portalJSONError(c, http.StatusNotFound, "No encontrado")
		return
	}
	if err != nil {
		portalJSONError(c, http.StatusBadRequest, err.Error())
		return
	}
	c.JSON(http.StatusOK, item)
}
