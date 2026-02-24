package services

import (
	"errors"
	"fmt"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

type FichaService interface {
	FindAll(page, pageSize int, programaID *uint, instructorID *uint) ([]dto.FichaCaracterizacionResponse, int64, error)
	FindByID(id uint) (*dto.FichaCaracterizacionResponse, error)
	FindByIDWithDetail(id uint) (*dto.FichaCaracterizacionResponse, error)
	Create(req dto.FichaCaracterizacionRequest) (*dto.FichaCaracterizacionResponse, error)
	Update(id uint, req dto.FichaCaracterizacionRequest) (*dto.FichaCaracterizacionResponse, error)
	Delete(id uint) error
	ListInstructores(fichaID uint) ([]dto.InstructorFichaResponse, error)
	AsignarInstructores(fichaID uint, req dto.AsignarInstructoresRequest) error
	DesasignarInstructor(fichaID, instructorID uint) error
	ListAprendices(fichaID uint) ([]dto.AprendizResponse, error)
	AsignarAprendices(fichaID uint, personas []uint) error
	DesasignarAprendices(fichaID uint, personas []uint) error
}

type fichaService struct {
	fichaRepo     repositories.FichaRepository
	progRepo      repositories.ProgramaFormacionRepository
	instFichaRepo repositories.InstructorFichaRepository
	aprendizRepo  repositories.AprendizRepository
	fichaDiasRepo repositories.FichaDiasRepository
}

func NewFichaService() FichaService {
	return &fichaService{
		fichaRepo:     repositories.NewFichaRepository(),
		progRepo:     repositories.NewProgramaFormacionRepository(),
		instFichaRepo: repositories.NewInstructorFichaRepository(),
		aprendizRepo:  repositories.NewAprendizRepository(),
		fichaDiasRepo: repositories.NewFichaDiasRepository(),
	}
}

func (s *fichaService) FindAll(page, pageSize int, programaID *uint, instructorID *uint) ([]dto.FichaCaracterizacionResponse, int64, error) {
	list, total, err := s.fichaRepo.FindAll(page, pageSize, programaID, instructorID)
	if err != nil {
		return nil, 0, err
	}
	// Contar aprendices activos por ficha para las cards
	counts := make(map[uint]int)
	if len(list) > 0 {
		var ids []uint
		for i := range list {
			ids = append(ids, list[i].ID)
		}
		var rows []struct {
			FichaID uint
			Count   int64
		}
		if err := database.GetDB().Model(&models.Aprendiz{}).
			Where("ficha_caracterizacion_id IN ? AND estado = ?", ids, true).
			Group("ficha_caracterizacion_id").
			Select("ficha_caracterizacion_id as ficha_id, COUNT(*) as count").
			Scan(&rows).Error; err == nil {
			for _, r := range rows {
				counts[r.FichaID] = int(r.Count)
			}
		}
	}
	resp := make([]dto.FichaCaracterizacionResponse, len(list))
	for i := range list {
		c := counts[list[i].ID]
		resp[i] = s.fichaToResponse(list[i], c)
	}
	return resp, total, nil
}

func (s *fichaService) FindByID(id uint) (*dto.FichaCaracterizacionResponse, error) {
	f, err := s.fichaRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("ficha no encontrada")
	}
	var count int64
	database.GetDB().Model(&models.Aprendiz{}).Where("ficha_caracterizacion_id = ?", id).Count(&count)
	r := s.fichaToResponse(*f, int(count))
	return &r, nil
}

func (s *fichaService) FindByIDWithDetail(id uint) (*dto.FichaCaracterizacionResponse, error) {
	f, err := s.fichaRepo.FindByIDWithInstructoresAndAprendices(id)
	if err != nil {
		return nil, errors.New("ficha no encontrada")
	}
	r := s.fichaToResponse(*f, len(f.Aprendices))
	return &r, nil
}

