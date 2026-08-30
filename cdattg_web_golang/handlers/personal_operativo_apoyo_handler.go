// @module personal_operativo_apoyo_handler
// @description Endpoints HTTP de Personal Operativo y de Apoyo: CRUD e importación masiva desde Excel.
// @author JDTWOR
// @created 2026-08-14
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/sena/cdattg-web-golang/services"
)

// PersonalOperativoApoyoHandler expone CRUD e importación masiva de personal operativo y de apoyo.
type PersonalOperativoApoyoHandler struct {
	repo      repositories.PersonalOperativoApoyoRepository
	svc       services.PersonalOperativoApoyoService
	importSvc services.PersonalRolImportService
}

// NewPersonalOperativoApoyoHandler crea el handler con sus dependencias reales.
func NewPersonalOperativoApoyoHandler() *PersonalOperativoApoyoHandler {
	return &PersonalOperativoApoyoHandler{
		repo:      repositories.NewPersonalOperativoApoyoRepository(),
		svc:       services.NewPersonalOperativoApoyoService(),
		importSvc: services.NewPersonalRolImportService(),
	}
}

// GetAll devuelve lista paginada (query: page, page_size, search).
func (h *PersonalOperativoApoyoHandler) GetAll(c *gin.Context) {
	page, pageSize, search := readPaginationParams(c)
	offset := (page - 1) * pageSize
	list, total, err := h.repo.FindAllPaginated(offset, pageSize, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	resp := make([]dto.RolPersonalItem, len(list))
	for i := range list {
		resp[i] = personalOperativoApoyoToRolItem(list[i])
	}
	c.JSON(http.StatusOK, gin.H{"data": resp, "total": total, "page": page, "page_size": pageSize})
}

// GetByID devuelve un registro por su id (param: id).
func (h *PersonalOperativoApoyoHandler) GetByID(c *gin.Context) {
	item, ok := getRolPersonalByID(c, func(id uint) (*dto.RolPersonalItem, error) { return h.svc.GetByID(id) })
	if !ok {
		return
	}
	c.JSON(http.StatusOK, item)
}

// Update actualiza el estado (body: {"estado": bool}).
func (h *PersonalOperativoApoyoHandler) Update(c *gin.Context) {
	if !updateRolPersonal(c, func(id uint, estado *bool) (*dto.RolPersonalItem, error) {
		return h.svc.Update(id, dto.UpdatePersonalOperativoApoyoRequest{Estado: estado})
	}) {
		return
	}
}

// Delete elimina (soft) un registro por su id (param: id).
func (h *PersonalOperativoApoyoHandler) Delete(c *gin.Context) {
	deleteRolPersonal(c, h.svc.Delete)
}

// CreateFromPersona crea un registro a partir de una persona existente (body: {"persona_id": uint}).
func (h *PersonalOperativoApoyoHandler) CreateFromPersona(c *gin.Context) {
	var req dto.CreatePersonalOperativoApoyoRequest
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

// ImportRolPersonal sube un Excel e importa personal operativo y de apoyo.
func (h *PersonalOperativoApoyoHandler) ImportRolPersonal(c *gin.Context) {
	handlePersonalRolImport(c, h.importSvc, services.TipoRolPersonalOperativoApoyo)
}

// ListImports devuelve el historial de importaciones (query: limit).
func (h *PersonalOperativoApoyoHandler) ListImports(c *gin.Context) {
	handlePersonalRolListImports(c, h.importSvc, services.TipoRolPersonalOperativoApoyo)
}

// DownloadTemplate descarga la plantilla Excel.
func (h *PersonalOperativoApoyoHandler) DownloadTemplate(c *gin.Context) {
	handlePersonalRolTemplate(c, h.importSvc, services.TipoRolPersonalOperativoApoyo)
}