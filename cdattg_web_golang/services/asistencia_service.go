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
	errMsgObservacionFueraDePlazo        = "LA OBSERVACIÓN SOLO SE PUEDE EDITAR HASTA 5 DÍAS DESPUÉS DE CERRAR LA SESIÓN"
	errMsgRegistroAsistenciaNoEncontrado = "REGISTRO DE ASISTENCIA NO ENCONTRADO"
	errMsgIDInvalido                     = "id inválido"
	errMsgFechaInvalida                  = "FECHA INVÁLIDA, USE YYYY-MM-DD"
	errMsgYaExisteSesionActiva           = "YA EXISTE UNA SESIÓN DE ASISTENCIA ACTIVA PARA ESTA FICHA. FINALÍCELA ANTES DE CREAR OTRA"
	errMsgNoEstaCreadoComoInstructor     = "NO ESTÁ CREADO COMO INSTRUCTOR DE ESTA FICHA"
	errMsgFueraDelHorarioJornada         = "FUERA DEL HORARIO DE LA JORNADA DE LA FICHA; SOLO SE PUEDE TOMAR ASISTENCIA EN EL HORARIO CONFIGURADO"
	errMsgSesionOtroInstructor           = "NO PUEDE TOMAR ASISTENCIA EN LA SESIÓN DE OTRO INSTRUCTOR"
	errMsgAprendizOcultoEnAsistencia     = "EL APRENDIZ ESTÁ OCULTO DE LA TOMA DE ASISTENCIA EN ESTA FICHA"
)

const plazoEdicionObservacionSesionDias = 5

const (
	minSegundosEntreIngresoYSalida = 60
	msgIngresoYaRegistrado   = "Entrada ya registrada para este aprendiz en esta sesión. No se guardó de nuevo para evitar un registro duplicado."
	errMsgEsperaMinutoSalida = "debe esperar al menos 1 minuto entre la entrada y la salida"
)

func mensajeSalidaQRDemasiadoPronto(segundosRestantes int) string {
	if segundosRestantes > 0 {
		return fmt.Sprintf(
			"Entrada ya registrada. Para marcar salida con el mismo QR debe esperar %d segundos más (mínimo 1 minuto desde la entrada).",
			segundosRestantes,
		)
	}
	return "Entrada ya registrada. Ya puede escanear de nuevo para marcar la salida."
}

type AsistenciaService interface {
	CreateSesion(req dto.AsistenciaRequest) (*dto.AsistenciaResponse, error)
	EntrarTomarAsistencia(instructorID uint, fichaID uint) (*dto.AsistenciaResponse, error)
	GetByID(id uint) (*dto.AsistenciaResponse, error)
	ActualizarObservacionesSesion(asistenciaID uint, observaciones string, instructorFichaIDEditor *uint) (*dto.AsistenciaResponse, error)
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
	ActualizarTipoObservacionAsistencia(id uint, req dto.TipoObservacionAsistenciaUpdateRequest) (*dto.TipoObservacionAsistenciaItem, error)
	EliminarTipoObservacionAsistencia(id uint) error
	EliminarRegistroAprendiz(asistenciaAprendizID uint) error
	GetDashboard(sedeID *uint, fecha string) (*dto.AsistenciaDashboardResponse, error)
	GetCasosBienestar(sedeID *uint, dias, minFallas int) (*dto.CasosBienestarResponse, error)
	GetDetalleInasistenciasAprendiz(fichaNumero string, aprendizID uint, dias int, sedeNombre string) (*dto.CasoBienestarAprendizDetalleResponse, error)
	GetMisInasistencias(personaID uint, dias int) (*dto.MisInasistenciasResponse, error)
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
	horarioSvc    *InstructorHorarioService
}

// esSesionDeHoy indica si la fecha de la sesión (interpretada en hora local) es el día de hoy.
func esSesionDeHoy(fecha time.Time) bool {
	now := time.Now()
	loc := now.Location()
	local := fecha.In(loc)
	return local.Year() == now.Year() && local.Month() == now.Month() && local.Day() == now.Day()
}

