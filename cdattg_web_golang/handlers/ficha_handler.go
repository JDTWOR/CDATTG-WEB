package handlers

import (
	"io"
	"net/http"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/sena/cdattg-web-golang/services"
	"github.com/xuri/excelize/v2"
)

type FichaHandler struct {
	svc       services.FichaService
	importSvc services.FichaImportService
	instRepo  repositories.InstructorRepository
}

func NewFichaHandler() *FichaHandler {
	return &FichaHandler{
		svc:       services.NewFichaService(),
		importSvc: services.NewFichaImportService(),
		instRepo:  repositories.NewInstructorRepository(),
	}
}

func (h *FichaHandler) GetAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	var programaID *uint
	if pid := c.Query("programa_id"); pid != "" {
		if v, err := strconv.ParseUint(pid, 10, 32); err == nil {
			u := uint(v)
			programaID = &u
		}
	}
	search := c.Query("q")
	var instructorID *uint
	if c.Query("mis_fichas") == "1" {
		if u, ok := c.Get("user"); ok {
			if user, _ := u.(*models.User); user != nil && user.PersonaID != nil {
				if inst, err := h.instRepo.FindByPersonaID(*user.PersonaID); err == nil {
					instructorID = &inst.ID
				}
			}
		}
		// Si no hay instructor (ej. superadministrador), devolver lista vacía
		if instructorID == nil {
			c.JSON(http.StatusOK, gin.H{"data": []dto.FichaCaracterizacionResponse{}, "total": 0, "page": page, "page_size": pageSize})
			return
		}
	}
	list, total, err := h.svc.FindAll(page, pageSize, programaID, instructorID, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list, "total": total, "page": page, "page_size": pageSize})
}

func (h *FichaHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	f, err := h.svc.FindByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, f)
}

func (h *FichaHandler) GetByIDWithDetail(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	f, err := h.svc.FindByIDWithDetail(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, f)
}

// GetCodigo devuelve solo el código de caracterización de la ficha (para nombres de archivo, etc.).
// Accesible con VER FICHA o con VER ASISTENCIA / instructor de la ficha.
func (h *FichaHandler) GetCodigo(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	codigo, err := h.svc.GetCodigo(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ficha": codigo})
}

func (h *FichaHandler) Create(c *gin.Context) {
	var req dto.FichaCaracterizacionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}
	f, err := h.svc.Create(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, f)
}

func (h *FichaHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	var req dto.FichaCaracterizacionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}
	f, err := h.svc.Update(uint(id), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, f)
}

func (h *FichaHandler) Delete(c *gin.Context) {
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

func (h *FichaHandler) ListInstructores(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	list, err := h.svc.ListInstructores(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list})
}

func (h *FichaHandler) AsignarInstructores(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	var req dto.AsignarInstructoresRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}
	if err := h.svc.AsignarInstructores(uint(id), req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Instructores asignados correctamente"})
}

func (h *FichaHandler) DesasignarInstructor(c *gin.Context) {
	fichaID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	instructorID, err := strconv.ParseUint(c.Param("instructorId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de instructor inválido"})
		return
	}
	if err := h.svc.DesasignarInstructor(uint(fichaID), uint(instructorID)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Instructor desasignado correctamente"})
}

func (h *FichaHandler) ListAprendices(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	list, err := h.svc.ListAprendices(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list})
}

func (h *FichaHandler) AsignarAprendices(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	var req dto.AsignarAprendicesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}
	if err := h.svc.AsignarAprendices(uint(id), req.Personas); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Aprendices asignados correctamente"})
}

func (h *FichaHandler) DesasignarAprendices(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	var req dto.DesasignarAprendicesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}
	if err := h.svc.DesasignarAprendices(uint(id), req.Personas); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Aprendices desasignados correctamente"})
}

// ImportFichas sube un Excel de reporte de aprendices (ficha de caracterización) e importa ficha y personas como aprendices.
func (h *FichaHandler) ImportFichas(c *gin.Context) {
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
	lower := strings.ToLower(file.Filename)
	if !strings.HasSuffix(lower, ".xlsx") && !strings.HasSuffix(lower, ".xls") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Solo se permiten archivos Excel (.xlsx o .xls)"})
		return
	}
	f, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo leer el archivo"})
		return
	}
	defer f.Close()
	buf, err := io.ReadAll(f)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error leyendo el archivo"})
		return
	}
	result, err := h.importSvc.ImportFromExcel(buf, file.Filename)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

