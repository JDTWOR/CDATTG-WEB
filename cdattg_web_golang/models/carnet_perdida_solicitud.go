/**
 * Solicitud de reposición del carnet físico cuando el aprendiz lo pierde.
 * La crea el aprendiz de formación regular y la revisa el bibliotecario.
 * Dejé el digital aparte: este submódulo no toca la validación del instructor.
 *
 * @author Cristian Deysdayr Jiménez
 */
package models

import "time"

const (
	CarnetPerdidaEstadoPendiente = "pendiente"
	// CarnetPerdidaEstadoEspera: el bibliotecario aceptó y la reposición
	// queda esperando a que se renueve el carnet físico.
	CarnetPerdidaEstadoEspera   = "en_espera_renovacion_digital"
	CarnetPerdidaEstadoDevuelto = "devuelto"
	// CarnetPerdidaEstadoRenovado: se renovó y entregó el carnet físico;
	// la solicitud queda cerrada en el historial.
	CarnetPerdidaEstadoRenovado = "renovado"
)

// CarnetPerdidaSolicitud guarda los comprobantes y el estado de la reposición.
type CarnetPerdidaSolicitud struct {
	UserAuditModel
	PersonaID       uint   `gorm:"column:persona_id;index;not null" json:"persona_id"`
	FichaID         uint   `gorm:"column:ficha_id;index;not null" json:"ficha_id"`
	FichaNumero     string `gorm:"column:ficha_numero;size:50" json:"ficha_numero"`
	Programa        string `gorm:"column:programa;size:255" json:"programa"`
	TipoFormacion   string `gorm:"column:tipo_formacion;size:40" json:"tipo_formacion"`
	Estado          string `gorm:"column:estado;size:30;index;not null" json:"estado"`
	Nombres         string `gorm:"column:nombres;size:200" json:"nombres"`
	Apellidos       string `gorm:"column:apellidos;size:200" json:"apellidos"`
	NumeroDocumento string `gorm:"column:numero_documento;size:20" json:"numero_documento"`
	Rh              string `gorm:"column:rh;size:8" json:"rh"`
	// FotoPath es la foto del solicitante: la copio al crear para mostrarla
	// en la bandeja del bibliotecario igual que en un carnet regular.
	FotoPath                     string     `gorm:"column:foto_path;size:255" json:"-"`
	ComprobantePagoPath          string     `gorm:"column:comprobante_pago_path;size:255" json:"-"`
	ComprobanteDemandaPath       string     `gorm:"column:comprobante_demanda_path;size:255" json:"-"`
	CorreccionDigital            bool       `gorm:"column:correccion_digital" json:"correccion_digital"`
	CorreccionDigitalSolicitudID *uint      `gorm:"column:correccion_digital_solicitud_id" json:"correccion_digital_solicitud_id,omitempty"`
	MotivoRechazo                string     `gorm:"column:motivo_rechazo;size:255" json:"motivo_rechazo"`
	AprobadoPorUserID            *uint      `gorm:"column:aprobado_por_user_id" json:"aprobado_por_user_id,omitempty"`
	AprobadoEn                   *time.Time `gorm:"column:aprobado_en" json:"aprobado_en,omitempty"`
}

// TableName nombra la tabla.
func (CarnetPerdidaSolicitud) TableName() string {
	return "carnet_perdida_solicitudes"
}