func sesionCerradaDentroDePlazoEdicion(fechaSesion time.Time, ahora time.Time, diasMax int) bool {
	if diasMax < 0 {
		return false
	}
	loc := ahora.Location()
	inicioSesion := time.Date(
		fechaSesion.In(loc).Year(),
		fechaSesion.In(loc).Month(),
		fechaSesion.In(loc).Day(),
		0, 0, 0, 0, loc,
	)
	inicioHoy := time.Date(ahora.Year(), ahora.Month(), ahora.Day(), 0, 0, 0, 0, loc)
	diffDias := int(inicioHoy.Sub(inicioSesion).Hours() / 24)
	return diffDias >= 0 && diffDias <= diasMax
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
		horarioSvc:    NewInstructorHorarioService(),
	}
}

func (s *asistenciaService) assertSesionPropia(asist *models.Asistencia, instructorFichaID *uint) error {
	if instructorFichaID == nil {
		return errors.New(errMsgNoEstaCreadoComoInstructor)
	}
	if asist.InstructorFichaID != *instructorFichaID {
		return errors.New(strings.ToLower(errMsgSesionOtroInstructor))
	}
	return nil
}

func codigoFichaParaSesion(ifc *models.InstructorFichaCaracterizacion) string {
	if ifc.Ficha != nil && ifc.Ficha.Ficha != "" {
		return ifc.Ficha.Ficha
	}
	return "ficha"
}

func fichaIDDesdeAsistencia(asist *models.Asistencia, instFichaRepo repositories.InstructorFichaRepository) uint {
	if asist.InstructorFicha != nil {
		return asist.InstructorFicha.FichaID
	}
	ifc, _ := instFichaRepo.FindByID(asist.InstructorFichaID)
	if ifc != nil {
		return ifc.FichaID
	}
	return 0
}

func (s *asistenciaService) validarAprendizPuedeTomarAsistencia(aprendizID uint) error {
	a, err := s.aprendizRepo.FindByID(aprendizID)
	if err != nil || a == nil {
		return errors.New("aprendiz no encontrado")
	}
	if !a.Estado {
		return errors.New("el aprendiz no está asignado a la ficha")
	}
	if a.OcultoEnAsistencia {
		return errors.New(errMsgAprendizOcultoEnAsistencia)
	}
	return nil
}

func (s *asistenciaService) validarAprendizSinIngresoAbiertoEnFichaHoy(
	fichaID, aprendizID, asistenciaIDActual uint,
) error {
	if fichaID == 0 {
		return nil
	}
	hoy := time.Now().Format(time.DateOnly)
	sessionIDs, _ := s.repo.FindIDsByFichaIDAndFecha(fichaID, hoy)
	if len(sessionIDs) == 0 {
		return nil
	}
	sinSalida, _ := s.repoAA.FindEntryWithoutExitByAprendizIDAndAsistenciaIDs(aprendizID, sessionIDs)
	if sinSalida != nil && sinSalida.AsistenciaID != asistenciaIDActual {
		return errors.New("el aprendiz ya tiene un ingreso sin salida registrado hoy en esta ficha")
	}
	return nil
}

func (s *asistenciaService) assertSesionPropiaDesdeAprendiz(
	aa *models.AsistenciaAprendiz,
	instructorFichaID *uint,
) error {
	if aa.Asistencia != nil {
		return s.assertSesionPropia(aa.Asistencia, instructorFichaID)
	}
	if aa.AsistenciaID == 0 {
		return nil
	}
	asist, err := s.repo.FindByID(aa.AsistenciaID)
	if err != nil || asist == nil {
		return nil
	}
	return s.assertSesionPropia(asist, instructorFichaID)
}

