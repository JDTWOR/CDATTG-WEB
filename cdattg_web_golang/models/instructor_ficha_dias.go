package models

// InstructorFichaDias representa los días de formación de un instructor en una ficha
type InstructorFichaDias struct {
	BaseModel
	InstructorID    uint `gorm:"column:instructor_id;not null" json:"instructor_id"`
	FichaID         uint `gorm:"column:ficha_id;not null" json:"ficha_id"`
	DiaFormacionID  uint `gorm:"column:dia_formacion_id;not null" json:"dia_formacion_id"`
	
	// Relaciones
	Instructor   *Instructor        `gorm:"foreignKey:InstructorID" json:"instructor,omitempty"`
	Ficha        *FichaCaracterizacion `gorm:"foreignKey:FichaID" json:"ficha,omitempty"`
	DiaFormacion *DiasFormacion    `gorm:"foreignKey:DiaFormacionID" json:"dia_formacion,omitempty"`
}

// TableName especifica el nombre de la tabla
func (InstructorFichaDias) TableName() string {
	return "instructor_ficha_dias"
}
