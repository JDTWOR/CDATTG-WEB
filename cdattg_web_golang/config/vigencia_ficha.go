package config

import (
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

// IgnorarVigenciaFicha indica si las reglas deben omitir fecha_inicio/fecha_fin de fichas_caracterizacion.
func IgnorarVigenciaFicha() bool {
	if AppConfig == nil {
		return true
	}
	return AppConfig.Negocio.IgnorarVigenciaFicha
}

// FechasVigenciaFicha devuelve las fechas de vigencia de la ficha para reglas de negocio y consultas.
func FechasVigenciaFicha(ficha *models.FichaCaracterizacion) (inicio, fin *time.Time) {
	if IgnorarVigenciaFicha() || ficha == nil {
		return nil, nil
	}
	return ficha.FechaInicio, ficha.FechaFin
}
