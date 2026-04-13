package services

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

const (
	errMsgSesionAsistenciaNoEncontrada   = "SESIÓN DE ASISTENCIA NO ENCONTRADA"
	errMsgSesionYaFinalizada             = "LA SESIÓN YA ESTÁ FINALIZADA"
	errMsgRegistroAsistenciaNoEncontrado = "REGISTRO DE ASISTENCIA NO ENCONTRADO"
	errMsgFechaInvalida                  = "FECHA INVÁLIDA, USE YYYY-MM-DD"
	errMsgYaExisteSesionActiva           = "YA EXISTE UNA SESIÓN DE ASISTENCIA ACTIVA PARA ESTA FICHA. FINALÍCELA ANTES DE CREAR OTRA"
	errMsgNoEstaCreadoComoInstructor     = "NO ESTÁ CREADO COMO INSTRUCTOR DE ESTA FICHA"
	errMsgFueraDelHorarioJornada         = "FUERA DEL HORARIO DE LA JORNADA DE LA FICHA; SOLO SE PUEDE TOMAR ASISTENCIA EN EL HORARIO CONFIGURADO"
)

type AsistenciaService interface {
	CreateSesion(req dto.AsistenciaRequest) (*dto.AsistenciaResponse, error)
	EntrarTomarAsistencia(instructorID uint, fichaID uint) (*dto.AsistenciaResponse, error)
	GetByID(id uint) (*dto.AsistenciaResponse, error)
	ListByInstructorFichaID(instructorFichaID uint) ([]dto.AsistenciaResponse, error)
	ListByFichaIDAndFechas(fichaID uint, fechaInicio, fechaFin string) ([]dto.AsistenciaResponse, error)
	Finalizar(id uint) (*dto.AsistenciaResponse, error)
	RegistrarIngreso(req dto.AsistenciaAprendizRequest, instructorFichaIDRegistroIngreso *uint) (*dto.AsistenciaAprendizResponse, error)
	RegistrarIngresoPorDocumento(req dto.AsistenciaIngresoPorDocumentoRequest, instructorFichaIDRegistroIngreso *uint) (*dto.AsistenciaAprendizResponse, error)
	RegistrarSalida(asistenciaAprendizID uint, instructorFichaIDRegistroSalida *uint) (*dto.AsistenciaAprendizResponse, error)
	ActualizarObservaciones(asistenciaAprendizID uint, observaciones string) (*dto.AsistenciaAprendizResponse, error)
	CrearOActualizarObservaciones(asistenciaID, aprendizID uint, observaciones string, tipoObservacionIDs []uint) (*dto.AsistenciaAprendizResponse, error)
	ListAprendicesEnSesion(asistenciaID uint) ([]dto.AsistenciaAprendizResponse, error)
	ListTiposObservacionAsistencia() ([]dto.TipoObservacionAsistenciaItem, error)
	CrearTipoObservacionAsistencia(req dto.TipoObservacionAsistenciaCreateRequest) (*dto.TipoObservacionAsistenciaItem, error)
	GetDashboard(sedeID *uint, fecha string) (*dto.AsistenciaDashboardResponse, error)
	GetCasosBienestar(sedeID *uint, dias, minFallas int) (*dto.CasosBienestarResponse, error)
	GetDetalleInasistenciasAprendiz(fichaNumero string, aprendizID uint, dias int, sedeNombre string) (*dto.CasoBienestarAprendizDetalleResponse, error)
	AjustarEstadoAprendiz(asistenciaAprendizID uint, estado, motivo string, instructorFichaIDRegistroSalida *uint) (*dto.AsistenciaAprendizResponse, error)
	ListPendientesRevision(instructorID uint, fecha string) ([]dto.AsistenciaAprendizResponse, error)
	FinalizarSesionesVencidas()
}

type asistenciaService struct {
	repo          repositories.AsistenciaRepository
	repoAA        repositories.AsistenciaAprendizRepository
	tipoObsRepo   repositories.TipoObservacionAsistenciaRepository
	instFichaRepo repositories.InstructorFichaRepository
	instRepo      repositories.InstructorRepository
	personaRepo   repositories.PersonaRepository
	aprendizRepo  repositories.AprendizRepository
	evidenciaRepo repositories.EvidenciaRepository
	fichaRepo     repositories.FichaRepository
}

