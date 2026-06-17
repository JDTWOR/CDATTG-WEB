package services

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

const (
	TrasladoModoPermanente = "permanente"
	TrasladoModoFechas     = "fechas"
)

func normalizarModoTraslado(modo string) string {
	switch strings.ToLower(strings.TrimSpace(modo)) {
	case TrasladoModoFechas:
		return TrasladoModoFechas
	default:
		return TrasladoModoPermanente
	}
}

// fechaCalendario normaliza a medianoche local usando el día civil de la fecha.
// Las columnas DATE de Postgres llegan vía GORM como UTC 00:00; hay que leer
// año/mes/día sin convertir zona, para que coincidan con el loop de agenda en Local.
func fechaCalendario(t time.Time) time.Time {
	if t.IsZero() {
		return t
	}
	loc := time.Local
	y, m, d := t.Date()
	if t.Location() == time.UTC {
		y, m, d = t.UTC().Date()
	} else {
		t = t.In(loc)
		y, m, d = t.Date()
	}
	return time.Date(y, m, d, 0, 0, 0, 0, loc)
}

func parseFechaTrasladoInput(s string) (time.Time, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return time.Time{}, errors.New("fecha obligatoria")
	}
	return time.ParseInLocation(time.DateOnly, s, time.Local)
}

func instructorCedeSesionTraslado(traslados []models.InstructorFichaTrasladoFecha, instructorID uint, fecha time.Time) bool {
	f := fechaCalendario(fecha)
	for _, t := range traslados {
		if t.InstructorOrigenID == instructorID && fechaCalendario(t.FechaOrigen).Equal(f) {
			return true
		}
		if t.InstructorDestinoID == instructorID && fechaCalendario(t.FechaDestino).Equal(f) {
			return true
		}
	}
	return false
}

func instructorSesionPrestadaTraslado(traslados []models.InstructorFichaTrasladoFecha, instructorID uint, fecha time.Time) (uint, bool) {
	f := fechaCalendario(fecha)
	for _, t := range traslados {
		if t.InstructorOrigenID == instructorID && fechaCalendario(t.FechaDestino).Equal(f) {
			return t.DiaDestinoID, true
		}
		if t.InstructorDestinoID == instructorID && fechaCalendario(t.FechaOrigen).Equal(f) {
			return t.DiaOrigenID, true
		}
	}
	return 0, false
}

func appendEventosDiaFicha(
	eventos []dto.InstructorAgendaEvent,
	ficha *models.FichaCaracterizacion,
	asg models.InstructorFichaCaracterizacion,
	d time.Time,
	diaID uint,
	ctx agendaContexto,
	horarioSvc *InstructorHorarioService,
) []dto.InstructorAgendaEvent {
	bloques := horarioSvc.bloquesDiaFicha(ficha, diaID)
	if len(bloques) == 0 {
		hi, hf := horarioSvc.horasDiaFicha(ficha, diaID)
		if hi == "" || hf == "" {
			return eventos
		}
		bloques = []HorarioBloqueInput{{DiaFormacionID: diaID, HoraInicio: hi, HoraFin: hf}}
	}
	for _, b := range bloques {
		eventos = append(eventos, dto.InstructorAgendaEvent{
			Fecha:               d.Format(time.DateOnly),
			DiaFormacionID:      diaID,
			DiaNombre:           nombreDiaPorID(diaID),
			HoraInicio:          normalizeHoraMM(b.HoraInicio),
			HoraFin:             normalizeHoraMM(b.HoraFin),
			FichaID:             ficha.ID,
			FichaNumero:         ficha.Ficha,
			ProgramaNombre:      ctx.progNombre,
			SedeNombre:          ctx.sedeNombre,
			AmbienteNombre:      ctx.ambienteNombre,
			InstructorID:        asg.InstructorID,
			InstructorNombre:    ctx.instNombre,
			InstructorDocumento: ctx.instDoc,
		})
	}
	return eventos
}

