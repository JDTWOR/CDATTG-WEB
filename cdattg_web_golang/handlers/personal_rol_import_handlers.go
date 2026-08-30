// @module personal_rol_import_handlers
// @description Handlers HTTP de importación masiva, historial y plantilla Excel del módulo Personal.
// @author JDTWOR
// @created 2026-08-14
package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/services"
)

// handlePersonalRolImport procesa la subida de un Excel (campo "file", máx 10 MB) y ejecuta la importación.
// Parámetros: c (contexto Gin), importSvc (servicio de importación), tipo (personal_operativo_apoyo | personal_administrativo | contratista).
// Responde 200 con ImportResult o 400/401/500 con el error.
func handlePersonalRolImport(c *gin.Context, importSvc services.PersonalRolImportService, tipo string) {
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

	result, err := importSvc.ImportFromExcel(tipo, buf, file.Filename, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// handlePersonalRolListImports responde el historial de importaciones del tipo indicado (query: limit).
func handlePersonalRolListImports(c *gin.Context, importSvc services.PersonalRolImportService, tipo string) {
	limit, err := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if err != nil || limit < 1 {
		limit = 50
	}
	list, err := importSvc.ListImports(tipo, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list})
}

// handlePersonalRolTemplate descarga la plantilla Excel generada para el tipo indicado.
func handlePersonalRolTemplate(c *gin.Context, importSvc services.PersonalRolImportService, tipo string) {
	buf, filename, err := importSvc.GenerarPlantilla(tipo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf)
}