// esSesionDeHoy indica si la fecha de la sesión (interpretada en hora local) es el día de hoy.
func esSesionDeHoy(fecha time.Time) bool {
	now := time.Now()
	loc := now.Location()
	local := fecha.In(loc)
	return local.Year() == now.Year() && local.Month() == now.Month() && local.Day() == now.Day()
}

func NewAsistenciaService() AsistenciaService {
	return &asistenciaService{
		repo:          repositories.NewAsistenciaRepository(),
		repoAA:        repositories.NewAsistenciaAprendizRepository(),
		tipoObsRepo:   repositories.NewTipoObservacionAsistenciaRepository(),
		instFichaRepo: repositories.NewInstructorFichaRepository(),
		instRepo:      repositories.NewInstructorRepository(),
		personaRepo:   repositories.NewPersonaRepository(),
		aprendizRepo:  repositories.NewAprendizRepository(),
		evidenciaRepo: repositories.NewEvidenciaRepository(),
		fichaRepo:     repositories.NewFichaRepository(),
	}
}

func (s *asistenciaService) CreateSesion(req dto.AsistenciaRequest) (*dto.AsistenciaResponse, error) {
	// Parsear como medianoche en hora local para que el día de la sesión sea correcto en cualquier zona horaria.
	fecha, err := time.ParseInLocation(time.DateOnly, req.Fecha, time.Local)
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
	// 1) Sesión activa de este instructor para la ficha → usarla solo si es de hoy (hora local)
	activa, _ := s.repo.FindActivaByInstructorFichaID(ifc.ID)
	if activa != nil && esSesionDeHoy(activa.Fecha) {
		return s.asistenciaToResponse(activa), nil
	}
	// 2) Sesión activa de la ficha (creada por otro instructor) → permitir acceder solo si es de hoy
	activaFicha, _ := s.repo.FindActivaByFichaID(ifc.FichaID)
	if activaFicha != nil && esSesionDeHoy(activaFicha.Fecha) {
		return s.asistenciaToResponse(activaFicha), nil
	}
	// 3) No hay sesión activa de hoy → crear una nueva
	hoy := time.Now().Format(time.DateOnly)
	return s.CreateSesion(dto.AsistenciaRequest{
		InstructorFichaID: ifc.ID,
		Fecha:             hoy,
	})
}

