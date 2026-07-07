package services

import (
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/repositories"
)

// CasosBienestarCalculator calcula inasistencias usando calendario de formación válido.
type CasosBienestarCalculator struct {
	repo       repositories.AsistenciaRepository
	calendario *CalendarioFormacionService
	fichaRepo  repositories.FichaRepository
}

func NewCasosBienestarCalculator() *CasosBienestarCalculator {
	return &CasosBienestarCalculator{
		repo:       repositories.NewAsistenciaRepository(),
		calendario: NewCalendarioFormacionService(),
		fichaRepo:  repositories.NewFichaRepository(),
	}
}

func agregarSedeID(ids []uint, sedeID uint) []uint {
	if sedeID > 0 {
		return append(ids, sedeID)
	}
	return ids
}

func sedeIDsFromSesionesCasos(sesiones []repositories.SesionCasosBienestarRaw) []uint {
	ids := make([]uint, 0, len(sesiones))
	for _, s := range sesiones {
		ids = agregarSedeID(ids, s.SedeID)
	}
	return ids
}

func (c *CasosBienestarCalculator) precargarCalendario(desde, hasta time.Time, sedeIDs []uint) error {
	if err := c.calendario.PrecargarFestivosEnRango(desde, hasta); err != nil {
		return err
	}
	seen := make(map[uint]struct{}, len(sedeIDs))
	for _, sedeID := range sedeIDs {
		if sedeID == 0 {
			continue
		}
		if _, ok := seen[sedeID]; ok {
			continue
		}
		seen[sedeID] = struct{}{}
		if err := c.calendario.PrecargarSinFormacionSede(sedeID, desde, hasta); err != nil {
			return err
		}
	}
	return nil
}

func (c *CasosBienestarCalculator) filtrarSesionesValidas(
	sesiones []repositories.SesionCasosBienestarRaw,
	desde, hasta time.Time,
) ([]repositories.SesionCasosBienestarRaw, error) {
	if err := c.precargarCalendario(desde, hasta, sedeIDsFromSesionesCasos(sesiones)); err != nil {
		return nil, err
	}
	var validas []repositories.SesionCasosBienestarRaw
	for _, s := range sesiones {
		if c.calendario.EsSesionFormacionValida(s.FichaID, s.InstructorID, s.Fecha) {
			validas = append(validas, s)
		}
	}
	return validas, nil
}

func mapAsistenciasEfectivas(asistencias []repositories.AsistenciaEfectivaRaw) map[uint]map[uint]bool {
	asistio := make(map[uint]map[uint]bool)
	for _, a := range asistencias {
		if asistio[a.AprendizID] == nil {
			asistio[a.AprendizID] = make(map[uint]bool)
		}
		asistio[a.AprendizID][a.AsistenciaID] = true
	}
	return asistio
}

func mapInasistenciasJustificadas(rows []repositories.InasistenciaJustificadaRaw) map[uint]map[uint]bool {
	out := make(map[uint]map[uint]bool)
	for _, r := range rows {
		if out[r.AprendizID] == nil {
			out[r.AprendizID] = make(map[uint]bool)
		}
		out[r.AprendizID][r.AsistenciaID] = true
	}
	return out
}

func inasistenciasAprendiz(
	ap repositories.AprendizCasosBienestarRaw,
	sesIDs []uint,
	asistio map[uint]map[uint]bool,
	justificada map[uint]map[uint]bool,
	minFallas int,
) (repositories.CasosBienestarRow, bool) {
	if len(sesIDs) == 0 {
		return repositories.CasosBienestarRow{}, false
	}
	total := len(sesIDs)
	efectivas := 0
	sinJustificar := 0
	justificadas := 0
	for _, sid := range sesIDs {
		if asistio[ap.AprendizID][sid] {
			efectivas++
			continue
		}
		if justificada[ap.AprendizID][sid] {
			justificadas++
		} else {
			sinJustificar++
		}
	}
	if sinJustificar < minFallas {
		return repositories.CasosBienestarRow{}, false
	}
	return repositories.CasosBienestarRow{
		AprendizID:                ap.AprendizID,
		PersonaNombre:             ap.PersonaNombre,
		NumeroDocumento:           ap.NumeroDocumento,
		FichaNumero:               ap.FichaNumero,
		ProgramaNombre:            ap.ProgramaNombre,
		SedeNombre:                ap.SedeNombre,
		JornadaNombre:             ap.JornadaNombre,
		InstructorNombre:          ap.InstructorNombre,
		AmbienteNombre:            ap.AmbienteNombre,
		ModalidadNombre:           ap.ModalidadNombre,
		TotalSesiones:             total,
		AsistenciasEfectivas:      efectivas,
		Inasistencias:             sinJustificar,
		InasistenciasJustificadas: justificadas,
	}, true
}

type casosBienestarRangoPreparado struct {
	validasPorFicha map[uint][]uint
	validaPorID     map[uint]repositories.SesionCasosBienestarRaw
	asistio         map[uint]map[uint]bool
	justificada     map[uint]map[uint]bool
}

