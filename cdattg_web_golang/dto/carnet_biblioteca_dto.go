/**
 * Respuestas para que biblioteca vea carnets regulares ya validados.
 *
 * @author Cristian Deysdayr Jiménez
 */
package dto

// CarnetBibliotecaFicha es una ficha regular del catálogo.
type CarnetBibliotecaFicha struct {
	ID               uint   `json:"id"`
	Numero           string `json:"numero"`
	Programa         string `json:"programa"`
	InstructorLider  string `json:"instructor_lider"`
}

// CarnetBibliotecaItem es un aprendiz con carnet regular aprobado.
type CarnetBibliotecaItem struct {
	ID              uint   `json:"id"`
	PrimerNombre    string `json:"primer_nombre"`
	SegundoNombre   string `json:"segundo_nombre"`
	PrimerApellido  string `json:"primer_apellido"`
	SegundoApellido string `json:"segundo_apellido"`
	Nombres         string `json:"nombres"`
	Apellidos       string `json:"apellidos"`
	NumeroDocumento string `json:"numero_documento"`
	Rh              string `json:"rh"`
	FichaID         uint   `json:"ficha_id"`
	FichaNumero     string `json:"ficha_numero"`
	Programa        string `json:"programa"`
	InstructorLider string `json:"instructor_lider"`
	TieneFoto       bool   `json:"tiene_foto"`
	FotoURL         string `json:"foto_url"`
}

// CarnetBibliotecaResponse junta el catálogo de fichas y las personas.
type CarnetBibliotecaResponse struct {
	Fichas []CarnetBibliotecaFicha `json:"fichas"`
	Items  []CarnetBibliotecaItem  `json:"items"`
}
