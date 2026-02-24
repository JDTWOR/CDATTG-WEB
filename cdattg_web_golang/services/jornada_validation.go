package services

import (
	"time"

	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

// Horarios por defecto si la jornada no tiene hora_inicio/hora_fin en BD (según doc)
var defaultHorarios = map[string]struct{ inicio, fin string }{
	"MAÑANA":             {"06:00", "13:10"},
	"TARDE":              {"13:00", "18:10"},
	"NOCHE":              {"17:50", "23:10"},
	"FINES DE SEMANA":    {"06:00", "18:00"},
}

// JornadaValidationService valida si la hora actual está dentro del horario de la jornada.
type JornadaValidationService struct {
	repo repositories.CatalogoRepository
}

// NewJornadaValidationService crea el servicio de validación de jornada.
func NewJornadaValidationService() *JornadaValidationService {
	return &JornadaValidationService{repo: repositories.NewCatalogoRepository()}
}

// ValidarHorarioJornada devuelve true si la hora actual está dentro del horario de la jornada (hora_inicio .. hora_fin).
// Si jornadaID es 0 o la jornada no tiene horario configurado, se usa default por nombre o se devuelve true (sin restricción).
func (s *JornadaValidationService) ValidarHorarioJornada(jornadaID uint) (bool, error) {
	if jornadaID == 0 {
		return true, nil
	}
	j, err := s.repo.FindJornadaByID(jornadaID)
	if err != nil || j == nil {
		return true, nil // sin restricción si no existe
	}
	inicio, fin := j.HoraInicio, j.HoraFin
	if inicio == "" || fin == "" {
		if def, ok := defaultHorarios[j.Nombre]; ok {
			inicio, fin = def.inicio, def.fin
		} else {
			return true, nil
		}
	}
	now := time.Now()
	tInicio, err1 := parseHora(inicio)
	tFin, err2 := parseHora(fin)
	if err1 != nil || err2 != nil {
		return true, nil
	}
	// Comparar solo hora:minuto (hoy como fecha base)
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
	return !actual.Before(start) && actual.Before(end), nil
}

// ValidarHorarioJornadaModel es igual pero recibe la jornada ya cargada (evita consulta).
func ValidarHorarioJornadaModel(j *models.Jornada) bool {
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
	now := time.Now()
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
	return !actual.Before(start) && actual.Before(end)
}

func parseHora(s string) (t time.Time, err error) {
	return time.Parse("15:04", s)
}
