package config

// RelaxarRestriccionAsistencia indica si se omiten validaciones de día/horario al tomar asistencia.
func RelaxarRestriccionAsistencia() bool {
	if AppConfig == nil {
		return false
	}
	return AppConfig.Negocio.RelaxarRestriccionAsistencia
}
