package models

// Genero representa un género
type Genero struct {
	BaseModel
	Nombre string `gorm:"size:255;not null" json:"nombre"`
}

// TableName especifica el nombre de la tabla
func (Genero) TableName() string {
	return "generos"
}
