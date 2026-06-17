package services

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/config"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

const (
	errMsgDiaNoProgramadoInstructor = "HOY NO TIENE FORMACIÓN PROGRAMADA EN ESTA FICHA"
	errMsgFueraHorarioProgramado    = "FUERA DEL HORARIO PROGRAMADO; SOLO SE PUEDE TOMAR ASISTENCIA EN EL HORARIO CONFIGURADO"
	errMsgColisionHorarioInstructor = "EL INSTRUCTOR YA ESTÁ PROGRAMADO EN ESE DÍA Y HORARIO EN OTRA FICHA"
)

// InstructorHorarioService valida colisiones de horario y ventana de asistencia.
type InstructorHorarioService struct {
	fichaRepo         repositories.FichaRepository
	fichaDiasRepo     repositories.FichaDiasRepository
	instFichaRepo     repositories.InstructorFichaRepository
	instFichaDiasRepo repositories.InstructorFichaDiasRepository
	trasladoFechaRepo repositories.InstructorFichaTrasladoFechaRepository
	catalogoRepo      repositories.CatalogoRepository
	calendarioSvc     *CalendarioFormacionService
}

func NewInstructorHorarioService() *InstructorHorarioService {
	return &InstructorHorarioService{
		fichaRepo:         repositories.NewFichaRepository(),
		fichaDiasRepo:     repositories.NewFichaDiasRepository(),
		instFichaRepo:     repositories.NewInstructorFichaRepository(),
		instFichaDiasRepo: repositories.NewInstructorFichaDiasRepository(),
		trasladoFechaRepo: repositories.NewInstructorFichaTrasladoFechaRepository(),
		catalogoRepo:      repositories.NewCatalogoRepository(),
		calendarioSvc:     NewCalendarioFormacionService(),
	}
}

// WeekdayToDiaFormacionID convierte time.Weekday a dia_formacion_id (1=lunes … 7=domingo).
func WeekdayToDiaFormacionID(w time.Weekday) uint {
	if w == time.Sunday {
		return 7
	}
	return uint(w)
}

func intervalosSeSolapan(aInicio, aFin, bInicio, bFin string) bool {
	ai, err1 := parseHora(aInicio)
	af, err2 := parseHora(aFin)
	bi, err3 := parseHora(bInicio)
	bf, err4 := parseHora(bFin)
	if err1 != nil || err2 != nil || err3 != nil || err4 != nil {
		return false
	}
	aStart := ai.Hour()*60 + ai.Minute()
	aEnd := af.Hour()*60 + af.Minute()
	bStart := bi.Hour()*60 + bi.Minute()
	bEnd := bf.Hour()*60 + bf.Minute()
	if aEnd < aStart {
		aEnd += 24 * 60
	}
	if bEnd < bStart {
		bEnd += 24 * 60
	}
	return aStart < bEnd && bStart < aEnd
}

func fechasVigenciaSeSolapan(aInicio, aFin, bInicio, bFin *time.Time) bool {
	if aInicio == nil || aFin == nil || bInicio == nil || bFin == nil {
		return true
	}
	ai := aInicio.Truncate(24 * time.Hour)
	af := aFin.Truncate(24 * time.Hour)
	bi := bInicio.Truncate(24 * time.Hour)
	bf := bFin.Truncate(24 * time.Hour)
	return !ai.After(bf) && !bi.After(af)
}

type bloqueSemanal struct {
	fichaID        uint
	fichaNum       string
	diaFormacionID uint
	horaInicio     string
	horaFin        string
	vigenciaInicio *time.Time
	vigenciaFin    *time.Time
}

func fichaDiaToBloqueInput(fd models.FichaDiasFormacion) (HorarioBloqueInput, bool) {
	hi, hf := normalizeHoraMM(fd.HoraInicio), normalizeHoraMM(fd.HoraFin)
	if hi == "" || hf == "" {
		return HorarioBloqueInput{}, false
	}
	return HorarioBloqueInput{
		DiaFormacionID: fd.DiaFormacionID,
		HoraInicio:     hi,
		HoraFin:        hf,
		JornadaID:      fd.JornadaID,
		Orden:          fd.Orden,
	}, true
}

