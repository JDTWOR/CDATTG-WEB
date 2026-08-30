// @module personal_administrativo_handler
// @description Endpoints HTTP del módulo Personal Administrativo: CRUD e importación masiva.
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

// PersonalAdministrativoHandler expone CRUD e importación masiva de personal administrativo.
type PersonalAdministrativoHandler struct {
	repo      repositories.PersonalAdministrativoRepository
	svc       services.PersonalAdministrativoService
	importSvc services.PersonalRolImportService
}

// NewPersonalAdministrativoHandler crea el handler de personal administrativo con dependencias reales.
func NewPersonalAdministrativoHandler() *PersonalAdministrativoHandler {
	return &PersonalAdministrativoHandler{
		repo:      repositories.NewPersonalAdministrativoRepository(),
		svc:       services.NewPersonalAdministrativoService(),
		importSvc: services.NewPersonalRolImportService(),
	}
}

// GetAll devuelve lista paginada de personal administrativo (query: page, page_size, search).
func (h *PersonalAdministrativoHandler) GetAll(c *gin.Context) {
	page, pageSize, search := readPaginationParams(c)
	offset := (page - 1) * pageSize
	list, total, err := h.repo.FindAllPaginated(offset, pageSize, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	resp := make([]dto.RolPersonalItem, len(list))
	for i := range list {
		resp[i] = personalAdministrativoToRolItem(list[i])
	}
	c.JSON(http.StatusOK, gin.H{"data": resp, "total": total, "page": page, "page_size": pageSize})
}

// GetByID devuelve un personal administrativo por su id (param: id).
func (h *PersonalAdministrativoHandler) GetByID(c *gin.Context) {
	item, ok := getRolPersonalByID(c, func(id uint) (*dto.RolPersonalItem, error) { return h.svc.GetByID(id) })
	if !ok {
		return
	}
	c.JSON(http.StatusOK, item)
}

// Update actualiza el estado de un personal administrativo (body: {"estado": bool}).
func (h *PersonalAdministrativoHandler) Update(c *gin.Context) {
	if !updateRolPersonal(c, func(id uint, estado *bool) (*dto.RolPersonalItem, error) {
		return h.svc.Update(id, dto.UpdatePersonalAdministrativoRequest{Estado: estado})
	}) {
		return
	}
}

// Delete elimina (soft) un personal administrativo por su id (param: id).
func (h *PersonalAdministrativoHandler) Delete(c *gin.Context) {
	deleteRolPersonal(c, h.svc.Delete)
}

// CreateFromPersona crea un personal administrativo desde una persona existente (body: {"persona_id": uint}).
func (h *PersonalAdministrativoHandler) CreateFromPersona(c *gin.Context) {
	var req dto.CreatePersonalAdministrativoRequest
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

// ImportRolPersonal sube un Excel e importa personal administrativo (crea persona si no existe y vincula).
func (h *PersonalAdministrativoHandler) ImportRolPersonal(c *gin.Context) {
	handlePersonalRolImport(c, h.importSvc, services.TipoRolPersonalAdministrativo)
}

// ListImports devuelve el historial de importaciones de personal administrativo (query: limit).
func (h *PersonalAdministrativoHandler) ListImports(c *gin.Context) {
	handlePersonalRolListImports(c, h.importSvc, services.TipoRolPersonalAdministrativo)
}

// DownloadTemplate descarga la plantilla Excel para importar personal administrativo.
func (h *PersonalAdministrativoHandler) DownloadTemplate(c *gin.Context) {
	handlePersonalRolTemplate(c, h.importSvc, services.TipoRolPersonalAdministrativo)
}