package models

// ConfiguracionAsistencia fila única (id=1) con parámetros globales de asistencia.
type ConfiguracionAsistencia struct {
	ID                            uint `gorm:"primaryKey" json:"id"`
	PlazoEdicionObservacionesDias int  `gorm:"not null;default:5" json:"plazo_edicion_observaciones_dias"`
	IntervaloAutoCierreMinutos    int  `gorm:"not null;default:5" json:"intervalo_auto_cierre_minutos"`
	MinutosAlertaSinSesion        int  `gorm:"not null;default:90" json:"minutos_alerta_sin_sesion"`
	MinutosExtensionDefault       int  `gorm:"not null;default:60" json:"minutos_extension_default"`
}

func (ConfiguracionAsistencia) TableName() string {
	return "configuracion_asistencia"
}
