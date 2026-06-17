package config

// RelaxarColisionHorarioInstructor omite la validación de solapamiento día/horario entre fichas al programar.
func RelaxarColisionHorarioInstructor() bool {
	if AppConfig == nil {
		return false
	}
	return AppConfig.Negocio.RelaxarColisionHorarioInstructor
}
