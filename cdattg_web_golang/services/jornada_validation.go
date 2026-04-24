package services

import (
	"time"

	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

// Horarios por defecto si la jornada no tiene hora_inicio/hora_fin en BD (según doc)
// MAÑANA: 6:00 - 13:00 (a veces la clase se extiende hasta las 14:00)
var defaultHorarios = map[string]struct{ inicio, fin string }{
	"MAÑANA":           {"06:00", "13:00"},
	"TARDE":            {"13:00", "18:10"},
	"NOCHE":            {"17:50", "23:10"},
	"FINES DE SEMANA":  {"06:00", "18:00"},
	"JORNADA CONTINUA": {"06:00", "18:00"}, // Mañana y tarde (ej. Enfermería): desde inicio mañana hasta fin tarde
}

// Minutos después de hora_fin en que aún se permite tomar asistencia / registrar salida (la clase a veces se extiende).
// Si la jornada tiene MinutosExtensionFin en BD se usa ese valor; si no, este mapa por nombre; si no, 60.
var defaultExtensionMinutos = map[string]int{
	"MAÑANA":           60,
	"TARDE":            60,
	"NOCHE":            60,
	"FINES DE SEMANA":  30,
	"JORNADA CONTINUA": 60, // mañana y tarde: extensión al cierre
}

// JornadaValidationService valida si la hora actual está dentro del horario de la jornada.
type JornadaValidationService struct {
	repo repositories.CatalogoRepository
}

// NewJornadaValidationService crea el servicio de validación de jornada.
func NewJornadaValidationService() *JornadaValidationService {
	return &JornadaValidationService{repo: repositories.NewCatalogoRepository()}
}

// ValidarHorarioJornada devuelve true si la hora actual está dentro del horario de la jornada (hora_inicio .. hora_fin + extensión).
// La extensión después de hora_fin permite registrar salida cuando la clase se extiende un poco más.
func (s *JornadaValidationService) ValidarHorarioJornada(jornadaID uint) (bool, error) {
	if jornadaID == 0 {
		return true, nil
	}
	j, err := s.repo.FindJornadaByID(jornadaID)
	if err != nil || j == nil {
		return true, nil
	}
	return validarHorarioConExtension(j, time.Now()), nil
}

// ValidarHorarioJornadaModel es igual pero recibe la jornada ya cargada (evita consulta).
func ValidarHorarioJornadaModel(j *models.Jornada) bool {
	return validarHorarioConExtension(j, time.Now())
}

// validarHorarioConExtension comprueba si now está en [hora_inicio, hora_fin + minutos_extension].
func validarHorarioConExtension(j *models.Jornada, now time.Time) bool {
	if j == nil {
		return true
	}
	inicio, fin := j.HoraInicio, j.HoraFin
	if inicio == "" || fin == "" {
		if def, ok := defaultHorarios[j.Nombre]; ok {
			inicio, fin = def.inicio, def.fin
		} else {
			return true
		}
	}
	tInicio, err1 := parseHora(inicio)
	tFin, err2 := parseHora(fin)
	if err1 != nil || err2 != nil {
		return true
	}
	extMin := 60
	if j.MinutosExtensionFin != nil && *j.MinutosExtensionFin >= 0 {
		extMin = *j.MinutosExtensionFin
	} else if d, ok := defaultExtensionMinutos[j.Nombre]; ok {
		extMin = d
	}
	hoy := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	actual := hoy.Add(time.Duration(now.Hour())*time.Hour + time.Duration(now.Minute())*time.Minute)
	start := hoy.Add(time.Duration(tInicio.Hour())*time.Hour + time.Duration(tInicio.Minute())*time.Minute)
	end := hoy.Add(time.Duration(tFin.Hour())*time.Hour + time.Duration(tFin.Minute())*time.Minute)
	if end.Before(start) {
		end = end.Add(24 * time.Hour)
		if actual.Before(start) {
			actual = actual.Add(24 * time.Hour)
		}
	}
	endEffective := end.Add(time.Duration(extMin) * time.Minute)
	return !actual.Before(start) && !actual.After(endEffective)
}

func parseHora(s string) (t time.Time, err error) {
	return time.Parse("15:04", s)
}

// HoraInicioMasMinutos devuelve el instante (en la zona de dia) de hora_inicio del día dado más los minutos indicados.
// Sirve para saber a partir de qué momento alertar si no se ha iniciado la toma de asistencia.
func HoraInicioMasMinutos(j *models.Jornada, dia time.Time, minutosDespues int) time.Time {
	if j == nil || minutosDespues < 0 {
		return dia
	}
	inicio := j.HoraInicio
	if inicio == "" {
		if def, ok := defaultHorarios[j.Nombre]; ok {
			inicio = def.inicio
		} else {
			return dia
		}
	}
	tInicio, err := parseHora(inicio)
	if err != nil {
		return dia
	}
	base := time.Date(dia.Year(), dia.Month(), dia.Day(), 0, 0, 0, 0, dia.Location())
	start := base.Add(time.Duration(tInicio.Hour())*time.Hour + time.Duration(tInicio.Minute())*time.Minute)
	return start.Add(time.Duration(minutosDespues) * time.Minute)
}

// HoraFinEfectiva devuelve el instante (en la zona de dia) en que termina la ventana válida de la jornada
// (hora_fin + minutos extensión) para el día dado. Sirve para auto-finalizar sesiones.
func HoraFinEfectiva(j *models.Jornada, dia time.Time) time.Time {
	if j == nil {
		return dia.Add(24 * time.Hour)
	}
	fin := j.HoraFin
	if fin == "" {
		if def, ok := defaultHorarios[j.Nombre]; ok {
			fin = def.fin
		} else {
			return dia.Add(24 * time.Hour)
		}
	}
	tFin, err := parseHora(fin)
	if err != nil {
		return dia.Add(24 * time.Hour)
	}
	extMin := 60
	if j.MinutosExtensionFin != nil && *j.MinutosExtensionFin >= 0 {
		extMin = *j.MinutosExtensionFin
	} else if d, ok := defaultExtensionMinutos[j.Nombre]; ok {
		extMin = d
	}
	base := time.Date(dia.Year(), dia.Month(), dia.Day(), 0, 0, 0, 0, dia.Location())
	end := base.Add(time.Duration(tFin.Hour())*time.Hour + time.Duration(tFin.Minute())*time.Minute)
	return end.Add(time.Duration(extMin) * time.Minute)
}
