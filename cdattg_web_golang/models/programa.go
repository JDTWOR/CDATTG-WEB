package models

// Programa representa un programa (tabla adicional)
type Programa struct {
	BaseModel
	Nombre string `gorm:"size:255;not null" json:"nombre"`
	Codigo string `gorm:"size:50" json:"codigo"`
	Status bool   `gorm:"default:true" json:"status"`
}

// TableName especifica el nombre de la tabla
func (Programa) TableName() string {
	return "programas"
}
