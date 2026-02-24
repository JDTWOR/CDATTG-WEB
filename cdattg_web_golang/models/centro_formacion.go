package models

// CentroFormacion representa un centro de formación
type CentroFormacion struct {
	BaseModel
	Nombre     string `gorm:"size:255;not null" json:"nombre"`
	Codigo     string `gorm:"size:50" json:"codigo"`
	RegionalID *uint  `gorm:"column:regional_id" json:"regional_id"`
	Status     bool   `gorm:"default:true" json:"status"`
	
	// Relaciones
	Regional    *Regional    `gorm:"foreignKey:RegionalID" json:"regional,omitempty"`
	Instructores []Instructor `gorm:"foreignKey:CentroFormacionID" json:"instructores,omitempty"`
}

// TableName especifica el nombre de la tabla
func (CentroFormacion) TableName() string {
	return "centros_formacion"
}
