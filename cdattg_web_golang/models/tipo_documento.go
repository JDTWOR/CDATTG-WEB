package models

// TipoDocumento representa un tipo de documento de identidad
type TipoDocumento struct {
	BaseModel
	Nombre string `gorm:"size:255;not null" json:"nombre"`
}

// TableName especifica el nombre de la tabla
func (TipoDocumento) TableName() string {
	return "tipos_documento"
}