func (s *asistenciaService) GetByID(id uint) (*dto.AsistenciaResponse, error) {
	a, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New(errMsgSesionAsistenciaNoEncontrada)
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
		return nil, errors.New(errMsgSesionYaFinalizada)
	}
	// Marcar registros con ingreso y sin salida como "REGISTRO_POR_CORREGIR",
	// para que el instructor pueda revisar si fue olvido de salida o abandono de jornada.
	for i := range a.AsistenciaAprendices {
		aa := &a.AsistenciaAprendices[i]
		if aa.HoraIngreso != nil && aa.HoraSalida == nil && aa.Estado == "" && !aa.RequiereRevision {
			aa.Estado = "REGISTRO_POR_CORREGIR"
			aa.RequiereRevision = true
			aa.MotivoAjuste = "Entrada registrada sin salida al finalizar la sesión"
			// No se asigna hora de salida: deberá decidirse en la revisión.
			_ = s.repoAA.Update(aa)
		}
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

// FinalizarSesionesVencidas finaliza sesiones no cerradas cuyo horario de jornada (hora_fin + extensión) ya pasó.
// Se ejecuta de forma periódica (p. ej. cada 5 min). La finalización es automática; los instructores no pueden finalizar manualmente.
func (s *asistenciaService) FinalizarSesionesVencidas() {
	now := time.Now()
	fechaDesde := now.AddDate(0, 0, -1).Format(time.DateOnly)
	list, err := s.repo.FindSesionesNoFinalizadasDesde(fechaDesde)
	if err != nil || len(list) == 0 {
		return
	}
	for i := range list {
		a := &list[i]
		if a.InstructorFicha == nil || a.InstructorFicha.Ficha == nil {
			continue
		}
		j := a.InstructorFicha.Ficha.Jornada
		// Usar el día de la sesión en hora local (evita que UTC midnight se interprete como día anterior en -05).
		localFecha := a.Fecha.In(now.Location())
		sessionDate := time.Date(localFecha.Year(), localFecha.Month(), localFecha.Day(), 0, 0, 0, 0, now.Location())
		var endEffective time.Time
		if j != nil {
			endEffective = HoraFinEfectiva(j, sessionDate)
		} else {
			endEffective = sessionDate.Add(24 * time.Hour)
		}
		if now.After(endEffective) {
			_, _ = s.Finalizar(a.ID)
		}
	}
}

func (s *asistenciaService) RegistrarIngreso(req dto.AsistenciaAprendizRequest, instructorFichaIDRegistroIngreso *uint) (*dto.AsistenciaAprendizResponse, error) {
	asist, err := s.repo.FindByID(req.AsistenciaID)
	if err != nil {
		return nil, errors.New(errMsgSesionAsistenciaNoEncontrada)
	}
	if asist.IsFinished {
		return nil, errors.New(errMsgSesionYaFinalizada)
	}
	// Regla: no puede haber más de un tramo abierto (ingreso sin salida) por aprendiz en la ficha hoy.
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
		hoy := time.Now().Format(time.DateOnly)
		sessionIDs, _ := s.repo.FindIDsByFichaIDAndFecha(fichaID, hoy)
		if len(sessionIDs) > 0 {
			sinSalida, _ := s.repoAA.FindEntryWithoutExitByAprendizIDAndAsistenciaIDs(req.AprendizID, sessionIDs)
			if sinSalida != nil && sinSalida.AsistenciaID != req.AsistenciaID {
				return nil, errors.New("el aprendiz ya tiene un ingreso sin salida registrado hoy en esta ficha")
			}
		}
	}
	// Múltiples tramos: solo permitir nuevo ingreso si no hay tramo abierto en esta sesión.
	open, _ := s.repoAA.FindOpenByAsistenciaIDAndAprendizID(req.AsistenciaID, req.AprendizID)
	if open != nil {
		return nil, errors.New("debe registrar primero la salida del tramo actual antes de registrar otra entrada")
	}
	now := time.Now()
	aa := models.AsistenciaAprendiz{
		AsistenciaID:                     req.AsistenciaID,
		InstructorFichaID:                &asist.InstructorFichaID,
		InstructorFichaIDRegistroIngreso: instructorFichaIDRegistroIngreso,
		AprendizFichaID:                  req.AprendizID,
		HoraIngreso:                      &now,
	}
	if err := s.repoAA.Create(&aa); err != nil {
		return nil, fmt.Errorf("error al registrar ingreso: %w", err)
	}
	return s.GetAsistenciaAprendizByID(aa.ID)
}

func (s *asistenciaService) RegistrarIngresoPorDocumento(req dto.AsistenciaIngresoPorDocumentoRequest, instructorFichaIDRegistroIngreso *uint) (*dto.AsistenciaAprendizResponse, error) {
	asist, err := s.repo.FindByID(req.AsistenciaID)
	if err != nil {
		return nil, errors.New(errMsgSesionAsistenciaNoEncontrada)
	}
	if asist.IsFinished {
		return nil, errors.New(errMsgSesionYaFinalizada)
	}
	ifc, err := s.instFichaRepo.FindByID(asist.InstructorFichaID)
	if err != nil || ifc == nil {
		return nil, errors.New("no se pudo obtener la ficha de la sesión")
	}
	persona, err := s.personaRepo.FindByNumeroDocumento(req.NumeroDocumento)
	if err != nil || persona == nil {
		return nil, errors.New("no se encontró ninguna persona con ese número de documento")
	}
	aprendiz, err := s.aprendizRepo.FindByPersonaIDAndFichaID(persona.ID, ifc.FichaID)
	if err != nil || aprendiz == nil {
		return nil, errors.New("el documento no corresponde a un aprendiz de esta ficha")
	}
	hoy := time.Now().Format(time.DateOnly)
	sessionIDs, _ := s.repo.FindIDsByFichaIDAndFecha(ifc.FichaID, hoy)
	// Si ya tiene un tramo abierto (entrada sin salida) hoy en esta ficha → registrar salida de ese tramo.
	if len(sessionIDs) > 0 {
		sinSalida, _ := s.repoAA.FindEntryWithoutExitByAprendizIDAndAsistenciaIDs(aprendiz.ID, sessionIDs)
		if sinSalida != nil {
			resp, err := s.RegistrarSalida(sinSalida.ID, instructorFichaIDRegistroIngreso)
			if err != nil {
				return nil, err
			}
			resp.TipoRegistro = "salida"
			resp.Mensaje = "Salida registrada"
			return resp, nil
		}
	}
	// Sin tramo abierto → registrar nuevo ingreso (puede ser el primero o un tramo adicional).
	resp, err := s.RegistrarIngreso(dto.AsistenciaAprendizRequest{
		AsistenciaID: req.AsistenciaID,
		AprendizID:   aprendiz.ID,
	}, instructorFichaIDRegistroIngreso)
	if err != nil {
		return nil, err
	}
	resp.TipoRegistro = "ingreso"
	resp.Mensaje = "Ingreso registrado"
	return resp, nil
}

