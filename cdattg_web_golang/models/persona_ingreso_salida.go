package models

import "time"

// PersonaIngresoSalida registro de ingreso/salida de personas por sede (portería).
type PersonaIngresoSalida struct {
	BaseModel
	PersonaID              uint       `gorm:"column:persona_id;not null;index" json:"persona_id"`
	SedeID                 uint       `gorm:"column:sede_id;not null;index" json:"sede_id"`
	TipoPersona            string     `gorm:"size:50;not null" json:"tipo_persona"`
	FechaEntrada           time.Time  `gorm:"column:fecha_entrada;not null" json:"fecha_entrada"`
	HoraEntrada            time.Time  `gorm:"column:hora_entrada;not null" json:"hora_entrada"`
	TimestampEntrada       time.Time  `gorm:"column:timestamp_entrada;not null;index" json:"timestamp_entrada"`
	FechaSalida            *time.Time `gorm:"column:fecha_salida" json:"fecha_salida"`
	HoraSalida             *time.Time `gorm:"column:hora_salida" json:"hora_salida"`
	TimestampSalida        *time.Time `gorm:"column:timestamp_salida;index" json:"timestamp_salida"`
	AmbienteID             *uint      `gorm:"column:ambiente_id" json:"ambiente_id"`
	FichaCaracterizacionID *uint      `gorm:"column:ficha_caracterizacion_id" json:"ficha_caracterizacion_id"`
	Observaciones          string     `gorm:"type:text" json:"observaciones"`
	MetodoRegistro         string     `gorm:"column:metodo_registro;size:20;not null;default:MANUAL" json:"metodo_registro"`
	RegistradoPorUserID    *uint      `gorm:"column:registrado_por_user_id;index" json:"registrado_por_user_id"`
	MotivoSalida           string     `gorm:"column:motivo_salida;size:80" json:"motivo_salida"`
	ObservacionSalida      string     `gorm:"column:observacion_salida;type:text" json:"observacion_salida"`
	// SalidaSinIngreso: persona salió sin haber registrado entrada previa (registro irregular).
	SalidaSinIngreso bool `gorm:"column:salida_sin_ingreso;not null;default:false;index" json:"salida_sin_ingreso"`
	// IngresoCancelado: entrada registrada y luego cancelada por el vigilante (no cuenta como ingreso).
	IngresoCancelado    bool       `gorm:"column:ingreso_cancelado;not null;default:false;index" json:"ingreso_cancelado"`
	IngresoCanceladoAt  *time.Time `gorm:"column:ingreso_cancelado_at" json:"ingreso_cancelado_at"`
	IngresoCanceladoPor *uint      `gorm:"column:ingreso_cancelado_por_user_id" json:"ingreso_cancelado_por_user_id"`

	Persona              *Persona              `gorm:"foreignKey:PersonaID" json:"persona,omitempty"`
	Sede                 *Sede                 `gorm:"foreignKey:SedeID" json:"sede,omitempty"`
	Ambiente             *Ambiente             `gorm:"foreignKey:AmbienteID" json:"ambiente,omitempty"`
	FichaCaracterizacion *FichaCaracterizacion `gorm:"foreignKey:FichaCaracterizacionID" json:"ficha_caracterizacion,omitempty"`
	RegistradoPor        *User                 `gorm:"foreignKey:RegistradoPorUserID" json:"registrado_por,omitempty"`
}

// TableName especifica el nombre de la tabla.
func (PersonaIngresoSalida) TableName() string {
	return "persona_ingreso_salida"
}
