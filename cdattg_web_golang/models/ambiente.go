package models

// Ambiente representa un ambiente de formación
type Ambiente struct {
	UserAuditModel
	Nombre string `gorm:"size:100;not null" json:"nombre"`
	PisoID uint   `gorm:"column:piso_id;not null" json:"piso_id"`
	Status bool   `gorm:"default:true" json:"status"`
	
	// Relaciones
	Piso  *Piso  `gorm:"foreignKey:PisoID" json:"piso,omitempty"`
	Fichas []FichaCaracterizacion `gorm:"foreignKey:AmbienteID" json:"fichas,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Ambiente) TableName() string {
	return "ambientes"
}

// BeforeCreate normaliza el nombre a mayúsculas
func (a *Ambiente) BeforeCreate() {
	if a.Nombre != "" {
		a.Nombre = toUpper(a.Nombre)
	}
}
