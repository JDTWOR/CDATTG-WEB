/**
 * Respuestas del carnet digital y de su validación.
 *
 * @author Cristian Deysdayr Jiménez
 */
package dto

// CarnetFichaOpcion ficha vigente que el aprendiz puede elegir.
type CarnetFichaOpcion struct {
	ID              uint   `json:"id"`
	Numero          string `json:"numero"`
	Programa        string `json:"programa"`
	FechaFin        string `json:"fecha_fin"`
	Regional        string `json:"regional"`
	CentroNombre    string `json:"centro_nombre"`
	TipoFormacion   string `json:"tipo_formacion"`
	TipoLabel       string `json:"tipo_label"`
	EstadoSolicitud string `json:"estado_solicitud"`
	Accion          string `json:"accion"`
}

// CarnetPersonaDatos datos impresos (de la solicitud aprobada).
type CarnetPersonaDatos struct {
	Nombres            string `json:"nombres"`
	Apellidos          string `json:"apellidos"`
	NumeroDocumento    string `json:"numero_documento"`
	TipoDocumentoLabel string `json:"tipo_documento_label"`
	Rh                 string `json:"rh"`
	TieneFoto          bool   `json:"tiene_foto"`
}

// CarnetDigitalResponse estado del carnet del aprendiz.
type CarnetDigitalResponse struct {
	Habilitado      bool                `json:"habilitado"`
	Motivo          string              `json:"motivo,omitempty"`
	EstadoSolicitud string              `json:"estado_solicitud"`
	PuedeSolicitar  bool                `json:"puede_solicitar"`
	MotivoRechazo   string              `json:"motivo_rechazo,omitempty"`
	Persona         CarnetPersonaDatos  `json:"persona"`
	Fichas          []CarnetFichaOpcion `json:"fichas"`
}

// CarnetPendienteItem fila para el instructor líder.
type CarnetPendienteItem struct {
	ID              uint   `json:"id"`
	PersonaID       uint   `json:"persona_id"`
	Nombres         string `json:"nombres"`
	Apellidos       string `json:"apellidos"`
	NumeroDocumento string `json:"numero_documento"`
	Rh              string `json:"rh"`
	FichaID         uint   `json:"ficha_id"`
	FichaNumero     string `json:"ficha_numero"`
	Programa        string `json:"programa"`
	TipoFormacion   string `json:"tipo_formacion"`
	TipoLabel       string `json:"tipo_label"`
}

// CarnetSolicitarRequest ficha que el aprendiz eligió.
type CarnetSolicitarRequest struct {
	FichaID uint `json:"ficha_id"`
}

// CarnetDecisionRequest lo dejo por si el instructor manda cuerpo vacío.
type CarnetDecisionRequest struct {
	Motivo string `json:"motivo"`
}

// CarnetVistaInstructor es el carnet completo que el líder revisa.
type CarnetVistaInstructor struct {
	ID      uint               `json:"id"`
	Persona CarnetPersonaDatos `json:"persona"`
	Ficha   CarnetFichaOpcion  `json:"ficha"`
}
