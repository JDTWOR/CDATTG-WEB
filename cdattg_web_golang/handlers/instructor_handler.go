package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/sena/cdattg-web-golang/services"
)

type InstructorHandler struct {
	repo               repositories.InstructorRepository
	svc                services.InstructorService
	instructorImportSvc services.InstructorImportService
}

func NewInstructorHandler() *InstructorHandler {
	return &InstructorHandler{
		repo:               repositories.NewInstructorRepository(),
		svc:                services.NewInstructorService(),
		instructorImportSvc: services.NewInstructorImportService(),
	}
}

// GetAll devuelve lista de instructores
func (h *InstructorHandler) GetAll(c *gin.Context) {
	list, err := h.repo.FindAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	resp := make([]dto.InstructorItem, len(list))
	for i := range list {
		resp[i] = instructorToItem(list[i])
	}
	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// GetByID devuelve un instructor por ID
func (h *InstructorHandler) GetByID(c *gin.Context) {
	idNum, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	item, err := h.svc.GetByID(uint(idNum))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, item)
}

// Update actualiza regional y/o estado del instructor
func (h *InstructorHandler) Update(c *gin.Context) {
	idNum, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	var req dto.UpdateInstructorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}
	item, err := h.svc.Update(uint(idNum), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, item)
}

// Delete elimina un instructor
func (h *InstructorHandler) Delete(c *gin.Context) {
	idNum, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	if err := h.svc.Delete(uint(idNum)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

// CreateFromPersona crea un instructor a partir de una persona
func (h *InstructorHandler) CreateFromPersona(c *gin.Context) {
	var req dto.CreateInstructorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}
	item, err := h.svc.CreateFromPersona(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, item)
}

// ImportInstructores sube un Excel e importa instructores (crea persona si no existe y vincula como instructor).
// Query opcional: regional_id (ID de regional por defecto para los instructores creados).
func (h *InstructorHandler) ImportInstructores(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}
	userID := userIDVal.(uint)

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Se requiere el archivo 'file'"})
		return
	}
	if file.Size == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El archivo está vacío"})
		return
	}
	if file.Size > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El archivo no debe superar 10 MB"})
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

	var regionalID *uint
	if idStr := c.Query("regional_id"); idStr != "" {
		if id, parseErr := strconv.ParseUint(idStr, 10, 32); parseErr == nil && id > 0 {
			rid := uint(id)
			regionalID = &rid
		}
	}

	result, err := h.instructorImportSvc.ImportFromExcel(buf, file.Filename, userID, regionalID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// ListInstructorImports devuelve el historial de importaciones de instructores.
func (h *InstructorHandler) ListInstructorImports(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	list, err := h.instructorImportSvc.ListImports(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list})
}

// instructorToItem construye el DTO; documento y nombre siempre desde Persona (solo id en instructor)
func instructorToItem(m models.Instructor) dto.InstructorItem {
	var nombre, doc, regionalNombre string
	if m.Persona != nil {
		nombre = m.Persona.GetFullName()
		doc = m.Persona.NumeroDocumento
	}
	if nombre == "" {
		nombre = m.NombreCompletoCache
	}
	if doc == "" {
		doc = m.NumeroDocumentoCache
	}
	if m.Regional != nil {
		regionalNombre = m.Regional.Nombre
	}
	return dto.InstructorItem{
		ID:              m.ID,
		Nombre:          nombre,
		NumeroDocumento: doc,
		RegionalID:      m.RegionalID,
		RegionalNombre:  regionalNombre,
		Estado:          m.Status,
	}
}