func bloquesFromFichaDias(dias []models.FichaDiasFormacion, diaFormacionID uint) []HorarioBloqueInput {
	var out []HorarioBloqueInput
	for _, fd := range dias {
		if fd.DiaFormacionID != diaFormacionID {
			continue
		}
		if b, ok := fichaDiaToBloqueInput(fd); ok {
			out = append(out, b)
		}
	}
	return out
}

func jornadaIDFromFicha(ficha *models.FichaCaracterizacion) *uint {
	if ficha == nil {
		return nil
	}
	if ficha.JornadaID != nil {
		return ficha.JornadaID
	}
	if ficha.Jornada != nil {
		id := ficha.Jornada.ID
		return &id
	}
	return nil
}

func bloquesPlantillaDia(jornadaID, diaFormacionID uint) []HorarioBloqueInput {
	plantilla, err := BloquesJornadaPlantilla(jornadaID)
	if err != nil {
		return nil
	}
	var out []HorarioBloqueInput
	for _, b := range plantilla {
		if b.DiaFormacionID == diaFormacionID {
			out = append(out, b)
		}
	}
	return out
}

func bloqueFallbackJornadaCabecera(ficha *models.FichaCaracterizacion, diaFormacionID uint) []HorarioBloqueInput {
	if ficha == nil || ficha.Jornada == nil {
		return nil
	}
	hi, hf := normalizeHoraMM(ficha.Jornada.HoraInicio), normalizeHoraMM(ficha.Jornada.HoraFin)
	if hi == "" || hf == "" {
		return nil
	}
	return []HorarioBloqueInput{{DiaFormacionID: diaFormacionID, HoraInicio: hi, HoraFin: hf}}
}

func (s *InstructorHorarioService) bloquesDiaFicha(ficha *models.FichaCaracterizacion, diaFormacionID uint) []HorarioBloqueInput {
	if ficha == nil {
		return nil
	}
	dias := ficha.FichaDiasFormacion
	if len(dias) == 0 && ficha.ID > 0 {
		if loaded, err := s.fichaDiasRepo.FindByFichaID(ficha.ID); err == nil {
			dias = loaded
		}
	}
	if out := bloquesFromFichaDias(dias, diaFormacionID); len(out) > 0 {
		return out
	}
	if jid := jornadaIDFromFicha(ficha); jid != nil && *jid > 0 {
		if out := bloquesPlantillaDia(*jid, diaFormacionID); len(out) > 0 {
			return out
		}
	}
	return bloqueFallbackJornadaCabecera(ficha, diaFormacionID)
}

func (s *InstructorHorarioService) horasDiaFicha(ficha *models.FichaCaracterizacion, diaFormacionID uint) (inicio, fin string) {
	bloques := s.bloquesDiaFicha(ficha, diaFormacionID)
	if len(bloques) == 0 {
		return "", ""
	}
	return bloques[0].HoraInicio, bloques[0].HoraFin
}

func (s *InstructorHorarioService) diaIDsParaBloques(ficha *models.FichaCaracterizacion, diaIDs []uint) []uint {
	if len(diaIDs) > 0 {
		return diaIDs
	}
	dias := ficha.FichaDiasFormacion
	if len(dias) == 0 && ficha.ID > 0 {
		if loaded, err := s.fichaDiasRepo.FindByFichaID(ficha.ID); err == nil {
			dias = loaded
		}
	}
	seen := make(map[uint]bool)
	out := make([]uint, 0, len(dias))
	for _, fd := range dias {
		if fd.DiaFormacionID > 0 && !seen[fd.DiaFormacionID] {
			seen[fd.DiaFormacionID] = true
			out = append(out, fd.DiaFormacionID)
		}
	}
	return out
}

