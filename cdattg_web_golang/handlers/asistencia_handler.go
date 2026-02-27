package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/sena/cdattg-web-golang/services"
)

type AsistenciaHandler struct {
	svc      services.AsistenciaService
	instRepo repositories.InstructorRepository
}

func NewAsistenciaHandler() *AsistenciaHandler {
	return &AsistenciaHandler{
		svc:      services.NewAsistenciaService(),
		instRepo: repositories.NewInstructorRepository(),
	}
}

func (h *AsistenciaHandler) CreateSesion(c *gin.Context) {
	var req dto.AsistenciaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}
	resp, err := h.svc.CreateSesion(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	GetAsistenciaDashboardHub().BroadcastRefresh()
	c.JSON(http.StatusCreated, resp)
}

// EntrarTomarAsistencia obtiene o crea la sesión de asistencia del instructor actual para la ficha. Resuelve instructor por persona_id (igual que la lista de fichas).
func (h *AsistenciaHandler) EntrarTomarAsistencia(c *gin.Context) {
	var req dto.EntrarTomarAsistenciaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ficha_id requerido"})
		return
	}
	u, _ := c.Get("user")
	user, _ := u.(*models.User)
	if user == nil || user.PersonaID == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Su cuenta no está vinculada a un instructor. Contacte al administrador."})
		return
	}
	inst, err := h.instRepo.FindByPersonaID(*user.PersonaID)
	if err != nil || inst == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Su cuenta no está vinculada a un instructor. Contacte al administrador."})
		return
	}
	resp, err := h.svc.EntrarTomarAsistencia(inst.ID, req.FichaID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *AsistenciaHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	resp, err := h.svc.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *AsistenciaHandler) ListByInstructorFicha(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("instructorFichaId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	list, err := h.svc.ListByInstructorFichaID(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list})
}

func (h *AsistenciaHandler) ListByFichaAndFechas(c *gin.Context) {
	fichaID, err := strconv.ParseUint(c.Param("fichaId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ficha_id inválido"})
		return
	}
	fechaInicio := c.Query("fecha_inicio")
	fechaFin := c.Query("fecha_fin")
	if fechaInicio == "" || fechaFin == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "fecha_inicio y fecha_fin son requeridos"})
		return
	}
	list, err := h.svc.ListByFichaIDAndFechas(uint(fichaID), fechaInicio, fechaFin)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list})
}

func (h *AsistenciaHandler) Finalizar(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	resp, err := h.svc.Finalizar(uint(id))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	GetAsistenciaDashboardHub().BroadcastRefresh()
	c.JSON(http.StatusOK, resp)
}

func (h *AsistenciaHandler) RegistrarIngreso(c *gin.Context) {
	var req dto.AsistenciaAprendizRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}
	resp, err := h.svc.RegistrarIngreso(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	GetAsistenciaDashboardHub().BroadcastRefresh()
	c.JSON(http.StatusCreated, resp)
}

func (h *AsistenciaHandler) RegistrarIngresoPorDocumento(c *gin.Context) {
	var req dto.AsistenciaIngresoPorDocumentoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}
	resp, err := h.svc.RegistrarIngresoPorDocumento(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	GetAsistenciaDashboardHub().BroadcastRefresh()
	c.JSON(http.StatusCreated, resp)
}

func (h *AsistenciaHandler) RegistrarSalida(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("asistenciaAprendizId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	resp, err := h.svc.RegistrarSalida(uint(id))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	GetAsistenciaDashboardHub().BroadcastRefresh()
	c.JSON(http.StatusOK, resp)
}

func (h *AsistenciaHandler) ActualizarObservaciones(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("asistenciaAprendizId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	var req dto.AsistenciaAprendizObservacionesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "observaciones inválido"})
		return
	}
	resp, err := h.svc.ActualizarObservaciones(uint(id), req.Observaciones)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *AsistenciaHandler) CrearOActualizarObservaciones(c *gin.Context) {
	asistenciaID, err1 := strconv.ParseUint(c.Param("id"), 10, 32)
	aprendizID, err2 := strconv.ParseUint(c.Param("aprendizId"), 10, 32)
	if err1 != nil || err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de asistencia o aprendiz inválido"})
		return
	}
	var req dto.AsistenciaAprendizObservacionesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "observaciones inválido"})
		return
	}
	resp, err := h.svc.CrearOActualizarObservaciones(uint(asistenciaID), uint(aprendizID), req.Observaciones)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *AsistenciaHandler) ListAprendicesEnSesion(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	list, err := h.svc.ListAprendicesEnSesion(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list})
}

// ListPendientesRevision devuelve los registros de asistencia de aprendices
// marcados como requiere_revision para el instructor autenticado en una fecha.
func (h *AsistenciaHandler) ListPendientesRevision(c *gin.Context) {
	u, _ := c.Get("user")
	user, _ := u.(*models.User)
	if user == nil || user.PersonaID == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Su cuenta no está vinculada a un instructor. Contacte al administrador."})
		return
	}
	inst, err := h.instRepo.FindByPersonaID(*user.PersonaID)
	if err != nil || inst == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Su cuenta no está vinculada a un instructor. Contacte al administrador."})
		return
	}
	fecha := c.Query("fecha")
	if fecha == "" {
		fecha = time.Now().Format("2006-01-02")
	}
	list, err := h.svc.ListPendientesRevision(inst.ID, fecha)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list})
}

// AjustarEstadoAprendiz permite clasificar un registro de asistencia de aprendiz
// (asistencia completa, parcial, abandono de jornada o pendiente de revisión).
func (h *AsistenciaHandler) AjustarEstadoAprendiz(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("asistenciaAprendizId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	var req dto.AsistenciaAprendizEstadoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos", "details": err.Error()})
		return
	}
	resp, err := h.svc.AjustarEstadoAprendiz(uint(id), req.Estado, req.Motivo)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// GetDashboard devuelve el resumen para el dashboard de asistencia (solo superadmin). Query: sede_id (opcional), fecha (opcional, default hoy).
func (h *AsistenciaHandler) GetDashboard(c *gin.Context) {
	fecha := c.Query("fecha")
	if fecha == "" {
		fecha = time.Now().Format("2006-01-02")
	}
	var sedeID *uint
	if s := c.Query("sede_id"); s != "" {
		id, err := strconv.ParseUint(s, 10, 32)
		if err == nil {
			u := uint(id)
			sedeID = &u
		}
	}
	resp, err := h.svc.GetDashboard(sedeID, fecha)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if resp.Fecha == "" {
		resp.Fecha = fecha
	}
	c.JSON(http.StatusOK, resp)
}
