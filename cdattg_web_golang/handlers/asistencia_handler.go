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
	svc           services.AsistenciaService
	instRepo      repositories.InstructorRepository
	instFichaRepo repositories.InstructorFichaRepository
	asistenciaRepo repositories.AsistenciaRepository
	repoAA        repositories.AsistenciaAprendizRepository
}

func NewAsistenciaHandler() *AsistenciaHandler {
	return &AsistenciaHandler{
		svc:            services.NewAsistenciaService(),
		instRepo:       repositories.NewInstructorRepository(),
		instFichaRepo:  repositories.NewInstructorFichaRepository(),
		asistenciaRepo: repositories.NewAsistenciaRepository(),
		repoAA:         repositories.NewAsistenciaAprendizRepository(),
	}
}

// getInstructorFichaIDForCurrentUser obtiene el InstructorFichaID del usuario autenticado para la ficha dada. Devuelve nil si no es instructor de esa ficha.
func (h *AsistenciaHandler) getInstructorFichaIDForCurrentUser(c *gin.Context, fichaID uint) *uint {
	u, _ := c.Get("user")
	user, _ := u.(*models.User)
	if user == nil || user.PersonaID == nil {
		return nil
	}
	inst, err := h.instRepo.FindByPersonaID(*user.PersonaID)
	if err != nil || inst == nil {
		return nil
	}
	ifc, err := h.instFichaRepo.FindByFichaIDAndInstructorID(fichaID, inst.ID)
	if err != nil || ifc == nil {
		return nil
	}
	return &ifc.ID
}

func (h *AsistenciaHandler) CreateSesion(c *gin.Context) {
	var req dto.AsistenciaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inv?lidos", "details": err.Error()})
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

// EntrarTomarAsistencia obtiene o crea la sesi?n de asistencia del instructor actual para la ficha. Resuelve instructor por persona_id (igual que la lista de fichas).
func (h *AsistenciaHandler) EntrarTomarAsistencia(c *gin.Context) {
	var req dto.EntrarTomarAsistenciaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ficha_id requerido"})
		return
	}
	u, _ := c.Get("user")
	user, _ := u.(*models.User)
	if user == nil || user.PersonaID == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Su cuenta no est? vinculada a un instructor. Contacte al administrador."})
		return
	}
	inst, err := h.instRepo.FindByPersonaID(*user.PersonaID)
	if err != nil || inst == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Su cuenta no est? vinculada a un instructor. Contacte al administrador."})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inv?lido"})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inv?lido"})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "ficha_id inv?lido"})
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

// StartAsistenciaAutoFinalize inicia la goroutine que finaliza sesiones al terminar el horario de la jornada (m?s extensi?n).
// Los instructores no pueden finalizar manualmente; la finalizaci?n es autom?tica.
func StartAsistenciaAutoFinalize(h *AsistenciaHandler) {
	run := func() {
		h.svc.FinalizarSesionesVencidas()
		GetAsistenciaDashboardHub().BroadcastRefresh()
	}
	run() // una vez al arranque
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			run()
		}
	}()
}

func (h *AsistenciaHandler) RegistrarIngreso(c *gin.Context) {
	var req dto.AsistenciaAprendizRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inv?lidos", "details": err.Error()})
		return
	}
	var fichaID uint
	if asist, err := h.asistenciaRepo.FindByID(req.AsistenciaID); err == nil && asist != nil {
		if asist.InstructorFicha != nil {
			fichaID = asist.InstructorFicha.FichaID
		} else if ifc, _ := h.instFichaRepo.FindByID(asist.InstructorFichaID); ifc != nil {
			fichaID = ifc.FichaID
		}
	}
	instructorFichaID := h.getInstructorFichaIDForCurrentUser(c, fichaID)
	resp, err := h.svc.RegistrarIngreso(req, instructorFichaID)
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inv?lidos", "details": err.Error()})
		return
	}
	var fichaID uint
	if asist, err := h.asistenciaRepo.FindByID(req.AsistenciaID); err == nil && asist != nil {
		if asist.InstructorFicha != nil {
			fichaID = asist.InstructorFicha.FichaID
		} else if ifc, _ := h.instFichaRepo.FindByID(asist.InstructorFichaID); ifc != nil {
			fichaID = ifc.FichaID
		}
	}
	instructorFichaID := h.getInstructorFichaIDForCurrentUser(c, fichaID)
	resp, err := h.svc.RegistrarIngresoPorDocumento(req, instructorFichaID)
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inv?lido"})
		return
	}
	var fichaID uint
	if aa, errAA := h.repoAA.FindByID(uint(id)); errAA == nil && aa != nil && aa.Asistencia != nil {
		if aa.Asistencia.InstructorFicha != nil {
			fichaID = aa.Asistencia.InstructorFicha.FichaID
		} else if ifc, _ := h.instFichaRepo.FindByID(aa.Asistencia.InstructorFichaID); ifc != nil {
			fichaID = ifc.FichaID
		}
	}
	instructorFichaID := h.getInstructorFichaIDForCurrentUser(c, fichaID)
	resp, err := h.svc.RegistrarSalida(uint(id), instructorFichaID)
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inv?lido"})
		return
	}
	var req dto.AsistenciaAprendizObservacionesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "observaciones inv?lido"})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de asistencia o aprendiz inv?lido"})
		return
	}
	var req dto.AsistenciaAprendizObservacionesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "observaciones inv?lido"})
		return
	}
	resp, err := h.svc.CrearOActualizarObservaciones(uint(asistenciaID), uint(aprendizID), req.Observaciones, req.TipoObservacionIDs)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// ListTiposObservacionAsistencia devuelve el catálogo de tipos de observación activos (para dropdown).