func appendBloquesHorarioDia(
	bloques []bloqueSemanal,
	ficha *models.FichaCaracterizacion,
	asg models.InstructorFichaCaracterizacion,
	diaID uint,
	horarios []HorarioBloqueInput,
	vigInicio, vigFin *time.Time,
) []bloqueSemanal {
	for _, hb := range horarios {
		bloques = append(bloques, bloqueSemanal{
			fichaID: asg.FichaID, fichaNum: ficha.Ficha,
			diaFormacionID: diaID, horaInicio: hb.HoraInicio, horaFin: hb.HoraFin,
			vigenciaInicio: vigInicio,
			vigenciaFin:    vigFin,
		})
	}
	return bloques
}

func (s *InstructorHorarioService) appendBloquesFicha(
	bloques []bloqueSemanal,
	ficha *models.FichaCaracterizacion,
	asg models.InstructorFichaCaracterizacion,
	diaIDs []uint,
) []bloqueSemanal {
	diaIDs = s.diaIDsParaBloques(ficha, diaIDs)
	fichaInicio, fichaFin := config.FechasVigenciaFicha(ficha)
	vigInicio := intersectarVigencia(fichaInicio, asg.FechaInicio)
	vigFin := intersectarVigenciaFin(fichaFin, asg.FechaFin)
	for _, diaID := range diaIDs {
		bloques = appendBloquesHorarioDia(bloques, ficha, asg, diaID, s.bloquesDiaFicha(ficha, diaID), vigInicio, vigFin)
	}
	return bloques
}

// diaIDsProgramadosInstructor devuelve solo días guardados en instructor_ficha_dias (sin inferir los de la ficha).
func diaIDsProgramadosInstructor(diasInst []models.InstructorFichaDias) []uint {
	if len(diasInst) == 0 {
		return nil
	}
	ids := make([]uint, len(diasInst))
	for i, d := range diasInst {
		ids[i] = d.DiaFormacionID
	}
	return ids
}

func (s *InstructorHorarioService) bloquesInstructor(instructorID uint, excluirFichaID uint) ([]bloqueSemanal, error) {
	assignments, err := s.instFichaRepo.FindByInstructorID(instructorID)
	if err != nil {
		return nil, err
	}
	var bloques []bloqueSemanal
	for _, asg := range assignments {
		if excluirFichaID > 0 && asg.FichaID == excluirFichaID {
			continue
		}
		ficha, err := s.fichaRepo.FindByID(asg.FichaID)
		if err != nil || ficha == nil || !ficha.Status {
			continue
		}
		diasInst, err := s.instFichaDiasRepo.FindByInstructorAndFicha(instructorID, asg.FichaID)
		if err != nil {
			continue
		}
		diaIDs := diaIDsProgramadosInstructor(diasInst)
		bloques = s.appendBloquesFicha(bloques, ficha, asg, diaIDs)
	}
	return bloques, nil
}

func intersectarVigencia(fichaInicio, asgInicio *time.Time) *time.Time {
	if fichaInicio == nil {
		return asgInicio
	}
	if asgInicio == nil {
		return fichaInicio
	}
	if asgInicio.After(*fichaInicio) {
		return asgInicio
	}
	return fichaInicio
}

func intersectarVigenciaFin(fichaFin, asgFin *time.Time) *time.Time {
	if fichaFin == nil {
		return asgFin
	}
	if asgFin == nil {
		return fichaFin
	}
	if asgFin.Before(*fichaFin) {
		return asgFin
	}
	return fichaFin
}

func colisionaConBloquesExistentes(
	diaID uint, hi, hf string,
	vigInicio, vigFin *time.Time,
	existing []bloqueSemanal,
	fichaNum string,
) error {
	for _, ex := range existing {
		if ex.diaFormacionID != diaID {
			continue
		}
		if !intervalosSeSolapan(hi, hf, ex.horaInicio, ex.horaFin) {
			continue
		}
		if !fechasVigenciaSeSolapan(vigInicio, vigFin, ex.vigenciaInicio, ex.vigenciaFin) {
			continue
		}
		return fmt.Errorf("%s: el %s %s–%s en ficha %s solapa con ficha %s (%s–%s)",
			errMsgColisionHorarioInstructor, nombreDia(diaID), hi, hf, fichaNum, ex.fichaNum, ex.horaInicio, ex.horaFin)
	}
	return nil
}