func (s *asistenciaService) RegistrarSalida(asistenciaAprendizID uint, instructorFichaIDRegistroSalida *uint) (*dto.AsistenciaAprendizResponse, error) {
	aa, err := s.repoAA.FindByID(asistenciaAprendizID)
	if err != nil {
		return nil, errors.New(errMsgRegistroAsistenciaNoEncontrado)
	}
	if aa.HoraIngreso == nil {
		return nil, errors.New("el aprendiz no tiene hora de ingreso")
	}
	if aa.HoraSalida != nil {
		return nil, errors.New("ya tiene hora de salida registrada")
	}
	now := time.Now()
	aa.HoraSalida = &now
	aa.InstructorFichaIDRegistroSalida = instructorFichaIDRegistroSalida
	// Salida normal registrada en la sesión → asistencia completa (sin requerir revisión)
	aa.Estado = "ASISTENCIA_COMPLETA"
	aa.RequiereRevision = false
	if err := s.repoAA.Update(aa); err != nil {
		return nil, err
	}
	return s.aaToResponse(aa), nil
}

func (s *asistenciaService) ActualizarObservaciones(asistenciaAprendizID uint, observaciones string) (*dto.AsistenciaAprendizResponse, error) {
	aa, err := s.repoAA.FindByID(asistenciaAprendizID)
	if err != nil {
		return nil, errors.New(errMsgRegistroAsistenciaNoEncontrado)
	}
	aa.Observaciones = observaciones
	if err := s.repoAA.Update(aa); err != nil {
		return nil, err
	}
	return s.aaToResponse(aa), nil
}

func (s *asistenciaService) CrearOActualizarObservaciones(asistenciaID, aprendizID uint, observaciones string, tipoObservacionIDs []uint) (*dto.AsistenciaAprendizResponse, error) {
	asist, err := s.repo.FindByID(asistenciaID)
	if err != nil || asist == nil {
		return nil, errors.New(errMsgSesionAsistenciaNoEncontrada)
	}
	if asist.IsFinished {
		return nil, errors.New(errMsgSesionYaFinalizada)
	}
	// Con múltiples tramos: actualizar observaciones en el tramo abierto o en el último registro.
	aa, _ := s.repoAA.FindOpenByAsistenciaIDAndAprendizID(asistenciaID, aprendizID)
	if aa == nil {
		aa, _ = s.repoAA.FindLastByAsistenciaIDAndAprendizID(asistenciaID, aprendizID)
	}
	if aa != nil {
		aa.Observaciones = observaciones
		if err := s.repoAA.Update(aa); err != nil {
			return nil, err
		}
		// Actualizar tipos de observación predefinidos (reemplazar lista)
		if len(tipoObservacionIDs) > 0 {
			tipos, _ := s.tipoObsRepo.FindByIDs(tipoObservacionIDs)
			_ = s.repoAA.ReplaceTiposObservacion(aa, tipos)
		} else {
			_ = s.repoAA.ReplaceTiposObservacion(aa, nil)
		}
		// Recargar para devolver TiposObservacion en la respuesta
		aa, _ = s.repoAA.FindByID(aa.ID)
		return s.aaToResponse(aa), nil
	}
	aa = &models.AsistenciaAprendiz{
		AsistenciaID:      asistenciaID,
		InstructorFichaID: &asist.InstructorFichaID,
		AprendizFichaID:   aprendizID,
		Observaciones:     observaciones,
	}
	if err := s.repoAA.Create(aa); err != nil {
		return nil, fmt.Errorf("error al guardar observaciones: %w", err)
	}
	if len(tipoObservacionIDs) > 0 {
		tipos, _ := s.tipoObsRepo.FindByIDs(tipoObservacionIDs)
		_ = s.repoAA.ReplaceTiposObservacion(aa, tipos)
	}
	return s.GetAsistenciaAprendizByID(aa.ID)
}