func (s *asistenciaService) CreateSesion(req dto.AsistenciaRequest) (*dto.AsistenciaResponse, error) {
	// Parsear como medianoche en hora local para que el día de la sesión sea correcto en cualquier zona horaria.
	fecha, err := time.ParseInLocation(time.DateOnly, req.Fecha, time.Local)
	if err != nil {
		return nil, errors.New("fecha inválida, use YYYY-MM-DD")
	}
	ifc, errIFC := s.instFichaRepo.FindByID(req.InstructorFichaID)
	if errIFC != nil || ifc == nil {
		return nil, errors.New(errMsgNoEstaCreadoComoInstructor)
	}
	if errVal := s.horarioSvc.ValidarPuedeTomarAsistencia(ifc.InstructorID, ifc.FichaID, fecha); errVal != nil {
		return nil, errVal
	}
	if !s.horarioSvc.calendarioSvc.EsSesionFormacionValida(ifc.FichaID, ifc.InstructorID, fecha) {
		return nil, errors.New("la fecha no corresponde a un día de formación programado para este instructor en la ficha")
	}
	// Regla: solo una sesión activa por instructor-ficha
	activa, _ := s.repo.FindActivaByInstructorFichaID(req.InstructorFichaID)
	if activa != nil {
		return nil, errors.New("ya existe una sesión de asistencia activa para este instructor en la ficha. Finalícela antes de crear otra")
	}
	// Crear evidencia por defecto para la sesión
	fichaNum := codigoFichaParaSesion(ifc)
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

// EntrarTomarAsistencia devuelve la sesión activa del instructor o crea una nueva (hoy).
func (s *asistenciaService) EntrarTomarAsistencia(instructorID uint, fichaID uint) (*dto.AsistenciaResponse, error) {
	ifc, err := s.instFichaRepo.FindByFichaIDAndInstructorID(fichaID, instructorID)
	if err != nil || ifc == nil {
		return nil, errors.New("no está asignado como instructor de esta ficha")
	}
	if errVal := s.horarioSvc.ValidarPuedeTomarAsistencia(instructorID, fichaID, time.Now()); errVal != nil {
		return nil, errVal
	}
	// Sesión activa de este instructor → usarla solo si es de hoy (hora local)
	activa, _ := s.repo.FindActivaByInstructorFichaID(ifc.ID)
	if activa != nil && esSesionDeHoy(activa.Fecha) {
		return s.asistenciaToResponse(activa), nil
	}
	// No hay sesión activa de hoy → crear una nueva
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

func (s *asistenciaService) ActualizarObservacionesSesion(asistenciaID uint, observaciones string, instructorFichaIDEditor *uint) (*dto.AsistenciaResponse, error) {
	a, err := s.repo.FindByID(asistenciaID)
	if err != nil || a == nil {
		return nil, errors.New(errMsgSesionAsistenciaNoEncontrada)
	}
	if instructorFichaIDEditor == nil {
		return nil, errors.New(errMsgNoEstaCreadoComoInstructor)
	}
	if a.InstructorFicha == nil {
		ifc, errIFC := s.instFichaRepo.FindByID(a.InstructorFichaID)
		if errIFC != nil || ifc == nil {
			return nil, errors.New("no se pudo validar instructor de la sesión")
		}
		a.InstructorFicha = ifc
	}
	if a.InstructorFicha != nil && *instructorFichaIDEditor != a.InstructorFichaID {
		return nil, errors.New(strings.ToLower(errMsgSesionOtroInstructor))
	}
	a.Observaciones = strings.TrimSpace(observaciones)
	if err := s.repo.Update(a); err != nil {
		return nil, err
	}
	return s.GetByID(asistenciaID)
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
	// Cierre automático de salidas: registros con ingreso y sin salida
	// recibe salida al momento de finalizar la sesión.
	now := time.Now()
	for i := range a.AsistenciaAprendices {
		aa := &a.AsistenciaAprendices[i]
		if aa.HoraIngreso != nil && aa.HoraSalida == nil {
			aa.HoraSalida = &now
			aa.Estado = "ASISTENCIA_COMPLETA"
			aa.RequiereRevision = false
			aa.MotivoAjuste = "Salida automática al finalizar la sesión"
			_ = s.repoAA.Update(aa)
		}
	}
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
	if err := s.assertSesionPropia(asist, instructorFichaIDRegistroIngreso); err != nil {
		return nil, err
	}
	fichaID := fichaIDDesdeAsistencia(asist, s.instFichaRepo)
	if err := s.validarAprendizPuedeTomarAsistencia(req.AprendizID); err != nil {
		return nil, err
	}
	if err := s.validarAprendizSinIngresoAbiertoEnFichaHoy(fichaID, req.AprendizID, req.AsistenciaID); err != nil {
		return nil, err
	}
	// Tramo abierto en esta sesión: idempotencia (escaneos QR duplicados).
	open, _ := s.repoAA.FindOpenByAsistenciaIDAndAprendizID(req.AsistenciaID, req.AprendizID)
	if open != nil {
		return s.respuestaIngresoAbierto(open, msgIngresoYaRegistrado, 0)
	}
	now := time.Now()
	aa := models.AsistenciaAprendiz{
		AsistenciaID:                     req.AsistenciaID,
		InstructorFichaID:                &asist.InstructorFichaID,
		InstructorFichaIDRegistroIngreso: instructorFichaIDRegistroIngreso,
		AprendizFichaID:                  req.AprendizID,
		HoraIngreso:                      &now,
	}
	createdAA, created, err := s.repoAA.CreateIngresoIdempotente(&aa)
	if err != nil {
		return nil, fmt.Errorf("error al registrar ingreso: %w", err)
	}
	if !created {
		return s.respuestaIngresoAbierto(createdAA, msgIngresoYaRegistrado, 0)
	}
	return s.GetAsistenciaAprendizByID(createdAA.ID)
}

func (s *asistenciaService) sesionActivaPorID(asistenciaID uint) (*models.Asistencia, error) {
	asist, err := s.repo.FindByID(asistenciaID)
	if err != nil {
		return nil, errors.New(errMsgSesionAsistenciaNoEncontrada)
	}
	if asist.IsFinished {
		return nil, errors.New(errMsgSesionYaFinalizada)
	}
	return asist, nil
}

func (s *asistenciaService) aprendizPorDocumentoEnSesion(asist *models.Asistencia, numeroDocumento string) (aprendizID uint, fichaID uint, err error) {
	ifc, err := s.instFichaRepo.FindByID(asist.InstructorFichaID)
	if err != nil || ifc == nil {
		return 0, 0, errors.New("no se pudo obtener la ficha de la sesión")
	}
	persona, err := s.personaRepo.FindByNumeroDocumento(numeroDocumento)
	if err != nil || persona == nil {
		return 0, 0, errors.New("no se encontró ninguna persona con ese número de documento")
	}
	aprendiz, err := s.aprendizRepo.FindByPersonaIDAndFichaID(persona.ID, ifc.FichaID)
	if err != nil || aprendiz == nil {
		return 0, 0, errors.New("el documento no corresponde a un aprendiz de esta ficha")
	}
	if err := s.validarAprendizPuedeTomarAsistencia(aprendiz.ID); err != nil {
		return 0, 0, err
	}
	return aprendiz.ID, ifc.FichaID, nil
}

func (s *asistenciaService) tramoAbiertoAprendizEnFichaHoy(fichaID, aprendizID uint) *models.AsistenciaAprendiz {
	hoy := time.Now().Format(time.DateOnly)
	sessionIDs, _ := s.repo.FindIDsByFichaIDAndFecha(fichaID, hoy)
	if len(sessionIDs) == 0 {
		return nil
	}
	sinSalida, _ := s.repoAA.FindEntryWithoutExitByAprendizIDAndAsistenciaIDs(aprendizID, sessionIDs)
	return sinSalida
}

func segundosRestantesParaSalida(horaIngreso, ahora time.Time) int {
	faltan := time.Duration(minSegundosEntreIngresoYSalida)*time.Second - ahora.Sub(horaIngreso)
	if faltan <= 0 {
		return 0
	}
	return int((faltan + time.Second - 1) / time.Second)
}

func esErrorEsperaMinutoSalida(err error) bool {
	return err != nil && strings.Contains(strings.ToLower(err.Error()), errMsgEsperaMinutoSalida)
}

func (s *asistenciaService) respuestaIngresoAbierto(
	aa *models.AsistenciaAprendiz,
	mensaje string,
	segundosRestantes int,
) (*dto.AsistenciaAprendizResponse, error) {
	if aa == nil || aa.ID == 0 {
		return nil, errors.New(errMsgRegistroAsistenciaNoEncontrado)
	}
	resp, err := s.GetAsistenciaAprendizByID(aa.ID)
	if err != nil {
		return nil, err
	}
	resp.TipoRegistro = "ingreso"
	resp.Mensaje = mensaje
	if segundosRestantes > 0 {
		resp.SegundosRestantesSalida = segundosRestantes
	}
	return resp, nil
}

func (s *asistenciaService) registrarSalidaPorDocumento(sinSalida *models.AsistenciaAprendiz, instructorFichaID *uint) (*dto.AsistenciaAprendizResponse, error) {
	if sinSalida == nil {
		return nil, errors.New("el aprendiz no tiene entrada registrada para marcar salida")
	}
	resp, err := s.RegistrarSalida(sinSalida.ID, instructorFichaID)
	if err != nil {
		if esErrorEsperaMinutoSalida(err) && sinSalida.HoraIngreso != nil {
			rest := segundosRestantesParaSalida(*sinSalida.HoraIngreso, time.Now())
			return s.respuestaIngresoAbierto(sinSalida, mensajeSalidaQRDemasiadoPronto(rest), rest)
		}
		return nil, err
	}
	resp.TipoRegistro = "salida"
	resp.Mensaje = "Salida registrada"
	return resp, nil
}

func (s *asistenciaService) registrarIngresoPorDocumentoAccion(
	asistenciaID, aprendizID uint,
	sinSalida *models.AsistenciaAprendiz,
	instructorFichaID *uint,
) (*dto.AsistenciaAprendizResponse, error) {
	if sinSalida != nil {
		return nil, errors.New("el aprendiz ya tiene entrada sin salida; registre la salida antes de una nueva entrada")
	}
	resp, err := s.RegistrarIngreso(dto.AsistenciaAprendizRequest{
		AsistenciaID: asistenciaID,
		AprendizID:   aprendizID,
	}, instructorFichaID)
	if err != nil {
		return nil, err
	}
	resp.TipoRegistro = "ingreso"
	resp.Mensaje = "Ingreso registrado"
	return resp, nil
}

func (s *asistenciaService) RegistrarIngresoPorDocumento(req dto.AsistenciaIngresoPorDocumentoRequest, instructorFichaIDRegistroIngreso *uint) (*dto.AsistenciaAprendizResponse, error) {
	asist, err := s.sesionActivaPorID(req.AsistenciaID)
	if err != nil {
		return nil, err
	}
	aprendizID, fichaID, err := s.aprendizPorDocumentoEnSesion(asist, req.NumeroDocumento)
	if err != nil {
		return nil, err
	}
	if sinSalida := s.tramoAbiertoAprendizEnFichaHoy(fichaID, aprendizID); sinSalida != nil {
		if sinSalida.HoraIngreso != nil && time.Since(*sinSalida.HoraIngreso) < minSegundosEntreIngresoYSalida*time.Second {
			rest := segundosRestantesParaSalida(*sinSalida.HoraIngreso, time.Now())
			return s.respuestaIngresoAbierto(sinSalida, mensajeSalidaQRDemasiadoPronto(rest), rest)
		}
		return s.registrarSalidaPorDocumento(sinSalida, instructorFichaIDRegistroIngreso)
	}
	return s.registrarIngresoPorDocumentoAccion(req.AsistenciaID, aprendizID, nil, instructorFichaIDRegistroIngreso)
}

func (s *asistenciaService) RegistrarSalida(asistenciaAprendizID uint, instructorFichaIDRegistroSalida *uint) (*dto.AsistenciaAprendizResponse, error) {
	aa, err := s.repoAA.FindByID(asistenciaAprendizID)
	if err != nil {
		return nil, errors.New(errMsgRegistroAsistenciaNoEncontrado)
	}
	if err := s.assertSesionPropiaDesdeAprendiz(aa, instructorFichaIDRegistroSalida); err != nil {
		return nil, err
	}
	if aa.HoraIngreso == nil {
		return nil, errors.New("el aprendiz no tiene hora de ingreso")
	}
	if aa.HoraSalida != nil {
		return nil, errors.New("ya tiene hora de salida registrada")
	}
	now := time.Now()
	if now.Sub(*aa.HoraIngreso) < minSegundosEntreIngresoYSalida*time.Second {
		return nil, errors.New(errMsgEsperaMinutoSalida)
	}
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
	if aa.Asistencia != nil && aa.Asistencia.IsFinished && !sesionCerradaDentroDePlazoEdicion(aa.Asistencia.Fecha, time.Now(), plazoEdicionObservacionSesionDias) {
		return nil, errors.New(errMsgObservacionFueraDePlazo)
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
	if asist.IsFinished && !sesionCerradaDentroDePlazoEdicion(asist.Fecha, time.Now(), plazoEdicionObservacionSesionDias) {
		return nil, errors.New(errMsgObservacionFueraDePlazo)
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

func (s *asistenciaService) ActualizarTipoObservacionAsistencia(id uint, req dto.TipoObservacionAsistenciaUpdateRequest) (*dto.TipoObservacionAsistenciaItem, error) {
	if id == 0 {
		return nil, errors.New(errMsgIDInvalido)
	}
	item, err := s.tipoObsRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	codigo := strings.TrimSpace(req.Codigo)
	nombre := strings.TrimSpace(req.Nombre)
	if codigo == "" {
		return nil, errors.New("el código es obligatorio")
	}
	if nombre == "" {
		return nil, errors.New("el nombre es obligatorio")
	}
	item.Codigo = strings.ToUpper(codigo)
	item.Nombre = nombre
	if req.Activo != nil {
		item.Activo = *req.Activo
	}
	if err := s.tipoObsRepo.Update(item); err != nil {
		return nil, err
	}
	return &dto.TipoObservacionAsistenciaItem{
		ID: item.ID, Codigo: item.Codigo, Nombre: item.Nombre,
	}, nil
}

func (s *asistenciaService) EliminarTipoObservacionAsistencia(id uint) error {
	if id == 0 {
		return errors.New(errMsgIDInvalido)
	}
	item, err := s.tipoObsRepo.FindByID(id)
	if err != nil {
		return err
	}
	item.Activo = false
	return s.tipoObsRepo.Update(item)
}

func (s *asistenciaService) EliminarRegistroAprendiz(asistenciaAprendizID uint) error {
	if asistenciaAprendizID == 0 {
		return errors.New(errMsgIDInvalido)
	}
	aa, err := s.repoAA.FindByID(asistenciaAprendizID)
	if err != nil {
		return errors.New(errMsgRegistroAsistenciaNoEncontrado)
	}
	if aa.Asistencia != nil && aa.Asistencia.IsFinished {
		return errors.New(errMsgSesionYaFinalizada)
	}
	return s.repoAA.Delete(asistenciaAprendizID)
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
	_, porFichaRaw, err := s.repo.GetDashboardResumen(sedeID, fecha)
	if err != nil {
		return nil, err
	}
	pendientes, _ := s.repo.CountPendientesRevisionByFecha(sedeID, fecha)
	esperados, errEsp := calcularDashboardEsperados(s.fichaRepo, s.aprendizRepo, sedeID, fecha, true)
	if errEsp != nil {
		return nil, errEsp
	}
	formacionDia, errFormacion := calcularDashboardEsperados(s.fichaRepo, s.aprendizRepo, sedeID, fecha, false)
	if errFormacion != nil {
		return nil, errFormacion
	}
	porFichaActivas, totalEnFormacion := filtrarPorFichaEsperadas(porFichaRaw, esperados)
	porFicha, _ := filtrarPorFichaEsperadas(porFichaRaw, formacionDia)
	sinSesionDTO, errSin := buildFichasSinSesionEsperadas(formacionDia, s.repo, fecha)
	if errSin != nil {
		return nil, errSin
	}
	sinSesionActivas, errSinAct := buildFichasSinSesionEsperadas(esperados, s.repo, fecha)
	if errSinAct != nil {
		return nil, errSinAct
	}
	var totalFichas int64
	if n, errC := s.fichaRepo.CountAll(sedeID); errC == nil {
		totalFichas = n
	}
	resp := &dto.AsistenciaDashboardResponse{
		Fecha:                          fecha,
		TotalAprendicesEnFormacion:     totalEnFormacion,
		TotalAprendicesEsperados:       esperados.TotalEsperados,
		JornadasActivas:                esperados.JornadasActivas,
		JornadasDisponibles:            formacionDia.JornadasActivas,
		PendientesRevision:             pendientes,
		PorFicha:                       make([]dto.AsistenciaDashboardPorFicha, len(porFicha)),
		FichasSinAsistenciaHoy:         sinSesionDTO,
		FichasSinSesionJornadaActiva:   len(sinSesionActivas),
		TotalFichasRegistradas:         int(totalFichas),
		FichasConSesionHoy:             len(porFichaActivas),
	}
	for i := range porFicha {
		resp.PorFicha[i] = dto.AsistenciaDashboardPorFicha{
			FichaID:             porFicha[i].FichaID,
			FichaNumero:         porFicha[i].FichaNumero,
			ProgramaNombre:      porFicha[i].ProgramaNombre,
			JornadaNombre:       porFicha[i].JornadaNombre,
			SedeNombre:          porFicha[i].SedeNombre,
			CantidadVinieron:    porFicha[i].CantidadVinieron,
			CantidadEnFormacion: porFicha[i].CantidadEnFormacion,
			TotalAprendices:     porFicha[i].TotalAprendices,
		}
	}
	return resp, nil
}

func (s *asistenciaService) GetCasosBienestar(sedeID *uint, dias, minFallas int) (*dto.CasosBienestarResponse, error) {
	if dias <= 0 {
		dias = 30
	}
	if minFallas <= 0 {
		minFallas = 3
	}
	fechaFin := time.Now()
	fechaInicio := fechaFin.AddDate(0, 0, -dias)
	fechaInicioStr := fechaInicio.Format(time.DateOnly)
	fechaFinStr := fechaFin.Format(time.DateOnly)

	rows, err := NewCasosBienestarCalculator().Calcular(sedeID, fechaInicioStr, fechaFinStr, minFallas)
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
			JornadaNombre:        rows[i].JornadaNombre,
			InstructorNombre:     rows[i].InstructorNombre,
			AmbienteNombre:       rows[i].AmbienteNombre,
			ModalidadNombre:      rows[i].ModalidadNombre,
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

	rows, err := NewCasosBienestarCalculator().CalcularDetalle(fichaNumero, aprendizID, fechaInicioStr, fechaFinStr, sedeNombre)
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
			Fecha:            rows[i].Fecha,
			InstructorNombre: rows[i].InstructorNombre,
			Observaciones:    rows[i].Observaciones,
		}
	}
	return resp, nil
}

const errMsgAprendizActivoNoEncontrado = "no está matriculado como aprendiz activo"

func (s *asistenciaService) GetMisInasistencias(personaID uint, dias int) (*dto.MisInasistenciasResponse, error) {
	if personaID == 0 {
		return nil, errors.New(errMsgAprendizActivoNoEncontrado)
	}
	aprendiz, err := s.aprendizRepo.FindActivoByPersonaID(personaID)
	if err != nil || aprendiz == nil {
		return nil, errors.New(errMsgAprendizActivoNoEncontrado)
	}
	fichaNumero := ""
	programaNombre := ""
	sedeNombre := ""
	if aprendiz.FichaCaracterizacion != nil {
		fichaNumero = aprendiz.FichaCaracterizacion.Ficha
		if aprendiz.FichaCaracterizacion.ProgramaFormacion != nil {
			programaNombre = aprendiz.FichaCaracterizacion.ProgramaFormacion.Nombre
		}
		if aprendiz.FichaCaracterizacion.Sede != nil {
			sedeNombre = aprendiz.FichaCaracterizacion.Sede.Nombre
		}
	}
	if strings.TrimSpace(fichaNumero) == "" {
		return nil, errors.New("ficha de caracterización no encontrada para el aprendiz")
	}
	detalle, err := s.GetDetalleInasistenciasAprendiz(fichaNumero, aprendiz.ID, dias, sedeNombre)
	if err != nil {
		return nil, err
	}
	return &dto.MisInasistenciasResponse{
		AprendizID:         aprendiz.ID,
		FichaNumero:        detalle.FichaNumero,
		ProgramaNombre:     programaNombre,
		SedeNombre:         sedeNombre,
		FechaInicio:        detalle.FechaInicio,
		FechaFin:           detalle.FechaFin,
		TotalInasistencias: len(detalle.Inasistencias),
		Inasistencias:      detalle.Inasistencias,
	}, nil
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
