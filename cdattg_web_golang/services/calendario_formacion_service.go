package services

import (
	"sync"
	"time"

	"github.com/sena/cdattg-web-golang/config"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

// CalendarioFormacionService centraliza reglas de días hábiles de formación.
type CalendarioFormacionService struct {
	fichaRepo             repositories.FichaRepository
	fichaDiasRepo         repositories.FichaDiasRepository
	instFichaRepo         repositories.InstructorFichaRepository
	instFichaDiasRepo     repositories.InstructorFichaDiasRepository
	trasladoFechaRepo     repositories.InstructorFichaTrasladoFechaRepository
	diaFestivoRepo        repositories.DiaFestivoRepository
	diaSinFormacionRepo   repositories.DiaSinFormacionSedeRepository
	festivosCache         map[string]bool
	festivosCacheMu       sync.RWMutex
	sinFormacionSedeCache map[uint]map[string]string
	sinFormacionCacheMu   sync.RWMutex
}

func NewCalendarioFormacionService() *CalendarioFormacionService {
	return &CalendarioFormacionService{
		fichaRepo:             repositories.NewFichaRepository(),
		fichaDiasRepo:         repositories.NewFichaDiasRepository(),
		instFichaRepo:         repositories.NewInstructorFichaRepository(),
		instFichaDiasRepo:     repositories.NewInstructorFichaDiasRepository(),
		trasladoFechaRepo:     repositories.NewInstructorFichaTrasladoFechaRepository(),
		diaFestivoRepo:        repositories.NewDiaFestivoRepository(),
		diaSinFormacionRepo:   repositories.NewDiaSinFormacionSedeRepository(),
		festivosCache:         make(map[string]bool),
		sinFormacionSedeCache: make(map[uint]map[string]string),
	}
}

func (s *CalendarioFormacionService) EsDiaFestivoColombia(fecha time.Time) bool {
	key := fechaCalendario(fecha).Format(time.DateOnly)
	s.festivosCacheMu.RLock()
	if v, ok := s.festivosCache[key]; ok {
		s.festivosCacheMu.RUnlock()
		return v
	}
	s.festivosCacheMu.RUnlock()

	ok, err := s.diaFestivoRepo.ExistsByFecha(fecha)
	if err != nil {
		return false
	}
	s.festivosCacheMu.Lock()
	s.festivosCache[key] = ok
	s.festivosCacheMu.Unlock()
	return ok
}

func (s *CalendarioFormacionService) MotivoDiaSinFormacionSede(sedeID uint, fecha time.Time) (bool, string) {
	if sedeID == 0 {
		return false, ""
	}
	key := fechaCalendario(fecha).Format(time.DateOnly)
	s.sinFormacionCacheMu.RLock()
	if bySede, ok := s.sinFormacionSedeCache[sedeID]; ok {
		if motivo, hit := bySede[key]; hit {
			s.sinFormacionCacheMu.RUnlock()
			return motivo != "", motivo
		}
	}
	s.sinFormacionCacheMu.RUnlock()

	ok, motivo, err := s.diaSinFormacionRepo.ExistsEnFecha(sedeID, fecha)
	if err != nil {
		return false, ""
	}
	s.sinFormacionCacheMu.Lock()
	if s.sinFormacionSedeCache[sedeID] == nil {
		s.sinFormacionSedeCache[sedeID] = make(map[string]string)
	}
	if ok {
		s.sinFormacionSedeCache[sedeID][key] = motivo
	} else {
		s.sinFormacionSedeCache[sedeID][key] = ""
	}
	s.sinFormacionCacheMu.Unlock()
	return ok, motivo
}

func (s *CalendarioFormacionService) EsDiaSinFormacionSede(sedeID uint, fecha time.Time) bool {
	ok, _ := s.MotivoDiaSinFormacionSede(sedeID, fecha)
	return ok
}

func uniqueDiaIDsFromFichaDias(rows []models.FichaDiasFormacion) []uint {
	return uniqueDiaIDsFromRecords(convertFichaDiasToInstructor(rows))
}

func convertFichaDiasToInstructor(rows []models.FichaDiasFormacion) []models.InstructorFichaDias {
	out := make([]models.InstructorFichaDias, 0, len(rows))
	for _, r := range rows {
		if r.DiaFormacionID > 0 {
			out = append(out, models.InstructorFichaDias{DiaFormacionID: r.DiaFormacionID})
		}
	}
	return out
}

func diaIDsProgramadosConFallback(diasInst []models.InstructorFichaDias, fichaDias []models.FichaDiasFormacion) []uint {
	diaIDs := diaIDsProgramadosInstructor(diasInst)
	if len(diaIDs) > 0 {
		return diaIDs
	}
	return uniqueDiaIDsFromFichaDias(fichaDias)
}

func (s *CalendarioFormacionService) instructorTieneFormacionEnFecha(
	ficha *models.FichaCaracterizacion,
	ifc *models.InstructorFichaCaracterizacion,
	fichaDias []models.FichaDiasFormacion,
	diasInst []models.InstructorFichaDias,
	traslados []models.InstructorFichaTrasladoFecha,
	fecha time.Time,
) bool {
	if err := validarVigenciaMomento(fecha, ficha, ifc); err != nil {
		return false
	}
	diaID := WeekdayToDiaFormacionID(fecha.Weekday())
	fichaDiaIDs := uniqueDiaIDsFromFichaDias(fichaDias)
	if len(fichaDiaIDs) > 0 && !containsUint(fichaDiaIDs, diaID) {
		return false
	}
	diaIDs := diaIDsProgramadosConFallback(diasInst, fichaDias)
	if len(diaIDs) == 0 {
		return false
	}
	diaSet := make(map[uint]bool, len(diaIDs))
	for _, id := range diaIDs {
		diaSet[id] = true
	}
	if instructorCedeSesionTraslado(traslados, ifc.InstructorID, fecha) {
		return false
	}
	if _, ok := instructorSesionPrestadaTraslado(traslados, ifc.InstructorID, fecha); ok {
		return true
	}
	return diaSet[diaID]
}

// EsSesionFormacionValida indica si una sesión de asistencia debe contar para inasistencias.
func (s *CalendarioFormacionService) EsSesionFormacionValida(fichaID, instructorID uint, fecha time.Time) bool {
	fecha = fechaCalendario(fecha)
	if s.EsDiaFestivoColombia(fecha) {
		return false
	}
	ficha, err := s.fichaRepo.FindByID(fichaID)
	if err != nil || ficha == nil || !ficha.Status {
		return false
	}
	if ficha.SedeID != nil && *ficha.SedeID > 0 && s.EsDiaSinFormacionSede(*ficha.SedeID, fecha) {
		return false
	}
	ifc, err := s.instFichaRepo.FindByFichaIDAndInstructorID(fichaID, instructorID)
	if err != nil || ifc == nil {
		return false
	}
	if config.RelaxarRestriccionAsistencia() {
		return true
	}
	fichaDias, err := s.fichaDiasRepo.FindByFichaID(fichaID)
	if err != nil {
		return false
	}
	diasInst, err := s.instFichaDiasRepo.FindByInstructorAndFicha(instructorID, fichaID)
	if err != nil {
		return false
	}
	traslados, err := s.trasladoFechaRepo.FindByFichaInRange(fichaID, fecha, fecha)
	if err != nil {
		return false
	}
	return s.instructorTieneFormacionEnFecha(ficha, ifc, fichaDias, diasInst, traslados, fecha)
}

// PrecargarFestivosEnRango calienta caché de festivos para un rango.
func (s *CalendarioFormacionService) PrecargarFestivosEnRango(desde, hasta time.Time) error {
	rows, err := s.diaFestivoRepo.FindEnRango(desde, hasta)
	if err != nil {
		return err
	}
	s.festivosCacheMu.Lock()
	defer s.festivosCacheMu.Unlock()
	for d := fechaCalendario(desde); !d.After(hasta); d = d.AddDate(0, 0, 1) {
		s.festivosCache[d.Format(time.DateOnly)] = false
	}
	for _, row := range rows {
		s.festivosCache[row.Fecha.Format(time.DateOnly)] = true
	}
	return nil
}

// PrecargarSinFormacionSede calienta caché PARO/sin formación para una sede en rango.
func (s *CalendarioFormacionService) PrecargarSinFormacionSede(sedeID uint, desde, hasta time.Time) error {
	if sedeID == 0 {
		return nil
	}
	rows, err := s.diaSinFormacionRepo.FindEnRango(sedeID, desde, hasta)
	if err != nil {
		return err
	}
	s.sinFormacionCacheMu.Lock()
	defer s.sinFormacionCacheMu.Unlock()
	if s.sinFormacionSedeCache[sedeID] == nil {
		s.sinFormacionSedeCache[sedeID] = make(map[string]string)
	}
	for d := fechaCalendario(desde); !d.After(hasta); d = d.AddDate(0, 0, 1) {
		s.sinFormacionSedeCache[sedeID][d.Format(time.DateOnly)] = ""
	}
	for _, row := range rows {
		for d := fechaCalendario(row.FechaInicio); !d.After(row.FechaFin); d = d.AddDate(0, 0, 1) {
			if d.Before(desde) || d.After(hasta) {
				continue
			}
			s.sinFormacionSedeCache[sedeID][d.Format(time.DateOnly)] = row.Motivo
		}
	}
	return nil
}
