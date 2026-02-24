package models

// ProgramaFormacion representa un programa de formación
type ProgramaFormacion struct {
	UserAuditModel
	Codigo              string `gorm:"size:50;not null" json:"codigo"`
	Nombre              string `gorm:"size:255;not null" json:"nombre"`
	RedConocimientoID   *uint  `gorm:"column:red_conocimiento_id" json:"red_conocimiento_id"`
	NivelFormacionID    *uint  `gorm:"column:nivel_formacion_id" json:"nivel_formacion_id"`
	Status              bool   `gorm:"default:true" json:"status"`
	HorasTotales        *int   `gorm:"column:horas_totales" json:"horas_totales"`
	HorasEtapaLectiva   *int   `gorm:"column:horas_etapa_lectiva" json:"horas_etapa_lectiva"`
	HorasEtapaProductiva *int  `gorm:"column:horas_etapa_productiva" json:"horas_etapa_productiva"`
	TipoProgramaID      *uint  `gorm:"column:tipo_programa_id" json:"tipo_programa_id"`
	
	// Relaciones
	RedConocimiento *RedConocimiento `gorm:"foreignKey:RedConocimientoID" json:"red_conocimiento,omitempty"`
	Fichas         []FichaCaracterizacion `gorm:"foreignKey:ProgramaFormacionID" json:"fichas,omitempty"`
}

// TableName especifica el nombre de la tabla
func (ProgramaFormacion) TableName() string {
	return "programas_formacion"
}

// BeforeCreate normaliza campos a mayúsculas
func (p *ProgramaFormacion) BeforeCreate() {
	if p.Nombre != "" {
		p.Nombre = toUpper(p.Nombre)
	}
	if p.Codigo != "" {
		p.Codigo = toUpper(p.Codigo)
	}
}