func (s *asistenciaService) ListTiposObservacionAsistencia() ([]dto.TipoObservacionAsistenciaItem, error) {
	list, err := s.tipoObsRepo.ListActivos()
	if err != nil {
		return nil, err
	}
	out := make([]dto.TipoObservacionAsistenciaItem, len(list))
	for i := range list {
		out[i] = dto.TipoObservacionAsistenciaItem{ID: list[i].ID, Codigo: list[i].Codigo, Nombre: list[i].Nombre}
	}
	return out, nil
}

func (s *asistenciaService) CrearTipoObservacionAsistencia(req dto.TipoObservacionAsistenciaCreateRequest) (*dto.TipoObservacionAsistenciaItem, error) {
	codigo := strings.TrimSpace(req.Codigo)
	nombre := strings.TrimSpace(req.Nombre)
	if codigo == "" {
		return nil, errors.New("el código es obligatorio")
	}
	if nombre == "" {
		return nil, errors.New("el nombre es obligatorio")
	}
	activo := true
	if req.Activo != nil {
		activo = *req.Activo
	}
	item := &models.TipoObservacionAsistencia{
		Codigo: strings.ToUpper(codigo),
		Nombre: nombre,
		Activo: activo,
	}
	if err := s.tipoObsRepo.Create(item); err != nil {
		return nil, err
	}
	return &dto.TipoObservacionAsistenciaItem{
		ID: item.ID, Codigo: item.Codigo, Nombre: item.Nombre,
	}, nil
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
	pendientes, _ := s.repo.CountPendientesRevisionByFecha(sedeID, fecha)
	sinSesion, errSin := s.repo.GetFichasSinSesionHoy(sedeID, fecha)
	if errSin != nil {
		return nil, errSin
	}
	var totalFichas int64
	if n, errC := s.fichaRepo.CountAll(sedeID); errC == nil {
		totalFichas = n
	}
	resp := &dto.AsistenciaDashboardResponse{
		Fecha:                      fecha,
		TotalAprendicesEnFormacion: total,
		PendientesRevision:         pendientes,
		PorFicha:                   make([]dto.AsistenciaDashboardPorFicha, len(porFicha)),
		FichasSinAsistenciaHoy:     make([]dto.AsistenciaDashboardFichaSinSesion, len(sinSesion)),
		TotalFichasRegistradas:     int(totalFichas),
		FichasConSesionHoy:         len(porFicha),
	}
	for i := range porFicha {
		resp.PorFicha[i] = dto.AsistenciaDashboardPorFicha{
			FichaID:          porFicha[i].FichaID,
			FichaNumero:      porFicha[i].FichaNumero,
			ProgramaNombre:   porFicha[i].ProgramaNombre,
			JornadaNombre:    porFicha[i].JornadaNombre,
			SedeNombre:       porFicha[i].SedeNombre,
			CantidadVinieron: porFicha[i].Cantidad,
			TotalAprendices:  porFicha[i].TotalAprendices,
		}
	}
	for i := range sinSesion {
		resp.FichasSinAsistenciaHoy[i] = dto.AsistenciaDashboardFichaSinSesion{
			FichaID:         sinSesion[i].FichaID,
			FichaNumero:     sinSesion[i].FichaNumero,
			ProgramaNombre:  sinSesion[i].ProgramaNombre,
			JornadaNombre:   sinSesion[i].JornadaNombre,
			SedeNombre:      sinSesion[i].SedeNombre,
			TotalAprendices: sinSesion[i].TotalAprendices,
		}
	}
	return resp, nil
}

