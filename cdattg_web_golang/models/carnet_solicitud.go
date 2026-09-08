/**
 * Solicitud de carnet digital. El instructor líder la valida antes de publicarla.
 *
 * @author Cristian Deysdayr Jiménez
 */
package models

import "time"

const (
	CarnetEstadoPendiente = "pendiente"
	CarnetEstadoAprobado  = "aprobado"
	CarnetEstadoDevuelto  = "devuelto"
	CarnetEstadoRechazado = "rechazado"
)

// CarnetSolicitud es el paquete de datos que el aprendiz pide publicar.
type CarnetSolicitud struct {
	UserAuditModel
	PersonaID             uint       `gorm:"column:persona_id;index;not null" json:"persona_id"`
	FichaID               uint       `gorm:"column:ficha_id;index;not null" json:"ficha_id"`
	FichaNumero           string     `gorm:"column:ficha_numero;size:50" json:"ficha_numero"`
	Programa              string     `gorm:"column:programa;size:255" json:"programa"`
	TipoFormacion         string     `gorm:"column:tipo_formacion;size:40" json:"tipo_formacion"`
	Estado                string     `gorm:"column:estado;size:20;index;not null" json:"estado"`
	Nombres               string     `gorm:"column:nombres;size:200" json:"nombres"`
	Apellidos             string     `gorm:"column:apellidos;size:200" json:"apellidos"`
	NumeroDocumento       string     `gorm:"column:numero_documento;size:20" json:"numero_documento"`
	Rh                    string     `gorm:"column:rh;size:8" json:"rh"`
	FotoPath              string     `gorm:"column:foto_path;size:255" json:"foto_path"`
	ValidadorInstructorID *uint      `gorm:"column:validador_instructor_id" json:"validador_instructor_id"`
	ValidadoEn            *time.Time `gorm:"column:validado_en" json:"validado_en"`
	MotivoRechazo         string     `gorm:"column:motivo_rechazo;size:255" json:"motivo_rechazo"`
}

// TableName nombra la tabla.
func (CarnetSolicitud) TableName() string {
	return "carnet_solicitudes"
}
