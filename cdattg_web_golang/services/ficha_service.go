package services

import (
	"errors"
	"fmt"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

const (
	msgFichaNoEncontrada      = "ficha no encontrada"
	errFmtSyncInstructorLider = "error al sincronizar instructor líder: %w"
)

type FichaService interface {
	FindAll(page, pageSize int, programaID *uint, instructorID *uint, search string) ([]dto.FichaCaracterizacionResponse, int64, error)
	FindByID(id uint) (*dto.FichaCaracterizacionResponse, error)
	FindByIDWithDetail(id uint) (*dto.FichaCaracterizacionResponse, error)
	GetCodigo(id uint) (string, error)
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
		progRepo:      repositories.NewProgramaFormacionRepository(),
		instFichaRepo: repositories.NewInstructorFichaRepository(),
		aprendizRepo:  repositories.NewAprendizRepository(),
		fichaDiasRepo: repositories.NewFichaDiasRepository(),
	}
}

// conteosAprendicesActivosPorFicha agrupa COUNT por ficha (errores de consulta → mapa vacío, mismo criterio que antes).
func conteosAprendicesActivosPorFicha(ids []uint) map[uint]int {
	out := make(map[uint]int)
	if len(ids) == 0 {
		return out
	}
	var rows []struct {
		FichaID uint
		Count   int64
	}
	if err := database.GetDB().Model(&models.Aprendiz{}).
		Where("ficha_caracterizacion_id IN ? AND estado = ?", ids, true).
		Group("ficha_caracterizacion_id").
		Select("ficha_caracterizacion_id as ficha_id, COUNT(*) as count").
		Scan(&rows).Error; err != nil {
		return out
	}
	for _, r := range rows {
		out[r.FichaID] = int(r.Count)
	}
	return out
}

// diaFormacionIDsPorFichaIDs carga pivote ficha_dias_formacion (consulta explícita; evita fallos de Scan con Model+Select en algunos drivers).
func diaFormacionIDsPorFichaIDs(ids []uint) (map[uint][]uint, error) {
	out := make(map[uint][]uint)
	if len(ids) == 0 {
		return out, nil
	}
	type diaListRow struct {
		FichaID        int64 `gorm:"column:ficha_id"`
		DiaFormacionID int64 `gorm:"column:dia_formacion_id"`
	}
	var diaRows []diaListRow
	if err := database.GetDB().Table("ficha_dias_formacion").
		Select("ficha_id, dia_formacion_id").
		Where("ficha_id IN ?", ids).
		Where("deleted_at IS NULL").
		Scan(&diaRows).Error; err != nil {
		return nil, fmt.Errorf("error al cargar días de formación del listado: %w", err)
	}
	for _, dr := range diaRows {
		if dr.FichaID <= 0 || dr.DiaFormacionID <= 0 {
			continue
		}
		fid := uint(dr.FichaID)
		out[fid] = append(out[fid], uint(dr.DiaFormacionID))
	}
	return out, nil
}

func (s *fichaService) FindAll(page, pageSize int, programaID *uint, instructorID *uint, search string) ([]dto.FichaCaracterizacionResponse, int64, error) {
	list, total, err := s.fichaRepo.FindAll(page, pageSize, programaID, instructorID, search)
	if err != nil {
		return nil, 0, err
	}
	ids := make([]uint, len(list))
	for i := range list {
		ids[i] = list[i].ID
	}
	counts := conteosAprendicesActivosPorFicha(ids)
	diaIDsByFicha, err := diaFormacionIDsPorFichaIDs(ids)
	if err != nil {
		return nil, 0, err
	}
	resp := make([]dto.FichaCaracterizacionResponse, len(list))
	for i := range list {
		resp[i] = s.fichaToResponse(list[i], counts[list[i].ID])
		if d := diaIDsByFicha[list[i].ID]; len(d) > 0 {
			resp[i].DiasFormacionIDs = d
		}
	}
	return resp, total, nil
}

func (s *fichaService) FindByID(id uint) (*dto.FichaCaracterizacionResponse, error) {
	f, err := s.fichaRepo.FindByID(id)
	if err != nil {
		return nil, errors.New(msgFichaNoEncontrada)
	}
	var count int64
	database.GetDB().Model(&models.Aprendiz{}).Where("ficha_caracterizacion_id = ?", id).Count(&count)
	r := s.fichaToResponse(*f, int(count))
	return &r, nil
}

