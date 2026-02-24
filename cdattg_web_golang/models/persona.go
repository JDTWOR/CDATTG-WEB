package models

import (
	"time"
)

// Persona representa una persona del sistema
type Persona struct {
	UserAuditModel
	TipoDocumentoID        *uint   `gorm:"column:tipo_documento" json:"tipo_documento"`
	NumeroDocumento        string `gorm:"size:20;index" json:"numero_documento"`
	PrimerNombre           string `gorm:"size:100" json:"primer_nombre"`
	SegundoNombre          string `gorm:"size:100" json:"segundo_nombre"`
	PrimerApellido         string `gorm:"size:100" json:"primer_apellido"`
	SegundoApellido        string `gorm:"size:100" json:"segundo_apellido"`
	FechaNacimiento        *time.Time `gorm:"column:fecha_nacimiento" json:"fecha_nacimiento"`
	GeneroID               *uint  `gorm:"column:genero" json:"genero"`
	Telefono           string     `gorm:"size:20" json:"telefono"`
	Celular            string     `gorm:"size:20" json:"celular"`
	Email              string     `gorm:"size:100" json:"email"`
	PaisID             *uint      `gorm:"column:pais_id" json:"pais_id"`
	DepartamentoID     *uint      `gorm:"column:departamento_id" json:"departamento_id"`
	MunicipioID        *uint      `gorm:"column:municipio_id" json:"municipio_id"`
	Direccion          string     `gorm:"size:255" json:"direccion"`
	Status             bool       `gorm:"default:true" json:"status"`
	EstadoSofia        string     `gorm:"column:estado_sofia" json:"estado_sofia"`
	ConDocumento       *bool      `gorm:"column:condocumento" json:"condocumento"`
	PersonaCaracterizacionID *uint `gorm:"column:parametro_id" json:"parametro_id"`
	NivelEscolaridadID       *uint `gorm:"column:nivel_escolaridad_id" json:"nivel_escolaridad_id"`

	// Relaciones
	Pais                   *Pais                   `gorm:"foreignKey:PaisID" json:"pais,omitempty"`
	Departamento           *Departamento           `gorm:"foreignKey:DepartamentoID" json:"departamento,omitempty"`
	Municipio              *Municipio              `gorm:"foreignKey:MunicipioID" json:"municipio,omitempty"`
	TipoDocumento          *TipoDocumento          `gorm:"foreignKey:TipoDocumentoID" json:"tipo_documento_rel,omitempty"`
	Genero                 *Genero                 `gorm:"foreignKey:GeneroID" json:"genero_rel,omitempty"`
	PersonaCaracterizacion *PersonaCaracterizacion `gorm:"foreignKey:PersonaCaracterizacionID" json:"persona_caracterizacion,omitempty"`
	User                   *User                   `gorm:"foreignKey:PersonaID" json:"user,omitempty"`
}

// TableName especifica el nombre de la tabla
func (Persona) TableName() string {
	return "personas"
}

// GetFullName retorna el nombre completo de la persona
func (p *Persona) GetFullName() string {
	fullName := p.PrimerNombre
	if p.SegundoNombre != "" {
		fullName += " " + p.SegundoNombre
	}
	fullName += " " + p.PrimerApellido
	if p.SegundoApellido != "" {
		fullName += " " + p.SegundoApellido
	}
	return fullName
}