func (s *fichaService) Create(req dto.FichaCaracterizacionRequest) (*dto.FichaCaracterizacionResponse, error) {
	if s.fichaRepo.ExistsByFicha(req.Ficha) {
		return nil, errors.New("ya existe una ficha con ese número")
	}
	if _, err := s.progRepo.FindByID(req.ProgramaFormacionID); err != nil {
		return nil, errors.New("programa de formación no encontrado")
	}
	// Regla: instructor líder obligatorio
	if req.InstructorID == nil || *req.InstructorID == 0 {
		return nil, errors.New("debe asignar un instructor líder a la ficha")
	}
	f := s.fichaRequestToModel(req)
	if req.Status != nil {
		f.Status = *req.Status
	} else {
		f.Status = true
	}
	if err := s.fichaRepo.Create(&f); err != nil {
		return nil, fmt.Errorf("error al crear ficha: %w", err)
	}
	// Validar líder según reglas de negocio y sincronizar en pivote
	instRepo := repositories.NewInstructorRepository()
	if err := ValidarAsignacionInstructor(*f.InstructorID, f.ID, true, instRepo, s.fichaRepo, s.instFichaRepo); err != nil {
		_ = s.fichaRepo.Delete(f.ID)
		return nil, err
	}
	if err := SincronizarInstructorLiderEnPivote(&f, s.instFichaRepo); err != nil {
		return nil, fmt.Errorf("error al sincronizar instructor líder: %w", err)
	}
	if len(req.DiasFormacionIDs) > 0 {
		_ = s.fichaDiasRepo.ReplaceByFichaID(f.ID, req.DiasFormacionIDs)
	}
	return s.FindByID(f.ID)
}

func (s *fichaService) Update(id uint, req dto.FichaCaracterizacionRequest) (*dto.FichaCaracterizacionResponse, error) {
	f, err := s.fichaRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("ficha no encontrada")
	}
	if s.fichaRepo.ExistsByFichaExcludingID(req.Ficha, id) {
		return nil, errors.New("ya existe otra ficha con ese número")
	}
	f.ProgramaFormacionID = req.ProgramaFormacionID
	f.Ficha = req.Ficha
	f.InstructorID = req.InstructorID
	f.FechaInicio = dto.FlexDateToTime(req.FechaInicio)
	f.FechaFin = dto.FlexDateToTime(req.FechaFin)
	f.AmbienteID = req.AmbienteID
	f.ModalidadFormacionID = req.ModalidadFormacionID
	f.SedeID = req.SedeID
	f.JornadaID = req.JornadaID
	f.TotalHoras = req.TotalHoras
	if req.Status != nil {
		f.Status = *req.Status
	}
	if err := s.fichaRepo.Update(f); err != nil {
		return nil, fmt.Errorf("error al actualizar ficha: %w", err)
	}
	if err := SincronizarInstructorLiderEnPivote(f, s.instFichaRepo); err != nil {
		return nil, fmt.Errorf("error al sincronizar instructor líder: %w", err)
	}
	if len(req.DiasFormacionIDs) > 0 {
		_ = s.fichaDiasRepo.ReplaceByFichaID(id, req.DiasFormacionIDs)
	}
	return s.FindByID(id)
}

func (s *fichaService) Delete(id uint) error {
	if _, err := s.fichaRepo.FindByID(id); err != nil {
		return errors.New("ficha no encontrada")
	}
	return s.fichaRepo.Delete(id)
}

func (s *fichaService) ListInstructores(fichaID uint) ([]dto.InstructorFichaResponse, error) {
	list, err := s.instFichaRepo.FindByFichaID(fichaID)
	if err != nil {
		return nil, err
	}
	resp := make([]dto.InstructorFichaResponse, len(list))
	for i := range list {
		resp[i] = s.instructorFichaToResponse(list[i])
	}
	return resp, nil
}

