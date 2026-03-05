package models

import "time"

// AsistenciaAprendiz representa la asistencia de un aprendiz
type AsistenciaAprendiz struct {
	BaseModel
	AsistenciaID      uint       `gorm:"column:asistencia_id;not null" json:"asistencia_id"`
	InstructorFichaID *uint      `gorm:"column:instructor_ficha_id" json:"instructor_ficha_id"`
	AprendizFichaID   uint       `gorm:"column:aprendiz_ficha_id;not null" json:"aprendiz_ficha_id"`
	HoraIngreso       *time.Time `gorm:"column:hora_ingreso" json:"hora_ingreso"`
	HoraSalida        *time.Time `gorm:"column:hora_salida" json:"hora_salida"`
	Observaciones     string     `gorm:"type:text" json:"observaciones"`
	// Estado de la asistencia en la sesión:
	// - "" (vacío): sin clasificar
	// - "ASISTENCIA_COMPLETA"
	// - "ASISTENCIA_PARCIAL"
	// - "ABANDONO_JORNADA"
	// - "REGISTRO_POR_CORREGIR"
	Estado           string `gorm:"column:estado;size:50;default:''" json:"estado"`
	RequiereRevision bool   `gorm:"column:requiere_revision;default:false" json:"requiere_revision"`
	MotivoAjuste     string `gorm:"column:motivo_ajuste;type:text" json:"motivo_ajuste"`

	// Quién registró ingreso/salida (auditoría). NULL en registros antiguos.
	InstructorFichaIDRegistroIngreso *uint `gorm:"column:instructor_ficha_id_registro_ingreso" json:"instructor_ficha_id_registro_ingreso"`
	InstructorFichaIDRegistroSalida  *uint `gorm:"column:instructor_ficha_id_registro_salida" json:"instructor_ficha_id_registro_salida"`

	// Relaciones
	Asistencia               *Asistencia                    `gorm:"foreignKey:AsistenciaID" json:"asistencia,omitempty"`
	Aprendiz                 *Aprendiz                      `gorm:"foreignKey:AprendizFichaID" json:"aprendiz,omitempty"`
	InstructorRegistroIngreso *InstructorFichaCaracterizacion `gorm:"foreignKey:InstructorFichaIDRegistroIngreso" json:"-"`
	InstructorRegistroSalida  *InstructorFichaCaracterizacion `gorm:"foreignKey:InstructorFichaIDRegistroSalida" json:"-"`
}

// TableName especifica el nombre de la tabla
func (AsistenciaAprendiz) TableName() string {
	return "asistencia_aprendices"
}
