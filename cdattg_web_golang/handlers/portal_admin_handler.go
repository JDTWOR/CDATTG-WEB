/**
 * handlers: banners, presentación y subida de archivos del portal.
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/services"
)

// PortalAdminHandler contenido autenticado.
type PortalAdminHandler struct {
	svc *services.PortalAdminService
}

// NewPortalAdminHandler constructor.
func NewPortalAdminHandler() *PortalAdminHandler {
	return &PortalAdminHandler{svc: services.NewPortalAdminService()}
}

// ListBanners GET /api/portal/banners
func (h *PortalAdminHandler) ListBanners(c *gin.Context) {
	data, err := h.svc.ListarBanners()
	if err != nil {
		portalJSONError(c, http.StatusInternalServerError, "No se pudieron listar los banners")
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// CreateBanner POST /api/portal/banners
func (h *PortalAdminHandler) CreateBanner(c *gin.Context) {
	uid, ok := portalUserID(c)
	if !ok {
		return
	}
	var req dto.PortalBannerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		portalJSONError(c, http.StatusBadRequest, errMsgDatosInvalidos)
		return
	}
	item, err := h.svc.CrearBanner(req, uid)
	if err != nil {
		portalJSONError(c, http.StatusBadRequest, err.Error())
		return
	}
	c.JSON(http.StatusCreated, item)
}

// UpdateBanner PUT /api/portal/banners/:id
func (h *PortalAdminHandler) UpdateBanner(c *gin.Context) {
	uid, ok := portalUserID(c)
	if !ok {
		return
	}
	id, ok := portalIDParam(c, "id")
	if !ok {
		return
	}
	var req dto.PortalBannerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		portalJSONError(c, http.StatusBadRequest, errMsgDatosInvalidos)
		return
	}
	item, err := h.svc.ActualizarBanner(id, req, uid)
	if err != nil {
		portalJSONError(c, http.StatusBadRequest, err.Error())
		return
	}
	c.JSON(http.StatusOK, item)
}

// DeleteBanner DELETE /api/portal/banners/:id
func (h *PortalAdminHandler) DeleteBanner(c *gin.Context) {
	id, ok := portalIDParam(c, "id")
	if !ok {
		return
	}
	if err := h.svc.EliminarBanner(id); err != nil {
		portalJSONError(c, http.StatusInternalServerError, "No se pudo eliminar")
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Eliminado"})
}

// GetPresentacion GET /api/portal/presentacion
func (h *PortalAdminHandler) GetPresentacion(c *gin.Context) {
	item, err := h.svc.ObtenerPresentacion()
	if err != nil {
		portalJSONError(c, http.StatusInternalServerError, "No se pudo cargar la presentación")
		return
	}
	c.JSON(http.StatusOK, item)
}

// PutPresentacion PUT /api/portal/presentacion
func (h *PortalAdminHandler) PutPresentacion(c *gin.Context) {
	uid, ok := portalUserID(c)
	if !ok {
		return
	}
	var req dto.PortalPresentacionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		portalJSONError(c, http.StatusBadRequest, errMsgDatosInvalidos)
		return
	}
	item, err := h.svc.GuardarPresentacion(req, uid)
	if err != nil {
		portalJSONError(c, http.StatusBadRequest, err.Error())
		return
	}
	c.JSON(http.StatusOK, item)
}

// SubirArchivo POST /api/portal/archivos
func (h *PortalAdminHandler) SubirArchivo(c *gin.Context) {
	fh, err := c.FormFile("archivo")
	if err != nil {
		portalJSONError(c, http.StatusBadRequest, "Adjunte un archivo")
		return
	}
	nombre, err := services.GuardarArchivoPortal(fh)
	if err != nil {
		portalJSONError(c, http.StatusBadRequest, err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"nombre": nombre, "url": "/api/public/portal/archivos/" + nombre})
}
