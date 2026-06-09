package services

import (
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

// InstructorAgendaService expande eventos de programación por semana.
type InstructorAgendaService struct {
	fichaRepo         repositories.FichaRepository
	instFichaRepo     repositories.InstructorFichaRepository
	instFichaDiasRepo repositories.InstructorFichaDiasRepository
	instRepo          repositories.InstructorRepository
	horarioSvc        *InstructorHorarioService
}

func NewInstructorAgendaService() *InstructorAgendaService {
	return &InstructorAgendaService{
		fichaRepo:         repositories.NewFichaRepository(),
		instFichaRepo:     repositories.NewInstructorFichaRepository(),
		instFichaDiasRepo: repositories.NewInstructorFichaDiasRepository(),
		instRepo:          repositories.NewInstructorRepository(),
		horarioSvc:        NewInstructorHorarioService(),
	}
}

func parseFechaLocal(s string) (time.Time, error) {
	return time.ParseInLocation(time.DateOnly, s, time.Local)
}

func nombreDiaPorID(id uint) string {
	return nombreDia(id)
}

// AgendaInstructor devuelve eventos del instructor en el rango [desde, hasta].
func (s *InstructorAgendaService) AgendaInstructor(instructorID uint, desde, hasta string) (*dto.InstructorAgendaResponse, error) {
	d0, err := parseFechaLocal(desde)
	if err != nil {
		return nil, err
	}
	d1, err := parseFechaLocal(hasta)
	if err != nil {
		return nil, err
	}
	assignments, err := s.instFichaRepo.FindByInstructorID(instructorID)
	if err != nil {
		return nil, err
	}
	var eventos []dto.InstructorAgendaEvent
	for _, asg := range assignments {
		evs, err := s.expandirAsignacion(asg, d0, d1, nil)
		if err != nil {
			return nil, err
		}
		eventos = append(eventos, evs...)
	}
	return &dto.InstructorAgendaResponse{Desde: desde, Hasta: hasta, Eventos: eventos}, nil
}

// AgendaFicha devuelve eventos de todos los instructores de la ficha en el rango.
func (s *InstructorAgendaService) AgendaFicha(fichaID uint, desde, hasta string) (*dto.InstructorAgendaResponse, error) {
	d0, err := parseFechaLocal(desde)
	if err != nil {
		return nil, err
	}
	d1, err := parseFechaLocal(hasta)
	if err != nil {
		return nil, err
	}
	assignments, err := s.instFichaRepo.FindByFichaID(fichaID)
	if err != nil {
		return nil, err
	}
	var eventos []dto.InstructorAgendaEvent
	for _, asg := range assignments {
		evs, err := s.expandirAsignacion(asg, d0, d1, &fichaID)
		if err != nil {
			return nil, err
		}
		eventos = append(eventos, evs...)
	}
	return &dto.InstructorAgendaResponse{Desde: desde, Hasta: hasta, Eventos: eventos}, nil
}

type agendaContexto struct {
	progNombre     string
	sedeNombre     string
	ambienteNombre string
	instNombre     string
	instDoc        string
	vigInicio      *time.Time
	vigFin         *time.Time
	diaSet         map[uint]bool
}

func (s *InstructorAgendaService) cargarContextoAgenda(
	asg models.InstructorFichaCaracterizacion,
	ficha *models.FichaCaracterizacion,
	diaIDs []uint,
) agendaContexto {
	ctx := agendaContexto{
		vigInicio: intersectarVigencia(ficha.FechaInicio, asg.FechaInicio),
		vigFin:    intersectarVigenciaFin(ficha.FechaFin, asg.FechaFin),
		diaSet:    make(map[uint]bool, len(diaIDs)),
	}
	for _, id := range diaIDs {
		ctx.diaSet[id] = true
	}
	if inst, err := s.instRepo.FindByID(asg.InstructorID); err == nil && inst != nil {
		if inst.Persona != nil {
			ctx.instNombre = inst.Persona.GetFullName()
			ctx.instDoc = inst.Persona.NumeroDocumento
		} else {
			ctx.instNombre = inst.NombreCompletoCache
			ctx.instDoc = inst.NumeroDocumentoCache
		}
	}
	if ficha.ProgramaFormacion != nil {
		ctx.progNombre = ficha.ProgramaFormacion.Nombre
	}
	if ficha.Sede != nil {
		ctx.sedeNombre = ficha.Sede.Nombre
	}
	ctx.ambienteNombre = formatAmbienteRuta(ficha.Ambiente)
	return ctx
}

func (s *InstructorAgendaService) eventosEnRango(
	ficha *models.FichaCaracterizacion,
	asg models.InstructorFichaCaracterizacion,
	desde, hasta time.Time,
	ctx agendaContexto,
) []dto.InstructorAgendaEvent {
	var eventos []dto.InstructorAgendaEvent
	for d := desde; !d.After(hasta); d = d.AddDate(0, 0, 1) {
		diaID := WeekdayToDiaFormacionID(d.Weekday())
		if !ctx.diaSet[diaID] {
			continue
		}
		diaMomento := time.Date(d.Year(), d.Month(), d.Day(), 0, 0, 0, 0, d.Location())
		if !diaDentroDeVigencia(diaMomento, ctx.vigInicio, ctx.vigFin) {
			continue
		}
		hi, hf := s.horarioSvc.horasDiaFicha(ficha, diaID)
		if hi == "" || hf == "" {
			continue
		}
		eventos = append(eventos, dto.InstructorAgendaEvent{
			Fecha:               d.Format(time.DateOnly),
			DiaFormacionID:      diaID,
			DiaNombre:           nombreDiaPorID(diaID),
			HoraInicio:          normalizeHoraMM(hi),
			HoraFin:             normalizeHoraMM(hf),
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

func (s *InstructorAgendaService) expandirAsignacion(
	asg models.InstructorFichaCaracterizacion,
	desde, hasta time.Time,
	fichaFilter *uint,
) ([]dto.InstructorAgendaEvent, error) {
	ficha, err := s.fichaRepo.FindByID(asg.FichaID)
	if err != nil || ficha == nil || !ficha.Status {
		return nil, nil
	}
	if fichaFilter != nil && *fichaFilter != asg.FichaID {
		return nil, nil
	}
	diasInst, err := s.instFichaDiasRepo.FindByInstructorAndFicha(asg.InstructorID, asg.FichaID)
	if err != nil {
		return nil, err
	}
	diaIDs := diaIDsProgramadosInstructor(diasInst)
	if len(diaIDs) == 0 {
		for _, fd := range ficha.FichaDiasFormacion {
			if fd.DiaFormacionID > 0 {
				diaIDs = append(diaIDs, fd.DiaFormacionID)
			}
		}
	}
	ctx := s.cargarContextoAgenda(asg, ficha, diaIDs)
	return s.eventosEnRango(ficha, asg, desde, hasta, ctx), nil
}