func (s *fichaService) AsignarInstructores(fichaID uint, req dto.AsignarInstructoresRequest) error {
	f, err := s.fichaRepo.FindByID(fichaID)
	if err != nil {
		return errors.New("ficha no encontrada")
	}
	instRepo := repositories.NewInstructorRepository()
	// Validar cada instructor según reglas de negocio antes de asignar
	for _, it := range req.Instructores {
		esLider := it.InstructorID == req.InstructorPrincipalID
		if err := ValidarAsignacionInstructor(it.InstructorID, fichaID, esLider, instRepo, s.fichaRepo, s.instFichaRepo); err != nil {
			return fmt.Errorf("instructor %d: %w", it.InstructorID, err)
		}
	}
	// Actualizar instructor principal de la ficha
	f.InstructorID = &req.InstructorPrincipalID
	if err := s.fichaRepo.Update(f); err != nil {
		return err
	}
	if err := SincronizarInstructorLiderEnPivote(f, s.instFichaRepo); err != nil {
		return fmt.Errorf("error al sincronizar instructor líder: %w", err)
	}
	// Crear o actualizar asignaciones
	for _, it := range req.Instructores {
		fechaInicio := it.FechaInicio.Time
		fechaFin := it.FechaFin.Time
		ex, err := s.instFichaRepo.FindByFichaIDAndInstructorID(fichaID, it.InstructorID)
		if err == nil {
			ex.CompetenciaID = it.CompetenciaID
			ex.FechaInicio = &fechaInicio
			ex.FechaFin = &fechaFin
			ex.TotalHorasInstructor = it.TotalHorasInstructor
			_ = s.instFichaRepo.Update(ex)
			continue
		}
		m := models.InstructorFichaCaracterizacion{
			InstructorID:          it.InstructorID,
			FichaID:                fichaID,
			CompetenciaID:          it.CompetenciaID,
			FechaInicio:            &fechaInicio,
			FechaFin:               &fechaFin,
			TotalHorasInstructor:   it.TotalHorasInstructor,
		}
		if err := s.instFichaRepo.Create(&m); err != nil {
			return fmt.Errorf("error al asignar instructor: %w", err)
		}
	}
	return nil
}

func (s *fichaService) DesasignarInstructor(fichaID, instructorID uint) error {
	return s.instFichaRepo.DeleteByFichaIDAndInstructorID(fichaID, instructorID)
}

func (s *fichaService) ListAprendices(fichaID uint) ([]dto.AprendizResponse, error) {
	list, err := s.aprendizRepo.FindByFichaID(fichaID)
	if err != nil {
		return nil, err
	}
	resp := make([]dto.AprendizResponse, len(list))
	for i := range list {
		resp[i] = s.aprendizToResponse(list[i], "")
	}
	return resp, nil
}

func (s *fichaService) AsignarAprendices(fichaID uint, personas []uint) error {
	if _, err := s.fichaRepo.FindByID(fichaID); err != nil {
		return errors.New("ficha no encontrada")
	}
	for _, personaID := range personas {
		a, err := s.aprendizRepo.FindByPersonaIDAndFichaID(personaID, fichaID)
		if err == nil {
			a.Estado = true
			_ = s.aprendizRepo.Update(a)
			continue
		}
		a = &models.Aprendiz{
			PersonaID:             personaID,
			FichaCaracterizacionID: fichaID,
			Estado:                true,
		}
		if err := s.aprendizRepo.Create(a); err != nil {
			return fmt.Errorf("error al asignar aprendiz: %w", err)
		}
	}
	return nil
}

func (s *fichaService) DesasignarAprendices(fichaID uint, personas []uint) error {
	for _, personaID := range personas {
		a, err := s.aprendizRepo.FindByPersonaIDAndFichaID(personaID, fichaID)
		if err != nil {
			continue
		}
		a.Estado = false
		_ = s.aprendizRepo.Update(a)
	}
	return nil
}