func (h *AsistenciaHandler) ListTiposObservacionAsistencia(c *gin.Context) {
	list, err := h.svc.ListTiposObservacionAsistencia()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list})
}

// CrearTipoObservacionAsistencia crea un nuevo tipo de observación (solo superadmin).
func (h *AsistenciaHandler) CrearTipoObservacionAsistencia(c *gin.Context) {
	var req dto.TipoObservacionAsistenciaCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "datos inválidos", "details": err.Error()})
		return
	}
	item, err := h.svc.CrearTipoObservacionAsistencia(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *AsistenciaHandler) ListAprendicesEnSesion(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inv?lido"})
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
		c.JSON(http.StatusForbidden, gin.H{"error": "Su cuenta no est? vinculada a un instructor. Contacte al administrador."})
		return
	}
	inst, err := h.instRepo.FindByPersonaID(*user.PersonaID)
	if err != nil || inst == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Su cuenta no est? vinculada a un instructor. Contacte al administrador."})
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

// ListPendientesRevisionAdmin permite a SUPER ADMINISTRADOR o BIENESTAR ver los pendientes de un instructor espec?fico.
// Query: instructor_id (obligatorio), fecha (opcional, YYYY-MM-DD; si se omite, trae todos los pendientes).
func (h *AsistenciaHandler) ListPendientesRevisionAdmin(c *gin.Context) {
	instructorIDStr := c.Query("instructor_id")
	if instructorIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "instructor_id requerido"})
		return
	}
	instructorID64, err := strconv.ParseUint(instructorIDStr, 10, 32)
	if err != nil || instructorID64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "instructor_id inv?lido"})
		return
	}
	fecha := c.Query("fecha")
	list, err := h.svc.ListPendientesRevision(uint(instructorID64), fecha)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list})
}

// AjustarEstadoAprendiz permite clasificar un registro de asistencia de aprendiz
// (asistencia completa, parcial, abandono de jornada o pendiente de revisi?n).
func (h *AsistenciaHandler) AjustarEstadoAprendiz(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("asistenciaAprendizId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inv?lido"})
		return
	}
	var req dto.AsistenciaAprendizEstadoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inv?lidos", "details": err.Error()})
		return
	}
	var fichaID uint
	if aa, errAA := h.repoAA.FindByID(uint(id)); errAA == nil && aa != nil && aa.Asistencia != nil {
		if aa.Asistencia.InstructorFicha != nil {
			fichaID = aa.Asistencia.InstructorFicha.FichaID
		} else if ifc, _ := h.instFichaRepo.FindByID(aa.Asistencia.InstructorFichaID); ifc != nil {
			fichaID = ifc.FichaID
		}
	}
	instructorFichaID := h.getInstructorFichaIDForCurrentUser(c, fichaID)
	resp, err := h.svc.AjustarEstadoAprendiz(uint(id), req.Estado, req.Motivo, instructorFichaID)
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

// GetCasosBienestar devuelve aprendices con N+ inasistencias en el per?odo (oficina de bienestar). Query: dias (default 30), min_fallas (default 3), sede_id (opcional).
func (h *AsistenciaHandler) GetCasosBienestar(c *gin.Context) {
	dias := 30
	if s := c.Query("dias"); s != "" {
		if n, err := strconv.Atoi(s); err == nil && n > 0 {
			dias = n
		}
	}
	minFallas := 1
	if s := c.Query("min_fallas"); s != "" {
		if n, err := strconv.Atoi(s); err == nil && n >= 0 {
			minFallas = n
		}
	}
	var sedeID *uint
	if s := c.Query("sede_id"); s != "" {
		if id, err := strconv.ParseUint(s, 10, 32); err == nil {
			u := uint(id)
			sedeID = &u
		}
	}
	resp, err := h.svc.GetCasosBienestar(sedeID, dias, minFallas)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// GetDetalleInasistenciasAprendiz devuelve las fechas de inasistencia y observaciones de un aprendiz en una ficha.
func (h *AsistenciaHandler) GetDetalleInasistenciasAprendiz(c *gin.Context) {
	fichaNumero := c.Param("fichaNumero")
	aprendizID64, err := strconv.ParseUint(c.Param("aprendizId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "aprendiz_id inválido"})
		return
	}
	dias := 30
	if s := c.Query("dias"); s != "" {
		if n, err := strconv.Atoi(s); err == nil && n > 0 {
			dias = n
		}
	}
	sedeNombre := c.Query("sede")
	resp, err := h.svc.GetDetalleInasistenciasAprendiz(fichaNumero, uint(aprendizID64), dias, sedeNombre)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}
