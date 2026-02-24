package models

// ModalidadFormacion representa una modalidad de formación
type ModalidadFormacion struct {
	BaseModel
	Nombre string `gorm:"size:255;not null" json:"nombre"`
	Codigo string `gorm:"size:50" json:"codigo"`
	Status bool   `gorm:"default:true" json:"status"`
}

// TableName especifica el nombre de la tabla
func (ModalidadFormacion) TableName() string {
	return "modalidades_formacion"
}
