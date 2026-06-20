package services

import (
	"errors"
	"time"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

// ValidarHorarioFichaEnMomento indica si el momento cae en algún bloque horario de la ficha ese día.
func ValidarHorarioFichaEnMomento(ficha *models.FichaCaracterizacion, diaFormacionID uint, now time.Time) bool {
	if ficha == nil {
		return true
	}
	svc := NewInstructorHorarioService()
	bloques := svc.bloquesDiaFicha(ficha, diaFormacionID)
	if len(bloques) == 0 {
		if ficha.JornadaID == nil || *ficha.JornadaID == 0 {
			return true
		}
		ok, _ := NewJornadaValidationService().ValidarHorarioJornada(*ficha.JornadaID)
		return ok
	}
	ext := extensionMinutosJornada(ficha.Jornada)
	return MomentoEnAlgunBloque(bloques, ext, now)
}

// BloquesJornadaPlantilla devuelve bloques de una plantilla por ID.
func BloquesJornadaPlantilla(jornadaID uint) ([]HorarioBloqueInput, error) {
	if database.GetDB() == nil {
		return nil, errors.New("base de datos no disponible")
	}
	bloques, err := repositories.NewJornadaBloqueRepository().FindByJornadaID(jornadaID)
	if err != nil {
		return nil, err
	}
	out := make([]HorarioBloqueInput, len(bloques))
	jid := jornadaID
	for i, b := range bloques {
		out[i] = HorarioBloqueInput{
			DiaFormacionID: b.DiaFormacionID,
			HoraInicio:     normalizeHoraMM(b.HoraInicio),
			HoraFin:        normalizeHoraMM(b.HoraFin),
			JornadaID:      &jid,
			Orden:          b.Orden,
		}
	}
	return out, nil
}
