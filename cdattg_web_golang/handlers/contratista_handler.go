// @module contratista_handler
// @description Endpoints HTTP de Contratistas de Prestación de Servicios: CRUD e importación masiva.
// @author JDTWOR
// @created 2026-08-15
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/sena/cdattg-web-golang/services"
)

// ContratistaHandler expone CRUD e importación masiva de contratistas.
type ContratistaHandler struct {
	repo      repositories.ContratistaRepository
	svc       services.ContratistaService
	importSvc services.PersonalRolImportService
}

// NewContratistaHandler crea el handler con sus dependencias reales.
func NewContratistaHandler() *ContratistaHandler {
	return &ContratistaHandler{
		repo:      repositories.NewContratistaRepository(),
		svc:       services.NewContratistaService(),
		importSvc: services.NewPersonalRolImportService(),
	}
}

// GetAll devuelve lista paginada (query: page, page_size, search).
func (h *ContratistaHandler) GetAll(c *gin.Context) {
	page, pageSize, search := readPaginationParams(c)
	offset := (page - 1) * pageSize
	list, total, err := h.repo.FindAllPaginated(offset, pageSize, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	resp := make([]dto.RolPersonalItem, len(list))
	for i := range list {
		resp[i] = contratistaToRolItem(list[i])
	}
	c.JSON(http.StatusOK, gin.H{"data": resp, "total": total, "page": page, "page_size": pageSize})
}

// GetByID devuelve un contratista por su id (param: id).
func (h *ContratistaHandler) GetByID(c *gin.Context) {
	item, ok := getRolPersonalByID(c, func(id uint) (*dto.RolPersonalItem, error) { return h.svc.GetByID(id) })
	if !ok {
		return
	}
	c.JSON(http.StatusOK, item)
}

// Update actualiza el estado de un contratista (body: {"estado": bool}).
func (h *ContratistaHandler) Update(c *gin.Context) {
	if !updateRolPersonal(c, func(id uint, estado *bool) (*dto.RolPersonalItem, error) {
		return h.svc.Update(id, dto.UpdateContratistaRequest{Estado: estado})
	}) {
		return
	}
}

// Delete elimina (soft) un contratista por su id (param: id).
func (h *ContratistaHandler) Delete(c *gin.Context) {
	deleteRolPersonal(c, h.svc.Delete)
}

// CreateFromPersona crea un contratista a partir de una persona existente (body: {"persona_id": uint}).
func (h *ContratistaHandler) CreateFromPersona(c *gin.Context) {
	var req dto.CreateContratistaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errMsgDatosInvalidos, "details": err.Error()})
		return
	}
	item, err := h.svc.CreateFromPersona(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, item)
}

// ImportRolPersonal sube un Excel e importa contratistas (crea persona si no existe y vincula).
func (h *ContratistaHandler) ImportRolPersonal(c *gin.Context) {
	handlePersonalRolImport(c, h.importSvc, services.TipoRolContratista)
}

// ListImports devuelve el historial de importaciones de contratistas (query: limit).
func (h *ContratistaHandler) ListImports(c *gin.Context) {
	handlePersonalRolListImports(c, h.importSvc, services.TipoRolContratista)
}

// DownloadTemplate descarga la plantilla Excel para importar contratistas.
func (h *ContratistaHandler) DownloadTemplate(c *gin.Context) {
	handlePersonalRolTemplate(c, h.importSvc, services.TipoRolContratista)
}