func (s *asistenciaService) GetCasosBienestar(sedeID *uint, dias, minFallas int) (*dto.CasosBienestarResponse, error) {
	if dias <= 0 {
		dias = 30
	}
	if minFallas <= 0 {
		minFallas = 1
	}
	fechaFin := time.Now()
	fechaInicio := fechaFin.AddDate(0, 0, -dias)
	fechaInicioStr := fechaInicio.Format(time.DateOnly)
	fechaFinStr := fechaFin.Format(time.DateOnly)

	rows, err := s.repo.GetCasosBienestar(sedeID, fechaInicioStr, fechaFinStr, minFallas)
	if err != nil {
		return nil, err
	}
	resp := &dto.CasosBienestarResponse{
		DiasAnalizados: dias,
		MinFallas:      minFallas,
		Casos:          make([]dto.CasoBienestarItem, len(rows)),
	}
	for i := range rows {
		resp.Casos[i] = dto.CasoBienestarItem{
			AprendizID:           rows[i].AprendizID,
			PersonaNombre:        rows[i].PersonaNombre,
			NumeroDocumento:      rows[i].NumeroDocumento,
			FichaNumero:          rows[i].FichaNumero,
			ProgramaNombre:       rows[i].ProgramaNombre,
			SedeNombre:           rows[i].SedeNombre,
			TotalSesiones:        rows[i].TotalSesiones,
			AsistenciasEfectivas: rows[i].AsistenciasEfectivas,
			Inasistencias:        rows[i].Inasistencias,
		}
	}
	// Resumen por instructor: cantidad de aprendices con registros pendientes de revisión (sin salida, REGISTRO_POR_CORREGIR) en el mismo rango.
	if instrRows, errInstr := s.repo.GetPendientesRevisionPorInstructor(sedeID, fechaInicioStr, fechaFinStr); errInstr == nil && len(instrRows) > 0 {
		resp.Instructores = make([]dto.InstructorPendienteItem, len(instrRows))
		for i := range instrRows {
			resp.Instructores[i] = dto.InstructorPendienteItem{
				InstructorID:                instrRows[i].InstructorID,
				InstructorNombre:            instrRows[i].InstructorNombre,
				NumeroDocumento:             instrRows[i].NumeroDocumento,
				CantidadAprendicesSinSalida: instrRows[i].CantidadAprendicesSinSalida,
			}
		}
	}
	return resp, nil
}