func (s *InstructorHorarioService) ValidarColisionAlAsignar(instructorID, fichaID uint, diasIDs []uint, fechaInicio, fechaFin time.Time, excluirFichaActual bool) error {
	excluir := uint(0)
	if excluirFichaActual {
		excluir = fichaID
	}
	existing, err := s.bloquesInstructor(instructorID, excluir)
	if err != nil {
		return err
	}
	ficha, err := s.fichaRepo.FindByID(fichaID)
	if err != nil || ficha == nil {
		return errors.New(msgFichaNoEncontrada)
	}
	fichaInicio, fichaFin := config.FechasVigenciaFicha(ficha)
	vigInicio := intersectarVigencia(fichaInicio, &fechaInicio)
	vigFin := intersectarVigenciaFin(fichaFin, &fechaFin)
	for _, diaID := range diasIDs {
		for _, hb := range s.bloquesDiaFicha(ficha, diaID) {
			if errCol := colisionaConBloquesExistentes(diaID, hb.HoraInicio, hb.HoraFin, vigInicio, vigFin, existing, ficha.Ficha); errCol != nil {
				return errCol
			}
		}
	}
	return nil
}

func (s *InstructorHorarioService) ValidarColisionEnFecha(instructorID, fichaID, diaID uint, fecha time.Time) error {
	f := fechaCalendario(fecha)
	return s.ValidarColisionAlAsignar(instructorID, fichaID, []uint{diaID}, f, f, true)
}

func nombreDia(diaID uint) string {
	names := map[uint]string{1: "lunes", 2: "martes", 3: "miércoles", 4: "jueves", 5: "viernes", 6: "sábado", 7: "domingo"}
	if n, ok := names[diaID]; ok {
		return n
	}
	return fmt.Sprintf("día %d", diaID)
}

func (s *InstructorHorarioService) ValidarDiasSubsetFicha(fichaID uint, diasIDs []uint) error {
	fichaDias, err := s.fichaDiasRepo.FindByFichaID(fichaID)
	if err != nil {
		return err
	}
	allowed := make(map[uint]bool, len(fichaDias))
	for _, fd := range fichaDias {
		allowed[fd.DiaFormacionID] = true
	}
	for _, id := range diasIDs {
		if id == 0 {
			continue
		}
		if !allowed[id] {
			return fmt.Errorf("el día %d no está configurado en la ficha", id)
		}
	}
	return nil
}

func instructorTieneDiaProgramado(diaHoy uint, diasInst []models.InstructorFichaDias) bool {
	for _, d := range diasInst {
		if d.DiaFormacionID == diaHoy {
			return true
		}
	}
	return false
}

func diaDentroDeVigencia(diaMomento time.Time, vigInicio, vigFin *time.Time) bool {
	if vigInicio != nil && diaMomento.Before(vigInicio.Truncate(24*time.Hour)) {
		return false
	}
	if vigFin != nil && diaMomento.After(vigFin.Truncate(24*time.Hour)) {
		return false
	}
	return true
}

func vigenciaAplica(vigInicio, vigFin *time.Time) bool {
	return vigInicio != nil || vigFin != nil
}

func fichaSinFechasProgramadas(ficha *models.FichaCaracterizacion) bool {
	return ficha != nil && ficha.FechaInicio == nil && ficha.FechaFin == nil
}

const errMsgFueraVigenciaAsignacion = "fuera del periodo de vigencia de la asignación"

func formatFechaVigencia(t *time.Time) string {
	if t == nil {
		return "sin límite"
	}
	return t.Format("02/01/2006")
}

func diaMomentoCalendario(momento time.Time) time.Time {
	return time.Date(momento.Year(), momento.Month(), momento.Day(), 0, 0, 0, 0, momento.Location())
}