func (s *fichaService) fichaToResponse(f models.FichaCaracterizacion, cantidadAprendices int) dto.FichaCaracterizacionResponse {
	r := dto.FichaCaracterizacionResponse{
		ID:                    f.ID,
		ProgramaFormacionID:   f.ProgramaFormacionID,
		Ficha:                 f.Ficha,
		InstructorID:          f.InstructorID,
		FechaInicio:           f.FechaInicio,
		FechaFin:              f.FechaFin,
		AmbienteID:            f.AmbienteID,
		SedeID:                f.SedeID,
		ModalidadFormacionID:  f.ModalidadFormacionID,
		JornadaID:             f.JornadaID,
		TotalHoras:            f.TotalHoras,
		Status:                f.Status,
		CantidadAprendices:    cantidadAprendices,
	}
	if f.ProgramaFormacion != nil {
		r.ProgramaFormacionNombre = f.ProgramaFormacion.Nombre
	}
	if f.Instructor != nil {
		if f.Instructor.Persona != nil {
			r.InstructorNombre = f.Instructor.Persona.GetFullName()
		} else {
			r.InstructorNombre = f.Instructor.NombreCompletoCache
		}
	}
	if f.Ambiente != nil {
		r.AmbienteNombre = f.Ambiente.Nombre
	}
	if f.Sede != nil {
		r.SedeNombre = f.Sede.Nombre
	}
	if f.ModalidadFormacion != nil {
		r.ModalidadFormacionNombre = f.ModalidadFormacion.Nombre
	}
	if f.Jornada != nil {
		r.JornadaNombre = f.Jornada.Nombre
	}
	for _, fd := range f.FichaDiasFormacion {
		r.DiasFormacionIDs = append(r.DiasFormacionIDs, fd.DiaFormacionID)
	}
	return r
}

func (s *fichaService) fichaRequestToModel(req dto.FichaCaracterizacionRequest) models.FichaCaracterizacion {
	return models.FichaCaracterizacion{
		ProgramaFormacionID:  req.ProgramaFormacionID,
		Ficha:                req.Ficha,
		InstructorID:         req.InstructorID,
		FechaInicio:          dto.FlexDateToTime(req.FechaInicio),
		FechaFin:             dto.FlexDateToTime(req.FechaFin),
		AmbienteID:           req.AmbienteID,
		ModalidadFormacionID: req.ModalidadFormacionID,
		SedeID:               req.SedeID,
		JornadaID:            req.JornadaID,
		TotalHoras:           req.TotalHoras,
	}
}

func (s *fichaService) instructorFichaToResponse(m models.InstructorFichaCaracterizacion) dto.InstructorFichaResponse {
	r := dto.InstructorFichaResponse{
		ID:                   m.ID,
		InstructorID:         m.InstructorID,
		FichaID:              m.FichaID,
		CompetenciaID:        m.CompetenciaID,
		FechaInicio:          m.FechaInicio,
		FechaFin:             m.FechaFin,
		TotalHorasInstructor: m.TotalHorasInstructor,
	}
	if m.Instructor != nil {
		if m.Instructor.Persona != nil {
			r.InstructorNombre = m.Instructor.Persona.GetFullName()
		} else {
			r.InstructorNombre = m.Instructor.NombreCompletoCache
		}
	}
	if m.Competencia != nil {
		r.CompetenciaNombre = m.Competencia.Nombre
	}
	return r
}

func (s *fichaService) aprendizToResponse(a models.Aprendiz, fichaNumero string) dto.AprendizResponse {
	if fichaNumero == "" && a.FichaCaracterizacion != nil {
		fichaNumero = a.FichaCaracterizacion.Ficha
	}
	r := dto.AprendizResponse{
		ID:                     a.ID,
		PersonaID:              a.PersonaID,
		FichaCaracterizacionID: a.FichaCaracterizacionID,
		Estado:                 a.Estado,
		FichaNumero:            fichaNumero,
	}
	if a.Persona != nil {
		r.PersonaNombre = a.Persona.GetFullName()
		r.PersonaDocumento = a.Persona.NumeroDocumento
	}
	if a.FichaCaracterizacion != nil {
		if a.FichaCaracterizacion.ProgramaFormacion != nil {
			r.ProgramaNombre = a.FichaCaracterizacion.ProgramaFormacion.Nombre
		}
		if a.FichaCaracterizacion.Sede != nil && a.FichaCaracterizacion.Sede.Regional != nil {
			r.RegionalNombre = a.FichaCaracterizacion.Sede.Regional.Nombre
		}
	}
	return r
}