func (c *CasosBienestarCalculator) prepararRango(
	sedeID *uint,
	fechaInicio, fechaFin string,
) (*casosBienestarRangoPreparado, error) {
	tInicio, err := time.Parse(time.DateOnly, fechaInicio)
	if err != nil {
		return nil, err
	}
	tFin, err := time.Parse(time.DateOnly, fechaFin)
	if err != nil {
		return nil, err
	}

	sesiones, err := c.repo.ListSesionesCasosBienestarEnRango(sedeID, fechaInicio, fechaFin)
	if err != nil {
		return nil, err
	}
	validas, err := c.filtrarSesionesValidas(sesiones, tInicio, tFin)
	if err != nil {
		return nil, err
	}

	validasPorFicha := make(map[uint][]uint)
	validaPorID := make(map[uint]repositories.SesionCasosBienestarRaw, len(validas))
	validaIDs := make([]uint, 0, len(validas))
	for _, s := range validas {
		validasPorFicha[s.FichaID] = append(validasPorFicha[s.FichaID], s.AsistenciaID)
		validaPorID[s.AsistenciaID] = s
		validaIDs = append(validaIDs, s.AsistenciaID)
	}

	asistencias, err := c.repo.ListAsistenciasEfectivasEnSesiones(validaIDs)
	if err != nil {
		return nil, err
	}
	justificadas, err := c.repo.ListInasistenciasJustificadasEnSesiones(validaIDs)
	if err != nil {
		return nil, err
	}

	return &casosBienestarRangoPreparado{
		validasPorFicha: validasPorFicha,
		validaPorID:     validaPorID,
		asistio:         mapAsistenciasEfectivas(asistencias),
		justificada:     mapInasistenciasJustificadas(justificadas),
	}, nil
}

func agruparDetalleSesionesPorAsistenciaID(
	rows []repositories.DetalleSesionCasosBienestarRaw,
) map[uint]repositories.DetalleSesionCasosBienestarRaw {
	out := make(map[uint]repositories.DetalleSesionCasosBienestarRaw, len(rows))
	for _, r := range rows {
		existing, ok := out[r.AsistenciaID]
		if !ok {
			out[r.AsistenciaID] = r
			continue
		}
		if r.AsistioEfectivo {
			existing.AsistioEfectivo = true
		}
		if r.Justificada {
			existing.Justificada = true
		}
		if strings.TrimSpace(r.Observaciones) != "" && strings.TrimSpace(existing.Observaciones) == "" {
			existing.Observaciones = r.Observaciones
		}
		if strings.TrimSpace(r.InstructorNombre) != "" && strings.TrimSpace(existing.InstructorNombre) == "" {
			existing.InstructorNombre = r.InstructorNombre
		}
		out[r.AsistenciaID] = existing
	}
	return out
}

func (c *CasosBienestarCalculator) Calcular(
	sedeID *uint,
	fechaInicio, fechaFin string,
	minFallas int,
) ([]repositories.CasosBienestarRow, error) {
	prep, err := c.prepararRango(sedeID, fechaInicio, fechaFin)
	if err != nil {
		return nil, err
	}

	aprendices, err := c.repo.ListAprendicesActivosCasosBienestar(sedeID)
	if err != nil {
		return nil, err
	}

	var out []repositories.CasosBienestarRow
	for _, ap := range aprendices {
		row, ok := inasistenciasAprendiz(ap, prep.validasPorFicha[ap.FichaID], prep.asistio, prep.justificada, minFallas)
		if ok {
			out = append(out, row)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Inasistencias != out[j].Inasistencias {
			return out[i].Inasistencias > out[j].Inasistencias
		}
		return out[i].AprendizID < out[j].AprendizID
	})
	return out, nil
}

func buildInasistenciaDetalleItem(
	prep *casosBienestarRangoPreparado,
	sid uint,
	metaPorID map[uint]repositories.DetalleSesionCasosBienestarRaw,
) repositories.InasistenciaDetalleRow {
	fecha := prep.validaPorID[sid].Fecha.Format(time.DateOnly)
	instructorNombre := ""
	observaciones := ""
	if meta, ok := metaPorID[sid]; ok {
		fecha = meta.Fecha.Format(time.DateOnly)
		instructorNombre = meta.InstructorNombre
		observaciones = meta.Observaciones
	}
	return repositories.InasistenciaDetalleRow{
		Fecha:            fecha,
		InstructorNombre: instructorNombre,
		Observaciones:    observaciones,
	}
}

func esInasistenciaJustificadaEnSesion(
	prep *casosBienestarRangoPreparado,
	aprendizID, sid uint,
	metaPorID map[uint]repositories.DetalleSesionCasosBienestarRaw,
) bool {
	if prep.justificada[aprendizID][sid] {
		return true
	}
	meta, ok := metaPorID[sid]
	return ok && meta.Justificada
}