// ExportAllExcel genera un archivo Excel con una hoja por ficha y su listado de aprendices activos.
func (h *FichaHandler) ExportAllExcel(c *gin.Context) {
	var fichas []models.FichaCaracterizacion
	if err := database.GetDB().
		Preload("ProgramaFormacion").
		Preload("Aprendices", "estado = ?", true).
		Preload("Aprendices.Persona").
		Order("ficha ASC").
		Find(&fichas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo consultar las fichas"})
		return
	}

	xlsx := excelize.NewFile()
	firstSheet := xlsx.GetSheetName(0)
	sheetIndex := 0
	usedSheetNames := map[string]int{}
	for _, ficha := range fichas {
		baseSheetName := sanitizeSheetName(ficha.Ficha)
		if baseSheetName == "" {
			baseSheetName = "Ficha"
		}
		sheetName := uniqueSheetName(baseSheetName, usedSheetNames)
		if sheetIndex == 0 {
			xlsx.SetSheetName(firstSheet, sheetName)
		} else {
			xlsx.NewSheet(sheetName)
		}
		sheetIndex++

		_ = xlsx.SetCellValue(sheetName, "A1", "Ficha")
		_ = xlsx.SetCellValue(sheetName, "B1", ficha.Ficha)
		_ = xlsx.SetCellValue(sheetName, "A2", "Programa de formación")
		if ficha.ProgramaFormacion != nil {
			_ = xlsx.SetCellValue(sheetName, "B2", ficha.ProgramaFormacion.Nombre)
		} else {
			_ = xlsx.SetCellValue(sheetName, "B2", "")
		}

		_ = xlsx.SetCellValue(sheetName, "A4", "Documento")
		_ = xlsx.SetCellValue(sheetName, "B4", "Nombre completo")
		_ = xlsx.SetCellValue(sheetName, "C4", "Correo")
		_ = xlsx.SetCellValue(sheetName, "D4", "Celular")

		row := 5
		for _, aprendiz := range ficha.Aprendices {
			if aprendiz.Persona == nil {
				continue
			}
			_ = xlsx.SetCellValue(sheetName, "A"+strconv.Itoa(row), aprendiz.Persona.NumeroDocumento)
			_ = xlsx.SetCellValue(sheetName, "B"+strconv.Itoa(row), aprendiz.Persona.GetFullName())
			_ = xlsx.SetCellValue(sheetName, "C"+strconv.Itoa(row), aprendiz.Persona.Email)
			_ = xlsx.SetCellValue(sheetName, "D"+strconv.Itoa(row), aprendiz.Persona.Celular)
			row++
		}

		_ = xlsx.SetColWidth(sheetName, "A", "D", 28)
	}

	buffer, err := xlsx.WriteToBuffer()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo generar el Excel"})
		return
	}

	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", `attachment; filename="fichas_aprendices.xlsx"`)
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer.Bytes())
}

func sanitizeSheetName(name string) string {
	n := strings.TrimSpace(name)
	replacer := strings.NewReplacer(
		"/", "-",
		"\\", "-",
		"*", "",
		"?", "",
		"[", "(",
		"]", ")",
		":", "-",
	)
	n = replacer.Replace(n)
	if utf8.RuneCountInString(n) > 31 {
		runes := []rune(n)
		n = string(runes[:31])
	}
	return n
}

func uniqueSheetName(base string, used map[string]int) string {
	if _, exists := used[base]; !exists {
		used[base] = 1
		return base
	}
	for {
		suffix := "_" + strconv.Itoa(used[base])
		maxLen := 31 - len(suffix)
		candidateBase := base
		if utf8.RuneCountInString(candidateBase) > maxLen {
			runes := []rune(candidateBase)
			candidateBase = string(runes[:maxLen])
		}
		candidate := candidateBase + suffix
		if _, exists := used[candidate]; !exists {
			used[base]++
			used[candidate] = 1
			return candidate
		}
		used[base]++
	}
}
