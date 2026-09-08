/**
 * Respuestas del submódulo de pérdida de carnet físico.
 * Separé las consultas del aprendiz y las del bibliotecario para que cada
 * pantalla reciba solo lo que necesita.
 *
 * @author Cristian Deysdayr Jiménez
 */
package dto

// CarnetPerdidaItem fila del historial que ve el aprendiz.
type CarnetPerdidaItem struct {
	ID                uint                `json:"id"`
	FichaNumero       string              `json:"ficha_numero"`
	Programa          string              `json:"programa"`
	TipoFormacion     string              `json:"tipo_formacion"`
	TipoLabel         string              `json:"tipo_label"`
	Estado            string              `json:"estado"`
	EstadoLabel       string              `json:"estado_label"`
	CorreccionDigital bool                `json:"correccion_digital"`
	MotivoRechazo     string              `json:"motivo_rechazo,omitempty"`
	Comprobantes      []CarnetComprobante `json:"comprobantes"`
	CreadaEn          string              `json:"creada_en"`
}

// CarnetComprobante describe uno de los dos PDFs subidos.
type CarnetComprobante struct {
	Tipo   string `json:"tipo"` // pago | demanda
	Nombre string `json:"nombre"`
}

// CarnetPerdidaRevision fila de la bandeja del bibliotecario.
type CarnetPerdidaRevision struct {
	ID                uint                `json:"id"`
	PersonaID         uint                `json:"persona_id"`
	Nombres           string              `json:"nombres"`
	Apellidos         string              `json:"apellidos"`
	NumeroDocumento   string              `json:"numero_documento"`
	Rh                string              `json:"rh"`
	FichaID           uint                `json:"ficha_id"`
	FichaNumero       string              `json:"ficha_numero"`
	Programa          string              `json:"programa"`
	TipoFormacion     string              `json:"tipo_formacion"`
	TipoLabel         string              `json:"tipo_label"`
	CorreccionDigital bool                `json:"correccion_digital"`
	MotivoRechazo     string              `json:"motivo_rechazo,omitempty"`
	Comprobantes      []CarnetComprobante `json:"comprobantes"`
}

// CarnetPerdidaDecisionRequest cuerpo de aprobar o devolver la solicitud.
type CarnetPerdidaDecisionRequest struct {
	Aprobar bool   `json:"aprobar"`
	Motivo  string `json:"motivo"`
}
