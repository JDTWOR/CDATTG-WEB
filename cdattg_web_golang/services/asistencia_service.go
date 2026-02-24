package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

type AsistenciaService interface {
	CreateSesion(req dto.AsistenciaRequest) (*dto.AsistenciaResponse, error)
	EntrarTomarAsistencia(instructorID uint, fichaID uint) (*dto.AsistenciaResponse, error)
	GetByID(id uint) (*dto.AsistenciaResponse, error)
	ListByInstructorFichaID(instructorFichaID uint) ([]dto.AsistenciaResponse, error)
	ListByFichaIDAndFechas(fichaID uint, fechaInicio, fechaFin string) ([]dto.AsistenciaResponse, error)
	Finalizar(id uint) (*dto.AsistenciaResponse, error)
	RegistrarIngreso(req dto.AsistenciaAprendizRequest) (*dto.AsistenciaAprendizResponse, error)
	RegistrarIngresoPorDocumento(req dto.AsistenciaIngresoPorDocumentoRequest) (*dto.AsistenciaAprendizResponse, error)
	RegistrarSalida(asistenciaAprendizID uint) (*dto.AsistenciaAprendizResponse, error)
	ActualizarObservaciones(asistenciaAprendizID uint, observaciones string) (*dto.AsistenciaAprendizResponse, error)
	CrearOActualizarObservaciones(asistenciaID, aprendizID uint, observaciones string) (*dto.AsistenciaAprendizResponse, error)
	ListAprendicesEnSesion(asistenciaID uint) ([]dto.AsistenciaAprendizResponse, error)
	GetDashboard(sedeID *uint, fecha string) (*dto.AsistenciaDashboardResponse, error)
}

type asistenciaService struct {
	repo          repositories.AsistenciaRepository
	repoAA        repositories.AsistenciaAprendizRepository
	instFichaRepo repositories.InstructorFichaRepository
	instRepo      repositories.InstructorRepository
	personaRepo   repositories.PersonaRepository
	aprendizRepo  repositories.AprendizRepository
	evidenciaRepo repositories.EvidenciaRepository
	fichaRepo     repositories.FichaRepository
}

func NewAsistenciaService() AsistenciaService {
	return &asistenciaService{
		repo:          repositories.NewAsistenciaRepository(),
		repoAA:        repositories.NewAsistenciaAprendizRepository(),
		instFichaRepo: repositories.NewInstructorFichaRepository(),
		instRepo:      repositories.NewInstructorRepository(),
		personaRepo:   repositories.NewPersonaRepository(),
		aprendizRepo:  repositories.NewAprendizRepository(),
		evidenciaRepo: repositories.NewEvidenciaRepository(),
		fichaRepo:     repositories.NewFichaRepository(),
	}
}

func (s *asistenciaService) CreateSesion(req dto.AsistenciaRequest) (*dto.AsistenciaResponse, error) {
	fecha, err := time.Parse("2006-01-02", req.Fecha)
	if err != nil {
		return nil, errors.New("fecha inválida, use YYYY-MM-DD")
	}
	// Regla: solo una sesión activa por ficha (no por instructor-ficha)
	ifc, _ := s.instFichaRepo.FindByID(req.InstructorFichaID)
	if ifc != nil {
		activa, _ := s.repo.FindActivaByFichaID(ifc.FichaID)
		if activa != nil {
			return nil, errors.New("ya existe una sesión de asistencia activa para esta ficha. Finalícela antes de crear otra")
		}
	}
	// Crear evidencia por defecto para la sesión
	fichaNum := ""
	if ifc != nil && ifc.Ficha != nil {
		fichaNum = ifc.Ficha.Ficha
	}
	if fichaNum == "" {
		fichaNum = "ficha"
	}
	ev := models.Evidencia{
		Nombre: fmt.Sprintf("Asistencia Ficha %s %s", fichaNum, req.Fecha),
		Codigo: fmt.Sprintf("ASIST-%s-%s", fichaNum, req.Fecha),
	}
	if err := s.evidenciaRepo.Create(&ev); err != nil {
		return nil, fmt.Errorf("error al crear evidencia: %w", err)
	}
	a := models.Asistencia{
		InstructorFichaID: req.InstructorFichaID,
		Fecha:             fecha,
		HoraInicio:        req.HoraInicio,
		IsFinished:        false,
		EvidenciaID:       &ev.ID,
	}
	if a.HoraInicio == nil {
		now := time.Now()
		a.HoraInicio = &now
	}
	if err := s.repo.Create(&a); err != nil {
		return nil, fmt.Errorf("error al crear sesión: %w", err)
	}
	return s.GetByID(a.ID)
}

