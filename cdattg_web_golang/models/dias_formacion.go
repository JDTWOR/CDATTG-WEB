package models

// DiasFormacion representa un día de formación
type DiasFormacion struct {
	BaseModel
	Nombre string `gorm:"size:100;not null" json:"nombre"`
	Codigo string `gorm:"size:50" json:"codigo"`
	Status bool   `gorm:"default:true" json:"status"`
}

// TableName especifica el nombre de la tabla
func (DiasFormacion) TableName() string {
	return "dias_formacion"
}