func clasificarInasistenciasDetalle(
	prep *casosBienestarRangoPreparado,
	fichaID, aprendizID uint,
	metaPorID map[uint]repositories.DetalleSesionCasosBienestarRaw,
) (sinJustificar, justificadas []repositories.InasistenciaDetalleRow) {
	for _, sid := range prep.validasPorFicha[fichaID] {
		if prep.asistio[aprendizID][sid] {
			continue
		}
		item := buildInasistenciaDetalleItem(prep, sid, metaPorID)
		if esInasistenciaJustificadaEnSesion(prep, aprendizID, sid, metaPorID) {
			justificadas = append(justificadas, item)
			continue
		}
		sinJustificar = append(sinJustificar, item)
	}
	return sinJustificar, justificadas
}

func ordenarInasistenciasDetallePorFechaDesc(rows []repositories.InasistenciaDetalleRow) {
	sort.Slice(rows, func(i, j int) bool {
		return rows[i].Fecha > rows[j].Fecha
	})
}

func (c *CasosBienestarCalculator) CalcularDetalle(
	fichaNumero string,
	aprendizID uint,
	fechaInicio, fechaFin string,
	sedeNombre string,
) (sinJustificar, justificadas []repositories.InasistenciaDetalleRow, err error) {
	fichaNumero = strings.TrimSpace(fichaNumero)
	if fichaNumero == "" || aprendizID == 0 {
		return nil, nil, errors.New("ficha y aprendiz son requeridos")
	}

	prep, err := c.prepararRango(nil, fechaInicio, fechaFin)
	if err != nil {
		return nil, nil, err
	}

	ficha, err := c.fichaRepo.FindByFicha(fichaNumero)
	if err != nil || ficha == nil {
		return nil, nil, fmt.Errorf("ficha no encontrada")
	}

	metaRows, err := c.repo.ListDetalleSesionesCasosBienestar(fichaNumero, aprendizID, fechaInicio, fechaFin, strings.TrimSpace(sedeNombre))
	if err != nil {
		return nil, nil, err
	}
	metaPorID := agruparDetalleSesionesPorAsistenciaID(metaRows)
	sinJustificar, justificadas = clasificarInasistenciasDetalle(prep, ficha.ID, aprendizID, metaPorID)
	ordenarInasistenciasDetallePorFechaDesc(sinJustificar)
	ordenarInasistenciasDetallePorFechaDesc(justificadas)
	return sinJustificar, justificadas, nil
}

func (c *CasosBienestarCalculator) ListSesionesSinAsistenciaTomada(
	sedeIDs []uint,
	fechaInicio, fechaFin string,
) ([]repositories.SesionSinAsistenciaTomadaRow, error) {
	tInicio, err := time.Parse(time.DateOnly, fechaInicio)
	if err != nil {
		return nil, err
	}
	tFin, err := time.Parse(time.DateOnly, fechaFin)
	if err != nil {
		return nil, err
	}

	sesionesVacias, err := c.listarSesionesAbiertasSinMarcas(sedeIDs, tInicio, tFin, fechaInicio, fechaFin)
	if err != nil {
		return nil, err
	}
	diasSinSesion, err := c.listarDiasFormacionSinSesionAbierta(sedeIDs, tInicio, tFin, fechaInicio, fechaFin)
	if err != nil {
		return nil, err
	}

	out := append(sesionesVacias, diasSinSesion...)
	ordenarIncumplimientosAsistencia(out)
	return out, nil
}

func (c *CasosBienestarCalculator) listarSesionesAbiertasSinMarcas(
	sedeIDs []uint,
	tInicio, tFin time.Time,
	fechaInicio, fechaFin string,
) ([]repositories.SesionSinAsistenciaTomadaRow, error) {
	sesiones, err := c.repo.ListSesionesSinAsistenciaTomadaEnRango(sedeIDs, fechaInicio, fechaFin)
	if err != nil {
		return nil, err
	}
	if len(sesiones) == 0 {
		return nil, nil
	}

	rawCalendario := make([]repositories.SesionCasosBienestarRaw, len(sesiones))
	for i, s := range sesiones {
		rawCalendario[i] = repositories.SesionCasosBienestarRaw{
			AsistenciaID: s.AsistenciaID,
			FichaID:      s.FichaID,
			InstructorID: s.InstructorID,
			SedeID:       s.SedeID,
			Fecha:        s.Fecha,
		}
	}
	validas, err := c.filtrarSesionesValidas(rawCalendario, tInicio, tFin)
	if err != nil {
		return nil, err
	}
	validaSet := make(map[uint]struct{}, len(validas))
	for _, s := range validas {
		validaSet[s.AsistenciaID] = struct{}{}
	}

	var out []repositories.SesionSinAsistenciaTomadaRow
	for _, s := range sesiones {
		if _, ok := validaSet[s.AsistenciaID]; ok {
			out = append(out, s)
		}
	}
	return out, nil
}
