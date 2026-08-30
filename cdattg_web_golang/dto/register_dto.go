/**
 * dto: registro público de persona y usuario.
 * @author Cristian Deysdayr Jiménez
 */
package dto

// RegisterRequest datos del formulario público.
type RegisterRequest struct {
	TipoDocumento   uint   `json:"tipo_documento" binding:"required"`
	NumeroDocumento string `json:"numero_documento" binding:"required,max=20"`
	PrimerNombre    string `json:"primer_nombre" binding:"required,max=100"`
	SegundoNombre   string `json:"segundo_nombre" binding:"max=100"`
	PrimerApellido  string `json:"primer_apellido" binding:"required,max=100"`
	SegundoApellido string `json:"segundo_apellido" binding:"max=100"`
	FechaNacimiento string `json:"fecha_nacimiento" binding:"required"`
	Genero          uint   `json:"genero" binding:"required"`
	Telefono        string `json:"telefono" binding:"max=20"`
	Celular         string `json:"celular" binding:"required,max=20"`
	Email           string `json:"email" binding:"required,email,max=100"`
	PaisID          uint   `json:"pais_id" binding:"required"`
	DepartamentoID  uint   `json:"departamento_id" binding:"required"`
	MunicipioID     uint   `json:"municipio_id" binding:"required"`
	Direccion       string `json:"direccion" binding:"max=255"`
	ParametroID     uint   `json:"parametro_id" binding:"required"`
	Password        string `json:"password" binding:"required,min=8,max=72"`
	PasswordConfirm string `json:"password_confirm" binding:"required"`
}
