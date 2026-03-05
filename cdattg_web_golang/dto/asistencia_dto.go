package dto

import "time"

// EntrarTomarAsistenciaRequest para que el instructor entre directo a tomar asistencia (obtiene o crea sesión para él en esa ficha).
type EntrarTomarAsistenciaRequest struct {
	FichaID uint `json:"ficha_id" binding:"required"`
}

// AsistenciaRequest crear sesión de asistencia
type AsistenciaRequest struct {
	InstructorFichaID uint       `json:"instructor_ficha_id" binding:"required"`
	Fecha             string     `json:"fecha" binding:"required"` // YYYY-MM-DD
	HoraInicio        *time.Time `json:"hora_inicio"`
}

// AsistenciaResponse sesión de asistencia
type AsistenciaResponse struct {
	ID               uint       `json:"id"`
	InstructorFichaID uint      `json:"instructor_ficha_id"`
	FichaID          uint      `json:"ficha_id"`
	FichaNumero      string    `json:"ficha_numero,omitempty"`
	Fecha            time.Time  `json:"fecha"`
	HoraInicio       *time.Time `json:"hora_inicio"`
	HoraFin          *time.Time `json:"hora_fin"`
	IsFinished       bool      `json:"is_finished"`
	Observaciones    string    `json:"observaciones"`
	CantidadAprendices int      `json:"cantidad_aprendices,omitempty"`
}

// AsistenciaAprendizRequest registrar ingreso
type AsistenciaAprendizRequest struct {
	AsistenciaID uint `json:"asistencia_id" binding:"required"`
	AprendizID   uint `json:"aprendiz_id" binding:"required"`
}

// AsistenciaIngresoPorDocumentoRequest registrar ingreso por número de documento (manual o QR)
type AsistenciaIngresoPorDocumentoRequest struct {
	AsistenciaID    uint   `json:"asistencia_id" binding:"required"`
	NumeroDocumento string `json:"numero_documento" binding:"required"`
}

// AsistenciaAprendizObservacionesRequest actualizar observaciones de un registro de asistencia-aprendiz
type AsistenciaAprendizObservacionesRequest struct {
	Observaciones string `json:"observaciones"`
}

// AsistenciaAprendizResponse registro de asistencia de un aprendiz
type AsistenciaAprendizResponse struct {
	ID              uint       `json:"id"`
	AsistenciaID    uint       `json:"asistencia_id"`
	AprendizID      uint       `json:"aprendiz_id"`
	AprendizNombre  string     `json:"aprendiz_nombre,omitempty"`
	NumeroDocumento string     `json:"numero_documento,omitempty"`
	HoraIngreso     *time.Time `json:"hora_ingreso"`
	HoraSalida      *time.Time `json:"hora_salida"`
	Observaciones   string     `json:"observaciones"`
	// Información de ficha (cuando esté disponible)
	FichaID     uint   `json:"ficha_id,omitempty"`
	FichaNumero string `json:"ficha_numero,omitempty"`
	// Estado de la asistencia en la sesión (backend):
	// - "" (vacío): sin clasificar
	// - "ASISTENCIA_COMPLETA"
	// - "ASISTENCIA_PARCIAL"
	// - "ABANDONO_JORNADA"
	// - "REGISTRO_POR_CORREGIR"
	Estado           string `json:"estado,omitempty"`
	RequiereRevision bool   `json:"requiere_revision,omitempty"`
	MotivoAjuste     string `json:"motivo_ajuste,omitempty"`
	// TipoRegistro: "ingreso", "salida" o "asistencia_completa" (por documento/QR)
	TipoRegistro string `json:"tipo_registro,omitempty"`
	Mensaje      string `json:"mensaje,omitempty"`
	// Quién registró ingreso/salida (auditoría)
	InstructorFichaIDRegistroIngreso *uint  `json:"instructor_ficha_id_registro_ingreso,omitempty"`
	InstructorFichaIDRegistroSalida  *uint  `json:"instructor_ficha_id_registro_salida,omitempty"`
	InstructorRegistroIngresoNombre   string `json:"instructor_registro_ingreso_nombre,omitempty"`
	InstructorRegistroSalidaNombre    string `json:"instructor_registro_salida_nombre,omitempty"`
}

// AsistenciaAprendizEstadoRequest para ajustar estado/motivo de un registro de asistencia de aprendiz
type AsistenciaAprendizEstadoRequest struct {
	Estado string `json:"estado" binding:"required"` // ASISTENCIA_COMPLETA, ASISTENCIA_PARCIAL, ABANDONO_JORNADA, REGISTRO_POR_CORREGIR
	Motivo string `json:"motivo"`
}

// AsistenciaDashboardResponse resumen para el dashboard de asistencia (solo superadmin)
type AsistenciaDashboardResponse struct {
	Fecha                       string                          `json:"fecha"` // YYYY-MM-DD
	TotalAprendicesEnFormacion  int                             `json:"total_aprendices_en_formacion"`
	PendientesRevision          int                             `json:"pendientes_revision"` // registros del día que requieren revisión
	PorFicha                    []AsistenciaDashboardPorFicha   `json:"por_ficha"`
}

// AsistenciaDashboardPorFicha cantidad de aprendices que vinieron a formación por ficha
type AsistenciaDashboardPorFicha struct {
	FichaID              uint   `json:"ficha_id"`
	FichaNumero          string `json:"ficha_numero"`
	SedeNombre           string `json:"sede_nombre"`
	CantidadVinieron     int    `json:"cantidad_vinieron"`
}

// CasosBienestarResponse lista de aprendices con indicadores de riesgo (para oficina de bienestar)
type CasosBienestarResponse struct {
	DiasAnalizados int                   `json:"dias_analizados"`
	MinFallas      int                   `json:"min_fallas"`
	Casos          []CasoBienestarItem   `json:"casos"`
	Instructores   []InstructorPendienteItem `json:"instructores"`
}

// CasoBienestarItem un aprendiz con inasistencias >= umbral
type CasoBienestarItem struct {
	AprendizID         uint   `json:"aprendiz_id"`
	PersonaNombre      string `json:"persona_nombre"`
	NumeroDocumento    string `json:"numero_documento"`
	FichaNumero        string `json:"ficha_numero"`
	SedeNombre         string `json:"sede_nombre"`
	TotalSesiones      int    `json:"total_sesiones"`
	AsistenciasEfectivas int  `json:"asistencias_efectivas"`
	Inasistencias      int    `json:"inasistencias"`
}

// InstructorPendienteItem resume cuántos aprendices tiene un instructor con registros "por corregir" (requiere_revision=true) en el período analizado.
type InstructorPendienteItem struct {
	InstructorID                uint   `json:"instructor_id"`
	InstructorNombre            string `json:"instructor_nombre"`
	NumeroDocumento             string `json:"numero_documento"`
	CantidadAprendicesSinSalida int    `json:"cantidad_aprendices_sin_salida"`
}
