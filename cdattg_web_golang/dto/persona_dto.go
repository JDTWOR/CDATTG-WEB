package dto

import "time"

// PersonaRequest representa la solicitud de creación/actualización de persona
type PersonaRequest struct {
	TipoDocumento      *uint      `json:"tipo_documento"`
	NumeroDocumento    string     `json:"numero_documento" binding:"required"`
	PrimerNombre       string     `json:"primer_nombre" binding:"required"`
	SegundoNombre       string     `json:"segundo_nombre"`
	PrimerApellido      string     `json:"primer_apellido" binding:"required"`
	SegundoApellido     string     `json:"segundo_apellido"`
	FechaNacimiento     *FlexDate  `json:"fecha_nacimiento"`
	Genero              *uint      `json:"genero"`
	Telefono            string     `json:"telefono"`
	Celular             string     `json:"celular"`
	Email               string     `json:"email" binding:"omitempty,email"`
	PaisID              *uint      `json:"pais_id"`
	DepartamentoID      *uint      `json:"departamento_id"`
	MunicipioID         *uint      `json:"municipio_id"`
	Direccion           string     `json:"direccion"`
	Status              *bool      `json:"status"`
	ParametroID         *uint      `json:"parametro_id"`
	NivelEscolaridadID  *uint      `json:"nivel_escolaridad_id"`
}

// PersonaResponse representa la respuesta de persona
type PersonaResponse struct {
	ID              uint       `json:"id"`
	TipoDocumento   *uint      `json:"tipo_documento"`
	NumeroDocumento string     `json:"numero_documento"`
	PrimerNombre    string     `json:"primer_nombre"`
	SegundoNombre   string     `json:"segundo_nombre"`
	PrimerApellido  string     `json:"primer_apellido"`
	SegundoApellido string     `json:"segundo_apellido"`
	FullName        string     `json:"full_name"`
	FechaNacimiento *time.Time `json:"fecha_nacimiento"`
	Genero          *uint      `json:"genero"`
	Telefono        string     `json:"telefono"`
	Celular         string     `json:"celular"`
	Email           string     `json:"email"`
	PaisID          *uint      `json:"pais_id"`
	DepartamentoID  *uint      `json:"departamento_id"`
	MunicipioID     *uint      `json:"municipio_id"`
	Direccion       string     `json:"direccion"`
	Status          bool       `json:"status"`
	ParametroID     *uint      `json:"parametro_id"`
}