func (s *asistenciaService) GetDetalleInasistenciasAprendiz(fichaNumero string, aprendizID uint, dias int, sedeNombre string) (*dto.CasoBienestarAprendizDetalleResponse, error) {
	if strings.TrimSpace(fichaNumero) == "" || aprendizID == 0 {
		return nil, errors.New("ficha y aprendiz son requeridos")
	}
	if dias <= 0 {
		dias = 30
	}
	fechaFin := time.Now()
	fechaInicio := fechaFin.AddDate(0, 0, -dias)
	fechaInicioStr := fechaInicio.Format(time.DateOnly)
	fechaFinStr := fechaFin.Format(time.DateOnly)

	rows, err := s.repo.GetDetalleInasistenciasAprendiz(fichaNumero, aprendizID, fechaInicioStr, fechaFinStr, sedeNombre)
	if err != nil {
		return nil, err
	}
	resp := &dto.CasoBienestarAprendizDetalleResponse{
		FichaNumero:   fichaNumero,
		AprendizID:    aprendizID,
		FechaInicio:   fechaInicioStr,
		FechaFin:      fechaFinStr,
		Inasistencias: make([]dto.InasistenciaDetalleItem, len(rows)),
	}
	for i := range rows {
		resp.Inasistencias[i] = dto.InasistenciaDetalleItem{
			Fecha:         rows[i].Fecha,
			Observaciones: rows[i].Observaciones,
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
		ID:                 a.ID,
		InstructorFichaID:  a.InstructorFichaID,
		Fecha:              a.Fecha,
		HoraInicio:         a.HoraInicio,
		HoraFin:            a.HoraFin,
		IsFinished:         a.IsFinished,
		Observaciones:      a.Observaciones,
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
		ID:                               aa.ID,
		AsistenciaID:                     aa.AsistenciaID,
		AprendizID:                       aa.AprendizFichaID,
		HoraIngreso:                      aa.HoraIngreso,
		HoraSalida:                       aa.HoraSalida,
		Observaciones:                    aa.Observaciones,
		Estado:                           aa.Estado,
		RequiereRevision:                 aa.RequiereRevision,
		MotivoAjuste:                     aa.MotivoAjuste,
		InstructorFichaIDRegistroIngreso: aa.InstructorFichaIDRegistroIngreso,
		InstructorFichaIDRegistroSalida:  aa.InstructorFichaIDRegistroSalida,
	}
	if len(aa.TiposObservacion) > 0 {
		r.TiposObservacion = make([]dto.TipoObservacionAsistenciaItem, len(aa.TiposObservacion))
		for i := range aa.TiposObservacion {
			r.TiposObservacion[i] = dto.TipoObservacionAsistenciaItem{ID: aa.TiposObservacion[i].ID, Codigo: aa.TiposObservacion[i].Codigo, Nombre: aa.TiposObservacion[i].Nombre}
		}
	}
	if aa.Asistencia != nil && aa.Asistencia.InstructorFicha != nil && aa.Asistencia.InstructorFicha.Ficha != nil {
		r.FichaID = aa.Asistencia.InstructorFicha.FichaID
		r.FichaNumero = aa.Asistencia.InstructorFicha.Ficha.Ficha
	}
	if aa.Aprendiz != nil && aa.Aprendiz.Persona != nil {
		r.AprendizNombre = aa.Aprendiz.Persona.GetFullName()
		r.NumeroDocumento = aa.Aprendiz.Persona.NumeroDocumento
	}
	if aa.InstructorRegistroIngreso != nil && aa.InstructorRegistroIngreso.Instructor != nil && aa.InstructorRegistroIngreso.Instructor.Persona != nil {
		r.InstructorRegistroIngresoNombre = aa.InstructorRegistroIngreso.Instructor.Persona.GetFullName()
	}
	if aa.InstructorRegistroSalida != nil && aa.InstructorRegistroSalida.Instructor != nil && aa.InstructorRegistroSalida.Instructor.Persona != nil {
		r.InstructorRegistroSalidaNombre = aa.InstructorRegistroSalida.Instructor.Persona.GetFullName()
	}
	return r
}

// AjustarEstadoAprendiz permite clasificar un registro de asistencia de aprendiz
// como asistencia completa, parcial, abandono de jornada o dejarlo pendiente de revisión.
func (s *asistenciaService) AjustarEstadoAprendiz(asistenciaAprendizID uint, estado, motivo string, instructorFichaIDRegistroSalida *uint) (*dto.AsistenciaAprendizResponse, error) {
	aa, err := s.repoAA.FindByID(asistenciaAprendizID)
	if err != nil {
		return nil, errors.New(errMsgRegistroAsistenciaNoEncontrado)
	}
	if aa.HoraIngreso == nil {
		return nil, errors.New("no se puede ajustar estado sin hora de ingreso")
	}
	normalized := strings.ToUpper(strings.TrimSpace(estado))
	switch normalized {
	case "ASISTENCIA_COMPLETA", "ASISTENCIA_PARCIAL", "ABANDONO_JORNADA", "REGISTRO_POR_CORREGIR":
	default:
		return nil, errors.New("estado de asistencia inválido")
	}
	aa.Estado = normalized
	aa.MotivoAjuste = motivo
	aa.RequiereRevision = normalized == "REGISTRO_POR_CORREGIR"

	// Si el nuevo estado no es "por corregir" y aún no tiene salida,
	// se asigna una hora de salida razonable (fin de sesión si existe, o ahora).
	if normalized != "REGISTRO_POR_CORREGIR" && aa.HoraSalida == nil {
		now := time.Now()
		if aa.Asistencia != nil && aa.Asistencia.HoraFin != nil {
			aa.HoraSalida = aa.Asistencia.HoraFin
		} else {
			aa.HoraSalida = &now
		}
		aa.InstructorFichaIDRegistroSalida = instructorFichaIDRegistroSalida
	}
	if err := s.repoAA.Update(aa); err != nil {
		return nil, err
	}
	return s.aaToResponse(aa), nil
}

// ListPendientesRevision devuelve los registros de asistencia de aprendices
// marcados como requiere_revision para el instructor y fecha dados.
func (s *asistenciaService) ListPendientesRevision(instructorID uint, fecha string) ([]dto.AsistenciaAprendizResponse, error) {
	list, err := s.repoAA.FindPendientesRevisionByInstructorAndFecha(instructorID, fecha)
	if err != nil {
		return nil, err
	}
	resp := make([]dto.AsistenciaAprendizResponse, len(list))
	for i := range list {
		resp[i] = *s.aaToResponse(&list[i])
	}
	return resp, nil
}
