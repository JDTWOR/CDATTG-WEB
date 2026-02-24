package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/services"
	"github.com/xuri/excelize/v2"
)

type PersonaHandler struct {
	personaService   services.PersonaService
	personaImportSvc services.PersonaImportService
}

func NewPersonaHandler() *PersonaHandler {
	personaSvc := services.NewPersonaService()
	return &PersonaHandler{
		personaService:   personaSvc,
		personaImportSvc: services.NewPersonaImportService(personaSvc),
	}
}

// NewPersonaHandlerWithServices permite inyectar servicios (p. ej. para tests).
func NewPersonaHandlerWithServices(personaService services.PersonaService, personaImportSvc services.PersonaImportService) *PersonaHandler {
	return &PersonaHandler{
		personaService:   personaService,
		personaImportSvc: personaImportSvc,
	}
}

// GetAll obtiene todas las personas con paginación y búsqueda por nombre o documento
func (h *PersonaHandler) GetAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	search := strings.TrimSpace(c.DefaultQuery("search", ""))

	personas, total, err := h.personaService.FindAll(page, pageSize, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      personas,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// GetByID obtiene una persona por ID
func (h *PersonaHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	persona, err := h.personaService.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Persona no encontrada"})
		return
	}

	c.JSON(http.StatusOK, persona)
}

// Create crea una nueva persona
func (h *PersonaHandler) Create(c *gin.Context) {
	var req dto.PersonaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}

	persona, err := h.personaService.Create(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, persona)
}

// Update actualiza una persona existente
func (h *PersonaHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req dto.PersonaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}

	persona, err := h.personaService.Update(uint(id), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, persona)
}

// Delete elimina una persona
func (h *PersonaHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.personaService.Delete(uint(id)); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Persona no encontrada"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// ResetPassword restablece la contraseña del usuario de la persona a su número de documento.
func (h *PersonaHandler) ResetPassword(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	if err := h.personaService.ResetPassword(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Contraseña restablecida al número de documento"})
}

// ImportPersonas sube un Excel e importa personas (validación de duplicados por documento, correo, celular).
func (h *PersonaHandler) ImportPersonas(c *gin.Context) {
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

	// Si el cliente pide streaming, responder con NDJSON y progreso en tiempo real
	if c.GetHeader("X-Stream-Progress") == "true" {
		h.importPersonasStream(c, buf, file.Filename, userID)
		return
	}

	result, err := h.personaImportSvc.ImportFromExcel(buf, file.Filename, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// importPersonasStream escribe NDJSON (progress/done/error) y hace flush tras cada línea.
func (h *PersonaHandler) importPersonasStream(c *gin.Context, buf []byte, filename string, userID uint) {
	c.Header("Content-Type", "application/x-ndjson")
	c.Header("Cache-Control", "no-cache")
	c.Header("X-Accel-Buffering", "no")
	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		_ = json.NewEncoder(c.Writer).Encode(map[string]string{"type": "error", "error": "streaming no soportado"})
		return
	}
	result, err := h.personaImportSvc.ImportFromExcelWithProgress(buf, filename, userID, func(p services.ImportProgress) {
		_ = json.NewEncoder(c.Writer).Encode(p)
		flusher.Flush()
	})
	if err != nil {
		_ = json.NewEncoder(c.Writer).Encode(map[string]string{"type": "error", "error": err.Error()})
		flusher.Flush()
		return
	}
	// "done" ya se envió en el callback; enviar resultado final por si el cliente lo usa
	_ = json.NewEncoder(c.Writer).Encode(map[string]interface{}{
		"type":             "result",
		"processed_count":  result.ProcessedCount,
		"duplicates_count": result.DuplicatesCount,
		"error_count":      result.ErrorCount,
		"status":           result.Status,
	})
	flusher.Flush()
}

// ListPersonaImports devuelve el historial de importaciones.
func (h *PersonaHandler) ListPersonaImports(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	list, err := h.personaImportSvc.ListImports(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list})
}

// DownloadPersonaImportTemplate devuelve una plantilla Excel para importar personas.
func (h *PersonaHandler) DownloadPersonaImportTemplate(c *gin.Context) {
	f := excelize.NewFile()
	sheet := "Sheet1"
	headers := []string{"tipo_documento", "numero_documento", "primer_nombre", "segundo_nombre", "primer_apellido", "segundo_apellido", "correo", "celular"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue(sheet, cell, h)
	}
	_ = f.SetCellValue(sheet, "A2", "CC")
	_ = f.SetCellValue(sheet, "B2", "12345678")
	_ = f.SetCellValue(sheet, "C2", "Ejemplo")
	_ = f.SetCellValue(sheet, "D2", "")
	_ = f.SetCellValue(sheet, "E2", "Apellido")
	_ = f.SetCellValue(sheet, "F2", "")
	_ = f.SetCellValue(sheet, "G2", "ejemplo@correo.com")
	_ = f.SetCellValue(sheet, "H2", "3001234567")

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generando plantilla"})
		return
	}
	c.Header("Content-Disposition", "attachment; filename=plantilla_importar_personas.xlsx")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}
