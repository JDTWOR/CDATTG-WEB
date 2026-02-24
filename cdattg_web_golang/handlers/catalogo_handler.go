package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/repositories"
)

type CatalogoHandler struct {
	repo repositories.CatalogoRepository
}

func NewCatalogoHandler() *CatalogoHandler {
	return &CatalogoHandler{repo: repositories.NewCatalogoRepository()}
}

func (h *CatalogoHandler) GetSedes(c *gin.Context) {
	list, err := h.repo.FindSedes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	resp := make([]dto.SedeItem, len(list))
	for i := range list {
		resp[i] = dto.SedeItem{ID: list[i].ID, Nombre: list[i].Nombre}
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

func (h *CatalogoHandler) GetAmbientes(c *gin.Context) {
	list, err := h.repo.FindAmbientes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	resp := make([]dto.AmbienteItem, len(list))
	for i := range list {
		resp[i] = dto.AmbienteItem{ID: list[i].ID, Nombre: list[i].Nombre}
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

func (h *CatalogoHandler) GetModalidadesFormacion(c *gin.Context) {
	list, err := h.repo.FindModalidadesFormacion()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	resp := make([]dto.ModalidadFormacionItem, len(list))
	for i := range list {
		resp[i] = dto.ModalidadFormacionItem{ID: list[i].ID, Nombre: list[i].Nombre, Codigo: list[i].Codigo}
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

func (h *CatalogoHandler) GetJornadas(c *gin.Context) {
	list, err := h.repo.FindJornadas()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	resp := make([]dto.JornadaItem, len(list))
	for i := range list {
		resp[i] = dto.JornadaItem{ID: list[i].ID, Nombre: list[i].Nombre}
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

func (h *CatalogoHandler) GetDiasFormacion(c *gin.Context) {
	list, err := h.repo.FindDiasFormacion()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	resp := make([]dto.DiaFormacionItem, len(list))
	for i := range list {
		resp[i] = dto.DiaFormacionItem{ID: list[i].ID, Nombre: list[i].Nombre, Codigo: list[i].Codigo}
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

func (h *CatalogoHandler) GetRegionales(c *gin.Context) {
	list, err := h.repo.FindRegionales()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	resp := make([]dto.RegionalItem, len(list))
	for i := range list {
		resp[i] = dto.RegionalItem{ID: list[i].ID, Nombre: list[i].Nombre}
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

func (h *CatalogoHandler) GetPaises(c *gin.Context) {
	list, err := h.repo.FindPaises()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	resp := make([]dto.PaisItem, len(list))
	for i := range list {
		resp[i] = dto.PaisItem{ID: list[i].ID, Nombre: list[i].Nombre}
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

func (h *CatalogoHandler) GetDepartamentos(c *gin.Context) {
	paisIDStr := c.Query("pais_id")
	if paisIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "pais_id requerido"})
		return
	}
	var paisID uint
	if _, err := fmt.Sscanf(paisIDStr, "%d", &paisID); err != nil || paisID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "pais_id inválido"})
		return
	}
	list, err := h.repo.FindDepartamentosByPais(paisID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	resp := make([]dto.DepartamentoItem, len(list))
	for i := range list {
		resp[i] = dto.DepartamentoItem{ID: list[i].ID, Nombre: list[i].Nombre}
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

func (h *CatalogoHandler) GetMunicipios(c *gin.Context) {
	depIDStr := c.Query("departamento_id")
	if depIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "departamento_id requerido"})
		return
	}
	var depID uint
	if _, err := fmt.Sscanf(depIDStr, "%d", &depID); err != nil || depID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "departamento_id inválido"})
		return
	}
	list, err := h.repo.FindMunicipiosByDepartamento(depID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	resp := make([]dto.MunicipioItem, len(list))
	for i := range list {
		resp[i] = dto.MunicipioItem{ID: list[i].ID, Nombre: list[i].Nombre}
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

func (h *CatalogoHandler) GetTiposDocumento(c *gin.Context) {
	list, err := h.repo.FindTiposDocumento()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	resp := make([]dto.ParametroItem, len(list))
	for i := range list {
		resp[i] = dto.ParametroItem{ID: list[i].ID, Name: list[i].Nombre}
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

func (h *CatalogoHandler) GetGeneros(c *gin.Context) {
	list, err := h.repo.FindGeneros()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	resp := make([]dto.ParametroItem, len(list))
	for i := range list {
		resp[i] = dto.ParametroItem{ID: list[i].ID, Name: list[i].Nombre}
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

func (h *CatalogoHandler) GetPersonaCaracterizacion(c *gin.Context) {
	list, err := h.repo.FindPersonaCaracterizacion()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	resp := make([]dto.ParametroItem, len(list))
	for i := range list {
		resp[i] = dto.ParametroItem{ID: list[i].ID, Name: list[i].Nombre}
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}
