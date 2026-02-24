package models

// Sede representa una sede del SENA
type Sede struct {
	UserAuditModel
	Nombre     string `gorm:"size:100;not null" json:"nombre"`
	Direccion  string `gorm:"size:255" json:"direccion"`
	MunicipioID *uint `gorm:"column:municipio_id" json:"municipio_id"`
	RegionalID  *uint `gorm:"column:regional_id" json:"regional_id"`
	Status     bool   `gorm:"default:true" json:"status"`
	
	// Relaciones
	Municipio  *Municipio `gorm:"foreignKey:MunicipioID" json:"municipio,omitempty"`
	Regional   *Regional  `gorm:"foreignKey:RegionalID" json:"regional,omitempty"`
	Bloques    []Bloque   `gorm:"foreignKey:SedeID" json:"bloques,omitempty"`
	Fichas     []FichaCaracterizacion `gorm:"foreignKey:SedeID" json:"fichas,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Sede) TableName() string {
	return "sedes"
}

// BeforeCreate normaliza el nombre a mayúsculas
func (s *Sede) BeforeCreate() {
	if s.Nombre != "" {
		s.Nombre = toUpper(s.Nombre)
	}
}

func toUpper(s string) string {
	result := ""
	for _, char := range s {
		if char >= 'a' && char <= 'z' {
			result += string(char - 32)
		} else {
			result += string(char)
		}
	}
	return result
}
