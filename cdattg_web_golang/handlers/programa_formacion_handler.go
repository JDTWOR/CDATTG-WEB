package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/services"
)

type ProgramaFormacionHandler struct {
	svc    services.ProgramaFormacionService
	importSvc services.ProgramaFormacionImportService
}

func NewProgramaFormacionHandler() *ProgramaFormacionHandler {
	return &ProgramaFormacionHandler{
		svc:       services.NewProgramaFormacionService(),
		importSvc: services.NewProgramaFormacionImportService(),
	}
}

func (h *ProgramaFormacionHandler) GetAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	search := c.DefaultQuery("search", "")

	list, total, err := h.svc.FindAll(page, pageSize, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list, "total": total, "page": page, "page_size": pageSize})
}

func (h *ProgramaFormacionHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	p, err := h.svc.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, p)
}

func (h *ProgramaFormacionHandler) Create(c *gin.Context) {
	var req dto.ProgramaFormacionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}
	p, err := h.svc.Create(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, p)
}

func (h *ProgramaFormacionHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	var req dto.ProgramaFormacionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}
	p, err := h.svc.Update(uint(id), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, p)
}

func (h *ProgramaFormacionHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	if err := h.svc.Delete(uint(id)); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

// ImportProgramas sube el Excel catálogo e importa solo programas TÉCNICO y TECNÓLOGO (versión más alta por código).
func (h *ProgramaFormacionHandler) ImportProgramas(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Se requiere el archivo 'file'"})
		return
	}
	if file.Size == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El archivo está vacío"})
		return
	}
	if file.Size > 20*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El archivo no debe superar 20 MB"})
		return
	}
	f, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo leer el archivo"})
		return
	}
	defer f.Close()
	buf := make([]byte, file.Size)
	if _, err := f.Read(buf); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error leyendo el archivo"})
		return
	}
	result, err := h.importSvc.ImportFromCatalogoExcel(buf, file.Filename)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}
