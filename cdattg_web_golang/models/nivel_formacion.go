package models

// NivelFormacion representa un nivel de formación
type NivelFormacion struct {
	BaseModel
	Nombre string `gorm:"size:255;not null" json:"nombre"`
	Codigo string `gorm:"size:50" json:"codigo"`
	Status bool   `gorm:"default:true" json:"status"`
}

// TableName especifica el nombre de la tabla
func (NivelFormacion) TableName() string {
	return "niveles_formacion"
}
