/**
 * handlers: CRUD admin de contenidos BIOGIGAS.
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/services"
	"gorm.io/gorm"
)

// BiogjgasEditorialHandler API autenticada del área.
type BiogjgasEditorialHandler struct {
	svc *services.BiogjgasEditorialService
}

// NewBiogjgasEditorialHandler constructor.
func NewBiogjgasEditorialHandler() *BiogjgasEditorialHandler {
	return &BiogjgasEditorialHandler{svc: services.NewBiogjgasEditorialService()}
}

// List GET /api/investigacion/:kind
func (h *BiogjgasEditorialHandler) List(c *gin.Context) {
	data, err := h.svc.Listar(c.Param("kind"), false)
	if err != nil {
		portalJSONError(c, http.StatusBadRequest, err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// Get GET /api/investigacion/:kind/:id
func (h *BiogjgasEditorialHandler) Get(c *gin.Context) {
	id, ok := portalIDParam(c, "id")
	if !ok {
		return
	}
	item, err := h.svc.Obtener(c.Param("kind"), id, false)
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

// Create POST /api/investigacion/:kind
func (h *BiogjgasEditorialHandler) Create(c *gin.Context) {
	uid, ok := portalUserID(c)
	if !ok {
		return
	}
	var req dto.BiogjgasItem
	if err := c.ShouldBindJSON(&req); err != nil {
		portalJSONError(c, http.StatusBadRequest, "Datos inválidos")
		return
	}
	item, err := h.svc.Crear(c.Param("kind"), req, uid)
	if err != nil {
		portalJSONError(c, http.StatusBadRequest, err.Error())
		return
	}
	c.JSON(http.StatusCreated, item)
}

// Update PUT /api/investigacion/:kind/:id
func (h *BiogjgasEditorialHandler) Update(c *gin.Context) {
	uid, ok := portalUserID(c)
	if !ok {
		return
	}
	id, ok := portalIDParam(c, "id")
	if !ok {
		return
	}
	var req dto.BiogjgasItem
	if err := c.ShouldBindJSON(&req); err != nil {
		portalJSONError(c, http.StatusBadRequest, "Datos inválidos")
		return
	}
	item, err := h.svc.Actualizar(c.Param("kind"), id, req, uid)
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

// Delete DELETE /api/investigacion/:kind/:id
func (h *BiogjgasEditorialHandler) Delete(c *gin.Context) {
	id, ok := portalIDParam(c, "id")
	if !ok {
		return
	}
	if err := h.svc.Eliminar(c.Param("kind"), id); err != nil {
		portalJSONError(c, http.StatusBadRequest, err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Eliminado"})
}