func parsearParFechasTraslado(par dto.TrasladoParFecha, parNum int) (time.Time, time.Time, error) {
	fechaOrigen, err := parseFechaTrasladoInput(par.FechaOrigen)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("par %d: fecha origen inválida", parNum)
	}
	fechaDestino, err := parseFechaTrasladoInput(par.FechaDestino)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("par %d: fecha destino inválida", parNum)
	}
	return fechaCalendario(fechaOrigen), fechaCalendario(fechaDestino), nil
}

func validarFechasNoPasadas(fechaOrigen, fechaDestino, hoy time.Time, parNum int) error {
	if fechaOrigen.Before(hoy) || fechaDestino.Before(hoy) {
		return fmt.Errorf("par %d: no se permiten fechas anteriores a hoy", parNum)
	}
	return nil
}

func validarDiasSemanaParTraslado(
	fechaOrigen, fechaDestino time.Time,
	diaOrigenID, diaDestinoID uint,
	parNum int,
) error {
	if WeekdayToDiaFormacionID(fechaOrigen.Weekday()) != diaOrigenID {
		return fmt.Errorf("par %d: la fecha origen no corresponde al día de formación seleccionado", parNum)
	}
	if WeekdayToDiaFormacionID(fechaDestino.Weekday()) != diaDestinoID {
		return fmt.Errorf("par %d: la fecha destino no corresponde al día de formación seleccionado", parNum)
	}
	return nil
}

func registrarFechasTraslado(vistas map[string]bool, fechas []time.Time, parNum int) error {
	for _, f := range fechas {
		key := f.Format(time.DateOnly)
		if vistas[key] {
			return fmt.Errorf("par %d: la fecha %s está repetida en la solicitud", parNum, key)
		}
		vistas[key] = true
	}
	return nil
}

func validarParFechasTraslado(
	req dto.TrasladarDiaRequest,
	par dto.TrasladoParFecha,
	parNum int,
	hoy time.Time,
	vistas map[string]bool,
) (models.InstructorFichaTrasladoFecha, error) {
	fechaOrigen, fechaDestino, err := parsearParFechasTraslado(par, parNum)
	if err != nil {
		return models.InstructorFichaTrasladoFecha{}, err
	}
	if err := validarFechasNoPasadas(fechaOrigen, fechaDestino, hoy, parNum); err != nil {
		return models.InstructorFichaTrasladoFecha{}, err
	}
	if err := validarDiasSemanaParTraslado(fechaOrigen, fechaDestino, req.DiaOrigenID, req.DiaDestinoID, parNum); err != nil {
		return models.InstructorFichaTrasladoFecha{}, err
	}
	if err := registrarFechasTraslado(vistas, []time.Time{fechaOrigen, fechaDestino}, parNum); err != nil {
		return models.InstructorFichaTrasladoFecha{}, err
	}
	return models.InstructorFichaTrasladoFecha{
		InstructorOrigenID:  req.InstructorOrigenID,
		InstructorDestinoID: req.InstructorDestinoID,
		DiaOrigenID:         req.DiaOrigenID,
		DiaDestinoID:        req.DiaDestinoID,
		FechaOrigen:         fechaOrigen,
		FechaDestino:        fechaDestino,
		Motivo:              strings.TrimSpace(req.Motivo),
	}, nil
}

func validarParesFechasTraslado(req dto.TrasladarDiaRequest) ([]models.InstructorFichaTrasladoFecha, error) {
	if len(req.ParesFechas) == 0 {
		return nil, errors.New("debe indicar al menos un par de fechas para el traslado")
	}
	hoy := fechaCalendario(time.Now())
	vistas := make(map[string]bool, len(req.ParesFechas)*2)
	out := make([]models.InstructorFichaTrasladoFecha, 0, len(req.ParesFechas))

	for i, par := range req.ParesFechas {
		row, err := validarParFechasTraslado(req, par, i+1, hoy, vistas)
		if err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, nil
}