func validarVigenciaMomento(
	momento time.Time,
	ficha *models.FichaCaracterizacion,
	ifc *models.InstructorFichaCaracterizacion,
) error {
	fichaInicio, fichaFin := config.FechasVigenciaFicha(ficha)
	vigInicio := intersectarVigencia(fichaInicio, ifc.FechaInicio)
	vigFin := intersectarVigenciaFin(fichaFin, ifc.FechaFin)
	if !vigenciaAplica(vigInicio, vigFin) {
		return nil
	}
	if !diaDentroDeVigencia(diaMomentoCalendario(momento), vigInicio, vigFin) {
		return fmt.Errorf(
			"%s (vigencia efectiva: %s a %s; fecha: %s)",
			errMsgFueraVigenciaAsignacion,
			formatFechaVigencia(vigInicio),
			formatFechaVigencia(vigFin),
			diaMomentoCalendario(momento).Format("02/01/2006"),
		)
	}
	return nil
}

func validarModoAsignacionTomarAsistencia(
	ficha *models.FichaCaracterizacion,
	ifc *models.InstructorFichaCaracterizacion,
	sinDiasFicha bool,
	momento time.Time,
) error {
	if sinDiasFicha && fichaSinFechasProgramadas(ficha) {
		return nil
	}
	return validarVigenciaMomento(momento, ficha, ifc)
}

func (s *InstructorHorarioService) validarTomarAsistenciaProgramado(
	ficha *models.FichaCaracterizacion,
	ifc *models.InstructorFichaCaracterizacion,
	diaHoy uint,
	diasInst []models.InstructorFichaDias,
	momento time.Time,
) error {
	if err := validarVigenciaMomento(momento, ficha, ifc); err != nil {
		return err
	}
	if !instructorTieneDiaProgramado(diaHoy, diasInst) {
		return errors.New(strings.ToLower(errMsgDiaNoProgramadoInstructor))
	}
	return s.validarHorarioAsistencia(ficha, diaHoy, momento)
}

func extensionMinutosJornada(j *models.Jornada) int {
	extMin := 60
	if j == nil {
		return extMin
	}
	if j.MinutosExtensionFin != nil && *j.MinutosExtensionFin >= 0 {
		return *j.MinutosExtensionFin
	}
	return extMin
}

func (s *InstructorHorarioService) validarHorarioAsistencia(ficha *models.FichaCaracterizacion, diaHoy uint, momento time.Time) error {
	bloques := s.bloquesDiaFicha(ficha, diaHoy)
	if len(bloques) == 0 {
		if ficha.JornadaID == nil {
			return nil
		}
		ok, _ := NewJornadaValidationService().ValidarHorarioJornada(*ficha.JornadaID)
		if !ok {
			return errors.New(strings.ToLower(errMsgFueraHorarioProgramado))
		}
		return nil
	}
	extMin := extensionMinutosJornada(ficha.Jornada)
	if !MomentoEnAlgunBloque(bloques, extMin, momento) {
		return errors.New(strings.ToLower(errMsgFueraHorarioProgramado))
	}
	return nil
}

type contextoTomarAsistencia struct {
	ficha        *models.FichaCaracterizacion
	ifc          *models.InstructorFichaCaracterizacion
	diasInst     []models.InstructorFichaDias
	sinDiasFicha bool
}

func (s *InstructorHorarioService) cargarContextoTomarAsistencia(instructorID, fichaID uint) (*contextoTomarAsistencia, error) {
	ifc, err := s.instFichaRepo.FindByFichaIDAndInstructorID(fichaID, instructorID)
	if err != nil || ifc == nil {
		return nil, errors.New(errMsgNoEstaCreadoComoInstructor)
	}
	ficha, err := s.fichaRepo.FindByID(fichaID)
	if err != nil || ficha == nil {
		return nil, errors.New(msgFichaNoEncontrada)
	}
	if !ficha.Status {
		return nil, errors.New("la ficha está inactiva; no se puede tomar asistencia")
	}
	diasInst, err := s.instFichaDiasRepo.FindByInstructorAndFicha(instructorID, fichaID)
	if err != nil {
		return nil, err
	}
	fichaDias, err := s.fichaDiasRepo.FindByFichaID(fichaID)
	if err != nil {
		return nil, err
	}
	return &contextoTomarAsistencia{
		ficha:        ficha,
		ifc:          ifc,
		diasInst:     diasInst,
		sinDiasFicha: len(fichaDias) == 0,
	}, nil
}

