package services

import (
	"errors"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

// Horarios por defecto si la jornada no tiene hora_inicio/hora_fin en BD (según doc)
// MAÑANA: 6:00 - 13:00 (a veces la clase se extiende hasta las 14:00)
// JornadaHorarioDefault par inicio/fin por nombre de jornada.
type JornadaHorarioDefault struct {
	Inicio string
	Fin    string
}

// DefaultHorariosJornada mantiene compatibilidad; preferir bloques en BD.
func DefaultHorariosJornada(nombre string) (JornadaHorarioDefault, bool) {
	return JornadaHorarioDefault{}, false
}

// validarHorarioConExtension comprueba si now está en [hora_inicio, hora_fin + minutos_extension].
func validarHorarioConExtension(j *models.Jornada, now time.Time) bool {
	if j == nil {
		return true
	}
	if j.ID > 0 {
		bloques, err := repositories.NewJornadaBloqueRepository().FindByJornadaID(j.ID)
		if err == nil && len(bloques) > 0 {
			extMin := extensionMinutosFromJornada(j)
			inputs := make([]HorarioBloqueInput, len(bloques))
			for i, b := range bloques {
				inputs[i] = HorarioBloqueInput{
					DiaFormacionID: b.DiaFormacionID,
					HoraInicio:     normalizeHoraMM(b.HoraInicio),
					HoraFin:        normalizeHoraMM(b.HoraFin),
				}
			}
			diaHoy := WeekdayToDiaFormacionID(now.Weekday())
			var hoy []HorarioBloqueInput
			for _, in := range inputs {
				if in.DiaFormacionID == diaHoy {
					hoy = append(hoy, in)
				}
			}
			if len(hoy) > 0 {
				return MomentoEnAlgunBloque(hoy, extMin, now)
			}
			return false
		}
	}
	inicio, fin := normalizeHoraMM(j.HoraInicio), normalizeHoraMM(j.HoraFin)
	if inicio == "" || fin == "" {
		return true
	}
	return validarHorarioRango(inicio, fin, extensionMinutosFromJornada(j), now)
}

func extensionMinutosFromJornada(j *models.Jornada) int {
	extMin := 60
	if j.MinutosExtensionFin != nil && *j.MinutosExtensionFin >= 0 {
		extMin = *j.MinutosExtensionFin
	}
	return extMin
}

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
	return ValidarHorarioJornadaModelAt(j, time.Now())
}

// ValidarHorarioJornadaModelAt comprueba si now está dentro del horario de la jornada (incluye extensión).
func ValidarHorarioJornadaModelAt(j *models.Jornada, now time.Time) bool {
	return validarHorarioConExtension(j, now)
}

func parseHora(s string) (t time.Time, err error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return time.Time{}, errors.New("hora vacía")
	}
	if t, err = time.Parse("15:04:05", s); err == nil {
		return t, nil
	}
	return time.Parse("15:04", s)
}

// normalizeHoraMM devuelve HH:MM (hora de pared, sin zona horaria) desde HH:MM, HH:MM:SS o ISO-8601.
func normalizeHoraMM(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return ""
	}
	if t, err := parseHora(s); err == nil {
		return t.Format("15:04")
	}
	if idx := strings.Index(s, "T"); idx >= 0 {
		rest := s[idx+1:]
		if len(rest) >= 8 && rest[2] == ':' {
			if t, err := parseHora(rest[:8]); err == nil {
				return t.Format("15:04")
			}
		}
		if len(rest) >= 5 && rest[2] == ':' {
			if t, err := parseHora(rest[:5]); err == nil {
				return t.Format("15:04")
			}
		}
	}
	if len(s) >= 8 && s[2] == ':' {
		if t, err := parseHora(s[:8]); err == nil {
			return t.Format("15:04")
		}
	}
	if len(s) >= 5 && s[2] == ':' {
		if t, err := parseHora(s[:5]); err == nil {
			return t.Format("15:04")
		}
	}
	return ""
}

// HoraInicioMasMinutos devuelve el instante (en la zona de dia) de hora_inicio del día dado más los minutos indicados.
// Sirve para saber a partir de qué momento alertar si no se ha iniciado la toma de asistencia.
func HoraInicioMasMinutos(j *models.Jornada, dia time.Time, minutosDespues int) time.Time {
	if j == nil || minutosDespues < 0 {
		return dia
	}
	inicio := normalizeHoraMM(j.HoraInicio)
	if inicio == "" {
		return dia
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
	fin := normalizeHoraMM(j.HoraFin)
	if fin == "" {
		return dia.Add(24 * time.Hour)
	}
	tFin, err := parseHora(fin)
	if err != nil {
		return dia.Add(24 * time.Hour)
	}
	extMin := extensionMinutosFromJornada(j)
	base := time.Date(dia.Year(), dia.Month(), dia.Day(), 0, 0, 0, 0, dia.Location())
	end := base.Add(time.Duration(tFin.Hour())*time.Hour + time.Duration(tFin.Minute())*time.Minute)
	return end.Add(time.Duration(extMin) * time.Minute)
}
