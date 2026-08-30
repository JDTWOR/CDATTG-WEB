/**
 * handlers: CRUD autenticado de semilleros.
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

// SemilleroAdminHandler API admin.
type SemilleroAdminHandler struct {
	svc *services.SemilleroAdminService
}

// NewSemilleroAdminHandler constructor.
func NewSemilleroAdminHandler() *SemilleroAdminHandler {
	return &SemilleroAdminHandler{svc: services.NewSemilleroAdminService()}
}

// List GET /api/semilleros
func (h *SemilleroAdminHandler) List(c *gin.Context) {
	data, err := h.svc.Listar()
	if err != nil {
		portalJSONError(c, http.StatusInternalServerError, "No se pudieron listar los semilleros")
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// Get GET /api/semilleros/:id
func (h *SemilleroAdminHandler) Get(c *gin.Context) {
	id, ok := portalIDParam(c, "id")
	if !ok {
		return
	}
	item, err := h.svc.Obtener(id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		portalJSONError(c, http.StatusNotFound, "Semillero no encontrado")
		return
	}
	if err != nil {
		portalJSONError(c, http.StatusInternalServerError, "No se pudo cargar el semillero")
		return
	}
	c.JSON(http.StatusOK, item)
}

// Create POST /api/semilleros
func (h *SemilleroAdminHandler) Create(c *gin.Context) {
	uid, ok := portalUserID(c)
	if !ok {
		return
	}
	var req dto.SemilleroRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		portalJSONError(c, http.StatusBadRequest, "Datos inválidos")
		return
	}
	item, err := h.svc.Crear(req, uid)
	if err != nil {
		portalJSONError(c, http.StatusBadRequest, err.Error())
		return
	}
	c.JSON(http.StatusCreated, item)
}

// Update PUT /api/semilleros/:id
func (h *SemilleroAdminHandler) Update(c *gin.Context) {
	uid, ok := portalUserID(c)
	if !ok {
		return
	}
	id, ok := portalIDParam(c, "id")
	if !ok {
		return
	}
	var req dto.SemilleroRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		portalJSONError(c, http.StatusBadRequest, "Datos inválidos")
		return
	}
	item, err := h.svc.Actualizar(id, req, uid)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		portalJSONError(c, http.StatusNotFound, "Semillero no encontrado")
		return
	}
	if err != nil {
		portalJSONError(c, http.StatusBadRequest, err.Error())
		return
	}
	c.JSON(http.StatusOK, item)
}

// Delete DELETE /api/semilleros/:id
func (h *SemilleroAdminHandler) Delete(c *gin.Context) {
	id, ok := portalIDParam(c, "id")
	if !ok {
		return
	}
	if err := h.svc.Eliminar(id); err != nil {
		portalJSONError(c, http.StatusInternalServerError, "No se pudo eliminar")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Eliminado"})
}