// EntrarTomarAsistencia devuelve la sesión activa para la ficha (la del instructor o la de otro instructor asignado a la misma ficha) o crea una nueva (hoy). Error si el instructor no está asignado a esa ficha.
func (s *asistenciaService) EntrarTomarAsistencia(instructorID uint, fichaID uint) (*dto.AsistenciaResponse, error) {
	ifc, err := s.instFichaRepo.FindByFichaIDAndInstructorID(fichaID, instructorID)
	if err != nil || ifc == nil {
		return nil, errors.New("no está asignado como instructor de esta ficha")
	}
	// Validar horario de jornada (opcional: si la ficha tiene jornada configurada)
	if ficha, _ := s.fichaRepo.FindByID(ifc.FichaID); ficha != nil && ficha.JornadaID != nil {
		ok, _ := NewJornadaValidationService().ValidarHorarioJornada(*ficha.JornadaID)
		if !ok {
			return nil, errors.New("fuera del horario de la jornada de la ficha; solo se puede tomar asistencia en el horario configurado")
		}
	}
	// 1) Sesión activa de este instructor para la ficha → usarla
	activa, _ := s.repo.FindActivaByInstructorFichaID(ifc.ID)
	if activa != nil {
		return s.asistenciaToResponse(activa), nil
	}
	// 2) Sesión activa de la ficha (creada por otro instructor) → permitir acceder a esa misma sesión
	activaFicha, _ := s.repo.FindActivaByFichaID(ifc.FichaID)
	if activaFicha != nil {
		return s.asistenciaToResponse(activaFicha), nil
	}
	// 3) No hay sesión activa → crear una nueva
	hoy := time.Now().Format("2006-01-02")
	return s.CreateSesion(dto.AsistenciaRequest{
		InstructorFichaID: ifc.ID,
		Fecha:             hoy,
	})
}

func (s *asistenciaService) GetByID(id uint) (*dto.AsistenciaResponse, error) {
	a, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("sesión de asistencia no encontrada")
	}
	return s.asistenciaToResponse(a), nil
}

func (s *asistenciaService) ListByInstructorFichaID(instructorFichaID uint) ([]dto.AsistenciaResponse, error) {
	list, err := s.repo.FindByInstructorFichaID(instructorFichaID)
	if err != nil {
		return nil, err
	}
	resp := make([]dto.AsistenciaResponse, len(list))
	for i := range list {
		resp[i] = *s.asistenciaToResponse(&list[i])
	}
	return resp, nil
}

func (s *asistenciaService) ListByFichaIDAndFechas(fichaID uint, fechaInicio, fechaFin string) ([]dto.AsistenciaResponse, error) {
	list, err := s.repo.FindByFichaIDAndFechas(fichaID, fechaInicio, fechaFin)
	if err != nil {
		return nil, err
	}
	resp := make([]dto.AsistenciaResponse, len(list))
	for i := range list {
		resp[i] = *s.asistenciaToResponse(&list[i])
	}
	return resp, nil
}

func (s *asistenciaService) Finalizar(id uint) (*dto.AsistenciaResponse, error) {
	a, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("sesión no encontrada")
	}
	if a.IsFinished {
		return nil, errors.New("la sesión ya está finalizada")
	}
	now := time.Now()
	a.HoraFin = &now
	a.IsFinished = true
	if err := s.repo.Update(a); err != nil {
		return nil, err
	}
	// Generar reporte (asistieron / no asistieron) y guardar en storage/asistencia_pdfs
	if a2, errLoad := s.repo.FindByID(id); errLoad == nil && a2.InstructorFicha != nil {
		fichaID := a2.InstructorFicha.FichaID
		if aprendices, errAp := CargarAprendicesFichaParaReporte(fichaID); errAp == nil {
			_, _ = GenerateReporteFinalizacion(a2, aprendices)
		}
	}
	return s.GetByID(id)
}