func (s *fichaService) FindByIDWithDetail(id uint) (*dto.FichaCaracterizacionResponse, error) {
	f, err := s.fichaRepo.FindByIDWithInstructoresAndAprendices(id)
	if err != nil {
		return nil, errors.New(msgFichaNoEncontrada)
	}
	r := s.fichaToResponse(*f, len(f.Aprendices))
	return &r, nil
}

func (s *fichaService) GetCodigo(id uint) (string, error) {
	f, err := s.fichaRepo.FindByID(id)
	if err != nil {
		return "", errors.New(msgFichaNoEncontrada)
	}
	return f.Ficha, nil
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
		return nil, fmt.Errorf(errFmtSyncInstructorLider, err)
	}
	if req.DiasFormacionIDs != nil {
		if err := s.fichaDiasRepo.ReplaceByFichaID(f.ID, req.DiasFormacionIDs); err != nil {
			return nil, fmt.Errorf("error al guardar días de formación: %w", err)
		}
	}
	return s.FindByID(f.ID)
}

func (s *fichaService) Update(id uint, req dto.FichaCaracterizacionRequest) (*dto.FichaCaracterizacionResponse, error) {
	f, err := s.fichaRepo.FindByID(id)
	if err != nil {
		return nil, errors.New(msgFichaNoEncontrada)
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
	// Evitar que GORM reescriba FKs con asociaciones pre-cargadas; usar solo los IDs asignados arriba.
	f.Jornada = nil
	f.Ambiente = nil
	f.ModalidadFormacion = nil
	f.Sede = nil
	f.Instructor = nil
	// Evitar que Save intente sincronizar la relación HasMany ya cargada (puede interferir con Replace posterior).
	f.FichaDiasFormacion = nil
	f.TotalHoras = req.TotalHoras
	if req.Status != nil {
		f.Status = *req.Status
	}
	if err := s.fichaRepo.Update(f); err != nil {
		return nil, fmt.Errorf("error al actualizar ficha: %w", err)
	}
	if err := SincronizarInstructorLiderEnPivote(f, s.instFichaRepo); err != nil {
		return nil, fmt.Errorf(errFmtSyncInstructorLider, err)
	}
	if req.DiasFormacionIDs != nil {
		if err := s.fichaDiasRepo.ReplaceByFichaID(id, req.DiasFormacionIDs); err != nil {
			return nil, fmt.Errorf("error al guardar días de formación: %w", err)
		}
	}
	return s.FindByID(id)
}

func (s *fichaService) Delete(id uint) error {
	if _, err := s.fichaRepo.FindByID(id); err != nil {
		return errors.New(msgFichaNoEncontrada)
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
		return errors.New(msgFichaNoEncontrada)
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
		return fmt.Errorf(errFmtSyncInstructorLider, err)
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
			InstructorID:         it.InstructorID,
			FichaID:              fichaID,
			CompetenciaID:        it.CompetenciaID,
			FechaInicio:          &fechaInicio,
			FechaFin:             &fechaFin,
			TotalHorasInstructor: it.TotalHorasInstructor,
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
		return errors.New(msgFichaNoEncontrada)
	}
	for _, personaID := range personas {
		a, err := s.aprendizRepo.FindByPersonaIDAndFichaID(personaID, fichaID)
		if err == nil {
			a.Estado = true
			_ = s.aprendizRepo.Update(a)
			continue
		}
		a = &models.Aprendiz{
			PersonaID:              personaID,
			FichaCaracterizacionID: fichaID,
			Estado:                 true,
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
		ID:                   f.ID,
		ProgramaFormacionID:  f.ProgramaFormacionID,
		Ficha:                f.Ficha,
		InstructorID:         f.InstructorID,
		FechaInicio:          f.FechaInicio,
		FechaFin:             f.FechaFin,
		AmbienteID:           f.AmbienteID,
		SedeID:               f.SedeID,
		ModalidadFormacionID: f.ModalidadFormacionID,
		JornadaID:            f.JornadaID,
		TotalHoras:           f.TotalHoras,
		Status:               f.Status,
		CantidadAprendices:   cantidadAprendices,
		DiasFormacionIDs:     []uint{},
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