func (s *InstructorHorarioService) validarAsistenciaDiaPrestado(
	ficha *models.FichaCaracterizacion,
	ifc *models.InstructorFichaCaracterizacion,
	diaPrestado uint,
	momento time.Time,
) error {
	if err := validarVigenciaMomento(momento, ficha, ifc); err != nil {
		return err
	}
	return s.validarHorarioAsistencia(ficha, diaPrestado, momento)
}

func (s *InstructorHorarioService) validarTomarAsistenciaTraslados(
	ficha *models.FichaCaracterizacion,
	ifc *models.InstructorFichaCaracterizacion,
	instructorID uint,
	diasInst []models.InstructorFichaDias,
	traslados []models.InstructorFichaTrasladoFecha,
	momento time.Time,
) error {
	if diaPrestado, ok := instructorSesionPrestadaTraslado(traslados, instructorID, momento); ok {
		return s.validarAsistenciaDiaPrestado(ficha, ifc, diaPrestado, momento)
	}
	if instructorCedeSesionTraslado(traslados, instructorID, momento) {
		return errors.New(strings.ToLower(errMsgDiaNoProgramadoInstructor))
	}
	return s.validarTomarAsistenciaProgramado(
		ficha,
		ifc,
		WeekdayToDiaFormacionID(momento.Weekday()),
		diasInst,
		momento,
	)
}

func (s *InstructorHorarioService) ValidarPuedeTomarAsistencia(instructorID, fichaID uint, momento time.Time) error {
	if s.calendarioSvc.EsDiaFestivoColombia(momento) {
		return errors.New("hoy es festivo nacional; no hay formación programada")
	}
	ctx, err := s.cargarContextoTomarAsistencia(instructorID, fichaID)
	if err != nil {
		return err
	}
	if ctx.ficha.SedeID != nil && *ctx.ficha.SedeID > 0 {
		if ok, motivo := s.calendarioSvc.MotivoDiaSinFormacionSede(*ctx.ficha.SedeID, momento); ok {
			msg := strings.ToLower("día sin formación en la sede")
			if strings.TrimSpace(motivo) != "" {
				msg = strings.ToLower(motivo)
			}
			return errors.New(msg)
		}
	}
	if config.RelaxarRestriccionAsistencia() {
		return nil
	}
	if len(ctx.diasInst) == 0 || ctx.sinDiasFicha {
		return validarModoAsignacionTomarAsistencia(ctx.ficha, ctx.ifc, ctx.sinDiasFicha, momento)
	}
	traslados, err := s.trasladoFechaRepo.FindByFichaInRange(fichaID, fechaCalendario(momento), fechaCalendario(momento))
	if err != nil {
		return err
	}
	return s.validarTomarAsistenciaTraslados(ctx.ficha, ctx.ifc, instructorID, ctx.diasInst, traslados, momento)
}

func validarHorarioRango(horaInicio, horaFin string, extMin int, now time.Time) bool {
	tInicio, err1 := parseHora(horaInicio)
	tFin, err2 := parseHora(horaFin)
	if err1 != nil || err2 != nil {
		return true
	}
	hoy := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	actual := hoy.Add(time.Duration(now.Hour())*time.Hour + time.Duration(now.Minute())*time.Minute)
	start := hoy.Add(time.Duration(tInicio.Hour())*time.Hour + time.Duration(tInicio.Minute())*time.Minute)
	end := hoy.Add(time.Duration(tFin.Hour())*time.Hour + time.Duration(tFin.Minute())*time.Minute)
	if end.Before(start) {
		end = end.Add(24 * time.Hour)
		if actual.Before(start) {
			actual = actual.Add(24 * time.Hour)
		}
	}
	endEffective := end.Add(time.Duration(extMin) * time.Minute)
	return !actual.Before(start) && !actual.After(endEffective)
}