func (s *asistenciaService) RegistrarIngreso(req dto.AsistenciaAprendizRequest) (*dto.AsistenciaAprendizResponse, error) {
	asist, err := s.repo.FindByID(req.AsistenciaID)
	if err != nil {
		return nil, errors.New("sesi?n de asistencia no encontrada")
	}
	if asist.IsFinished {
		return nil, errors.New("la sesi?n ya est? finalizada")
	}
	// Regla: una sola entrada sin salida por d?a por aprendiz en la ficha
	var fichaID uint
	if asist.InstructorFicha != nil {
		fichaID = asist.InstructorFicha.FichaID
	} else {
		ifc, _ := s.instFichaRepo.FindByID(asist.InstructorFichaID)
		if ifc != nil {
			fichaID = ifc.FichaID
		}
	}
	if fichaID > 0 {
		hoy := time.Now().Format("2006-01-02")
		sessionIDs, _ := s.repo.FindIDsByFichaIDAndFecha(fichaID, hoy)
		if len(sessionIDs) > 0 {
			sinSalida, _ := s.repoAA.FindEntryWithoutExitByAprendizIDAndAsistenciaIDs(req.AprendizID, sessionIDs)
			if sinSalida != nil && sinSalida.AsistenciaID != req.AsistenciaID {
				return nil, errors.New("el aprendiz ya tiene un ingreso sin salida registrado hoy en esta ficha")
			}
		}
	}
	exist, _ := s.repoAA.FindByAsistenciaIDAndAprendizID(req.AsistenciaID, req.AprendizID)
	if exist != nil && exist.HoraIngreso != nil {
		return nil, errors.New("el aprendiz ya tiene registro de ingreso en esta sesi?n")
	}
	now := time.Now()
	aa := models.AsistenciaAprendiz{
		AsistenciaID:      req.AsistenciaID,
		InstructorFichaID: &asist.InstructorFichaID,
		AprendizFichaID:   req.AprendizID,
		HoraIngreso:       &now,
	}
	if exist != nil {
		exist.HoraIngreso = &now
		if err := s.repoAA.Update(exist); err != nil {
			return nil, err
		}
		return s.aaToResponse(exist), nil
	}
	if err := s.repoAA.Create(&aa); err != nil {
		return nil, fmt.Errorf("error al registrar ingreso: %w", err)
	}
	return s.GetAsistenciaAprendizByID(aa.ID)
}

func (s *asistenciaService) RegistrarIngresoPorDocumento(req dto.AsistenciaIngresoPorDocumentoRequest) (*dto.AsistenciaAprendizResponse, error) {
	asist, err := s.repo.FindByID(req.AsistenciaID)
	if err != nil {
		return nil, errors.New("sesi?n de asistencia no encontrada")
	}
	if asist.IsFinished {
		return nil, errors.New("la sesi?n ya est? finalizada")
	}
	ifc, err := s.instFichaRepo.FindByID(asist.InstructorFichaID)
	if err != nil || ifc == nil {
		return nil, errors.New("no se pudo obtener la ficha de la sesi?n")
	}
	persona, err := s.personaRepo.FindByNumeroDocumento(req.NumeroDocumento)
	if err != nil || persona == nil {
		return nil, errors.New("no se encontr? ninguna persona con ese n?mero de documento")
	}
	aprendiz, err := s.aprendizRepo.FindByPersonaIDAndFichaID(persona.ID, ifc.FichaID)
	if err != nil || aprendiz == nil {
		return nil, errors.New("el documento no corresponde a un aprendiz de esta ficha")
	}
	hoy := time.Now().Format("2006-01-02")
	sessionIDs, _ := s.repo.FindIDsByFichaIDAndFecha(ifc.FichaID, hoy)
	// Si ya tiene entrada sin salida hoy ? registrar salida
	if len(sessionIDs) > 0 {
		sinSalida, _ := s.repoAA.FindEntryWithoutExitByAprendizIDAndAsistenciaIDs(aprendiz.ID, sessionIDs)
		if sinSalida != nil {
			resp, err := s.RegistrarSalida(sinSalida.ID)
			if err != nil {
				return nil, err
			}
			resp.TipoRegistro = "salida"
			resp.Mensaje = "Salida registrada"
			return resp, nil
		}
		// Si ya tiene entrada y salida hoy ? asistencia completa
		conSalida, _ := s.repoAA.FindEntryWithExitByAprendizIDAndAsistenciaIDs(aprendiz.ID, sessionIDs)
		if conSalida != nil {
			r := s.aaToResponse(conSalida)
			r.TipoRegistro = "asistencia_completa"
			r.Mensaje = "Asistencia completa (ya registr? entrada y salida hoy)"
			return r, nil
		}
	}
	// Primera vez hoy ? registrar ingreso
	resp, err := s.RegistrarIngreso(dto.AsistenciaAprendizRequest{
		AsistenciaID: req.AsistenciaID,
		AprendizID:   aprendiz.ID,
	})
	if err != nil {
		return nil, err
	}
	resp.TipoRegistro = "ingreso"
	resp.Mensaje = "Ingreso registrado"
	return resp, nil
}

func (s *asistenciaService) RegistrarSalida(asistenciaAprendizID uint) (*dto.AsistenciaAprendizResponse, error) {
	aa, err := s.repoAA.FindByID(asistenciaAprendizID)
	if err != nil {
		return nil, errors.New("registro de asistencia no encontrado")
	}
	if aa.HoraIngreso == nil {
		return nil, errors.New("el aprendiz no tiene hora de ingreso")
	}
	if aa.HoraSalida != nil {
		return nil, errors.New("ya tiene hora de salida registrada")
	}
	now := time.Now()
	aa.HoraSalida = &now
	if err := s.repoAA.Update(aa); err != nil {
		return nil, err
	}
	return s.aaToResponse(aa), nil
}

