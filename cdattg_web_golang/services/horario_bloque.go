package services

import (
	"errors"
	"fmt"
	"sort"
	"time"
)

// HorarioBloqueInput bloque horario genérico (ficha o plantilla).
type HorarioBloqueInput struct {
	DiaFormacionID uint
	HoraInicio     string
	HoraFin        string
	JornadaID      *uint
	Orden          int
}

var errHorariosSolapan = errors.New("los horarios se solapan el mismo día")

// ValidarHorariosSinSolape rechaza bloques que se crucen el mismo día.
func ValidarHorariosSinSolape(bloques []HorarioBloqueInput) error {
	byDay := make(map[uint][]HorarioBloqueInput)
	for _, b := range bloques {
		if b.DiaFormacionID == 0 {
			continue
		}
		hi := normalizeHoraMM(b.HoraInicio)
		hf := normalizeHoraMM(b.HoraFin)
		if hi == "" || hf == "" {
			return fmt.Errorf("hora inicio y fin son obligatorias para el día %d", b.DiaFormacionID)
		}
		byDay[b.DiaFormacionID] = append(byDay[b.DiaFormacionID], HorarioBloqueInput{
			DiaFormacionID: b.DiaFormacionID,
			HoraInicio:     hi,
			HoraFin:        hf,
		})
	}
	for diaID, list := range byDay {
		sort.Slice(list, func(i, j int) bool {
			return list[i].HoraInicio < list[j].HoraInicio
		})
		for i := 0; i < len(list); i++ {
			for j := i + 1; j < len(list); j++ {
				if intervalosSeSolapan(list[i].HoraInicio, list[i].HoraFin, list[j].HoraInicio, list[j].HoraFin) {
					return fmt.Errorf("%w (día %d: %s–%s con %s–%s)", errHorariosSolapan, diaID,
						list[i].HoraInicio, list[i].HoraFin, list[j].HoraInicio, list[j].HoraFin)
				}
			}
		}
	}
	return nil
}

// MomentoEnAlgunBloque indica si now cae en alguno de los bloques (con extensión post-fin).
func MomentoEnAlgunBloque(bloques []HorarioBloqueInput, extMin int, now time.Time) bool {
	for _, b := range bloques {
		if validarHorarioRango(b.HoraInicio, b.HoraFin, extMin, now) {
			return true
		}
	}
	return false
}
