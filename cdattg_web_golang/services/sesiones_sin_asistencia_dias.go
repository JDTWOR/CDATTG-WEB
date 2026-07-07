package services

import (
	"fmt"
	"sort"
	"time"

	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

func claveSesionInstructorFicha(instructorFichaID uint, fecha time.Time) string {
	return fmt.Sprintf("%d|%s", instructorFichaID, fecha.Format(time.DateOnly))
}

func mapSesionesExistentes(claves []repositories.ClaveSesionInstructorFichaRaw) map[string]struct{} {
	sesionExiste := make(map[string]struct{}, len(claves))
	for _, cl := range claves {
		sesionExiste[claveSesionInstructorFicha(cl.InstructorFichaID, cl.Fecha)] = struct{}{}
	}
	return sesionExiste
}

func sedeIDsUnicosDeAsignaciones(asignaciones []repositories.AsignacionInstructorFichaReporteRaw) []uint {
	sedeIDSet := make([]uint, 0, len(asignaciones))
	seenSede := make(map[uint]struct{})
	for _, a := range asignaciones {
		if a.SedeID == 0 {
			continue
		}
		if _, ok := seenSede[a.SedeID]; ok {
			continue
		}
		seenSede[a.SedeID] = struct{}{}
		sedeIDSet = append(sedeIDSet, a.SedeID)
	}
	return sedeIDSet
}

type cachesReporteSinAsistencia struct {
	ficha     map[uint]*models.FichaCaracterizacion
	fichaDias map[uint][]models.FichaDiasFormacion
	diasInst  map[uint][]models.InstructorFichaDias
	traslados map[uint][]models.InstructorFichaTrasladoFecha
}

func newCachesReporteSinAsistencia() *cachesReporteSinAsistencia {
	return &cachesReporteSinAsistencia{
		ficha:     make(map[uint]*models.FichaCaracterizacion),
		fichaDias: make(map[uint][]models.FichaDiasFormacion),
		diasInst:  make(map[uint][]models.InstructorFichaDias),
		traslados: make(map[uint][]models.InstructorFichaTrasladoFecha),
	}
}

func filaDiaSinSesion(asg repositories.AsignacionInstructorFichaReporteRaw, fecha time.Time) repositories.SesionSinAsistenciaTomadaRow {
	return repositories.SesionSinAsistenciaTomadaRow{
		AsistenciaID:       0,
		InstructorFichaID:  asg.InstructorFichaID,
		FichaID:            asg.FichaID,
		FichaNumero:        asg.FichaNumero,
		InstructorID:       asg.InstructorID,
		InstructorNombre:   asg.InstructorNombre,
		NumeroDocumento:    asg.NumeroDocumento,
		ProgramaNombre:     asg.ProgramaNombre,
		SedeNombre:         asg.SedeNombre,
		JornadaNombre:      asg.JornadaNombre,
		SedeID:             asg.SedeID,
		Fecha:              fecha,
		IsFinished:         false,
		TipoIncumplimiento: repositories.TipoIncumplimientoDiaSinSesion,
	}
}

func instructorFichaDesdeAsignacion(asg repositories.AsignacionInstructorFichaReporteRaw) *models.InstructorFichaCaracterizacion {
	return &models.InstructorFichaCaracterizacion{
		BaseModel:    models.BaseModel{ID: asg.InstructorFichaID},
		InstructorID: asg.InstructorID,
		FichaID:      asg.FichaID,
		FechaInicio:  asg.FechaInicio,
		FechaFin:     asg.FechaFin,
	}
}

func (c *CasosBienestarCalculator) diasSinSesionParaAsignacion(
	asg repositories.AsignacionInstructorFichaReporteRaw,
	tInicio, tFin time.Time,
	sesionExiste map[string]struct{},
	caches *cachesReporteSinAsistencia,
) ([]repositories.SesionSinAsistenciaTomadaRow, error) {
	ficha, err := c.fichaParaReporteSinAsistencia(asg.FichaID, caches.ficha)
	if err != nil || ficha == nil {
		return nil, nil
	}
	fichaDias, err := c.fichaDiasParaReporte(asg.FichaID, ficha, caches.fichaDias)
	if err != nil {
		return nil, err
	}
	diasInst, err := c.diasInstParaReporte(asg.InstructorID, asg.FichaID, caches.diasInst)
	if err != nil {
		return nil, err
	}
	traslados, err := c.trasladosParaReporte(asg.FichaID, tInicio, tFin, caches.traslados)
	if err != nil {
		return nil, err
	}

	ifc := instructorFichaDesdeAsignacion(asg)
	var out []repositories.SesionSinAsistenciaTomadaRow
	for d := tInicio; !d.After(tFin); d = d.AddDate(0, 0, 1) {
		if _, ok := sesionExiste[claveSesionInstructorFicha(asg.InstructorFichaID, d)]; ok {
			continue
		}
		if !c.calendario.DebeTomarAsistenciaEnFechaConDatos(ficha, ifc, fichaDias, diasInst, traslados, d) {
			continue
		}
		out = append(out, filaDiaSinSesion(asg, d))
	}
	return out, nil
}

func (c *CasosBienestarCalculator) listarDiasFormacionSinSesionAbierta(
	sedeIDs []uint,
	tInicio, tFin time.Time,
	fechaInicio, fechaFin string,
) ([]repositories.SesionSinAsistenciaTomadaRow, error) {
	asignaciones, err := c.repo.ListAsignacionesInstructorFichaActivas(sedeIDs)
	if err != nil {
		return nil, err
	}
	if len(asignaciones) == 0 {
		return nil, nil
	}

	claves, err := c.repo.ListClavesSesionInstructorFichaEnRango(sedeIDs, fechaInicio, fechaFin)
	if err != nil {
		return nil, err
	}
	sesionExiste := mapSesionesExistentes(claves)

	if err := c.precargarCalendario(tInicio, tFin, sedeIDsUnicosDeAsignaciones(asignaciones)); err != nil {
		return nil, err
	}

	caches := newCachesReporteSinAsistencia()
	var out []repositories.SesionSinAsistenciaTomadaRow
	for _, asg := range asignaciones {
		rows, err := c.diasSinSesionParaAsignacion(asg, tInicio, tFin, sesionExiste, caches)
		if err != nil {
			return nil, err
		}
		out = append(out, rows...)
	}
	return out, nil
}

func (c *CasosBienestarCalculator) fichaParaReporteSinAsistencia(
	fichaID uint,
	cache map[uint]*models.FichaCaracterizacion,
) (*models.FichaCaracterizacion, error) {
	if f, ok := cache[fichaID]; ok {
		return f, nil
	}
	ficha, err := c.fichaRepo.FindByID(fichaID)
	if err != nil {
		return nil, err
	}
	cache[fichaID] = ficha
	return ficha, nil
}

func (c *CasosBienestarCalculator) fichaDiasParaReporte(
	fichaID uint,
	ficha *models.FichaCaracterizacion,
	cache map[uint][]models.FichaDiasFormacion,
) ([]models.FichaDiasFormacion, error) {
	if dias, ok := cache[fichaID]; ok {
		return dias, nil
	}
	if len(ficha.FichaDiasFormacion) > 0 {
		cache[fichaID] = ficha.FichaDiasFormacion
		return ficha.FichaDiasFormacion, nil
	}
	dias, err := c.calendario.fichaDiasRepo.FindByFichaID(fichaID)
	if err != nil {
		return nil, err
	}
	cache[fichaID] = dias
	return dias, nil
}

func (c *CasosBienestarCalculator) diasInstParaReporte(
	instructorID, fichaID uint,
	cache map[uint][]models.InstructorFichaDias,
) ([]models.InstructorFichaDias, error) {
	key := instructorID*1_000_000 + fichaID
	if dias, ok := cache[key]; ok {
		return dias, nil
	}
	dias, err := c.calendario.instFichaDiasRepo.FindByInstructorAndFicha(instructorID, fichaID)
	if err != nil {
		return nil, err
	}
	cache[key] = dias
	return dias, nil
}

func (c *CasosBienestarCalculator) trasladosParaReporte(
	fichaID uint,
	desde, hasta time.Time,
	cache map[uint][]models.InstructorFichaTrasladoFecha,
) ([]models.InstructorFichaTrasladoFecha, error) {
	if traslados, ok := cache[fichaID]; ok {
		return traslados, nil
	}
	traslados, err := c.calendario.trasladoFechaRepo.FindByFichaInRange(fichaID, desde, hasta)
	if err != nil {
		return nil, err
	}
	cache[fichaID] = traslados
	return traslados, nil
}

func ordenarIncumplimientosAsistencia(rows []repositories.SesionSinAsistenciaTomadaRow) {
	sort.Slice(rows, func(i, j int) bool {
		return compararIncumplimientoAsistencia(rows[i], rows[j]) < 0
	})
}

func compararIncumplimientoAsistencia(a, b repositories.SesionSinAsistenciaTomadaRow) int {
	if a.Fecha.After(b.Fecha) {
		return -1
	}
	if a.Fecha.Before(b.Fecha) {
		return 1
	}
	if a.FichaNumero != b.FichaNumero {
		if a.FichaNumero < b.FichaNumero {
			return -1
		}
		return 1
	}
	if a.InstructorNombre < b.InstructorNombre {
		return -1
	}
	if a.InstructorNombre > b.InstructorNombre {
		return 1
	}
	return 0
}