func (s *asistenciaService) ActualizarObservaciones(asistenciaAprendizID uint, observaciones string) (*dto.AsistenciaAprendizResponse, error) {
	aa, err := s.repoAA.FindByID(asistenciaAprendizID)
	if err != nil {
		return nil, errors.New("registro de asistencia no encontrado")
	}
	aa.Observaciones = observaciones
	if err := s.repoAA.Update(aa); err != nil {
		return nil, err
	}
	return s.aaToResponse(aa), nil
}

func (s *asistenciaService) CrearOActualizarObservaciones(asistenciaID, aprendizID uint, observaciones string) (*dto.AsistenciaAprendizResponse, error) {
	asist, err := s.repo.FindByID(asistenciaID)
	if err != nil || asist == nil {
		return nil, errors.New("sesión de asistencia no encontrada")
	}
	if asist.IsFinished {
		return nil, errors.New("la sesión ya está finalizada")
	}
	aa, _ := s.repoAA.FindByAsistenciaIDAndAprendizID(asistenciaID, aprendizID)
	if aa != nil {
		aa.Observaciones = observaciones
		if err := s.repoAA.Update(aa); err != nil {
			return nil, err
		}
		return s.aaToResponse(aa), nil
	}
	aa = &models.AsistenciaAprendiz{
		AsistenciaID:      asistenciaID,
		InstructorFichaID:  &asist.InstructorFichaID,
		AprendizFichaID:   aprendizID,
		Observaciones:     observaciones,
	}
	if err := s.repoAA.Create(aa); err != nil {
		return nil, fmt.Errorf("error al guardar observaciones: %w", err)
	}
	return s.GetAsistenciaAprendizByID(aa.ID)
}

func (s *asistenciaService) ListAprendicesEnSesion(asistenciaID uint) ([]dto.AsistenciaAprendizResponse, error) {
	list, err := s.repoAA.FindByAsistenciaID(asistenciaID)
	if err != nil {
		return nil, err
	}
	resp := make([]dto.AsistenciaAprendizResponse, len(list))
	for i := range list {
		resp[i] = *s.aaToResponse(&list[i])
	}
	return resp, nil
}

func (s *asistenciaService) GetDashboard(sedeID *uint, fecha string) (*dto.AsistenciaDashboardResponse, error) {
	total, porFicha, err := s.repo.GetDashboardResumen(sedeID, fecha)
	if err != nil {
		return nil, err
	}
	resp := &dto.AsistenciaDashboardResponse{
		Fecha:                      fecha,
		TotalAprendicesEnFormacion: total,
		PorFicha:                   make([]dto.AsistenciaDashboardPorFicha, len(porFicha)),
	}
	for i := range porFicha {
		resp.PorFicha[i] = dto.AsistenciaDashboardPorFicha{
			FichaID:          porFicha[i].FichaID,
			FichaNumero:      porFicha[i].FichaNumero,
			SedeNombre:       porFicha[i].SedeNombre,
			CantidadVinieron: porFicha[i].Cantidad,
		}
	}
	return resp, nil
}

func (s *asistenciaService) GetAsistenciaAprendizByID(id uint) (*dto.AsistenciaAprendizResponse, error) {
	aa, err := s.repoAA.FindByID(id)
	if err != nil {
		return nil, err
	}
	return s.aaToResponse(aa), nil
}

func (s *asistenciaService) asistenciaToResponse(a *models.Asistencia) *dto.AsistenciaResponse {
	r := &dto.AsistenciaResponse{
		ID:                a.ID,
		InstructorFichaID: a.InstructorFichaID,
		Fecha:             a.Fecha,
		HoraInicio:        a.HoraInicio,
		HoraFin:           a.HoraFin,
		IsFinished:        a.IsFinished,
		Observaciones:     a.Observaciones,
		CantidadAprendices: len(a.AsistenciaAprendices),
	}
	if a.InstructorFicha != nil && a.InstructorFicha.Ficha != nil {
		r.FichaID = a.InstructorFicha.FichaID
		r.FichaNumero = a.InstructorFicha.Ficha.Ficha
	}
	return r
}

func (s *asistenciaService) aaToResponse(aa *models.AsistenciaAprendiz) *dto.AsistenciaAprendizResponse {
	r := &dto.AsistenciaAprendizResponse{
		ID:             aa.ID,
		AsistenciaID:   aa.AsistenciaID,
		AprendizID:     aa.AprendizFichaID,
		HoraIngreso:    aa.HoraIngreso,
		HoraSalida:     aa.HoraSalida,
		Observaciones:  aa.Observaciones,
	}
	if aa.Aprendiz != nil && aa.Aprendiz.Persona != nil {
		r.AprendizNombre  = aa.Aprendiz.Persona.GetFullName()
		r.NumeroDocumento = aa.Aprendiz.Persona.NumeroDocumento
	}
	return r
}
