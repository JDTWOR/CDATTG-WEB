package models

// PersonaImportIssue representa un problema encontrado durante la importación
type PersonaImportIssue struct {
	BaseModel
	PersonaImportID uint   `gorm:"column:persona_import_id;not null" json:"persona_import_id"`
	Fila            int    `gorm:"not null" json:"fila"`
	Campo           string `gorm:"size:100" json:"campo"`
	Valor           string `gorm:"size:255" json:"valor"`
	Error           string `gorm:"type:text;not null" json:"error"`
	Tipo            string `gorm:"size:50;not null" json:"tipo"` // ERROR, ADVERTENCIA
	
	// Relaciones
	PersonaImport *PersonaImport `gorm:"foreignKey:PersonaImportID" json:"persona_import,omitempty"`
}

// TableName especifica el nombre de la tabla
func (PersonaImportIssue) TableName() string {
	return "persona_import_issues"
}
