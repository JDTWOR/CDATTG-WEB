package services

// Reglas de negocio acordadas (defaults hasta confirmación formal del cliente).
const (
	// EleccionMinDiasMatriculaDefault antigüedad mínima si el proceso no define otra.
	EleccionMinDiasMatriculaDefault = 30
	// EleccionPermiteCambioVoto: el voto es único e irrevocable durante la fase de votación.
	EleccionPermiteCambioVoto = false
)

// EleccionReglasDocumentadas resume decisiones de producto implementadas.
func EleccionReglasDocumentadas() map[string]string {
	return map[string]string{
		"alcance":              "Por regional (aprendices activos de sedes de la regional)",
		"antiguedad":           "Configurable por ciclo (default 30 días matriculado)",
		"sanciones":            "Validación manual: admin puede rechazar planchas",
		"regional_unica":       "Un aprendiz activo por persona; regional vía ficha→sede",
		"inscripcion_plancha":  "Solo titular o suplente se postulan a sí mismos; el compañero confirma",
		"cambio_voto":          "No permitido: un voto por aprendiz, sin modificación",
		"voto":                 "Todos los aprendices elegibles votan una vez (incluidos candidatos), sin modificación",
		"no_reeleccion":        "Titular/suplente del ciclo anterior no pueden postular",
		"confirmacion_plancha": "Titular y suplente deben confirmar",
		"empate":               "Desempate manual registrado por admin (acta/sorteo)",
		"ciclo_anual_unico":    "Un solo ciclo electoral por regional y año calendario",
	}
}
