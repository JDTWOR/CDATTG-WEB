package services

import (
	"sort"
	"time"

	"github.com/sena/cdattg-web-golang/repositories"
)

// CasosBienestarCalculator calcula inasistencias usando calendario de formación válido.
type CasosBienestarCalculator struct {
	repo       repositories.AsistenciaRepository
	calendario *CalendarioFormacionService
}

func NewCasosBienestarCalculator() *CasosBienestarCalculator {
	return &CasosBienestarCalculator{
		repo:       repositories.NewAsistenciaRepository(),
		calendario: NewCalendarioFormacionService(),
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

func sedeIDsFromDetalleSesiones(sesiones []repositories.DetalleSesionCasosBienestarRaw) []uint {
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

func inasistenciasAprendiz(
	ap repositories.AprendizCasosBienestarRaw,
	sesIDs []uint,
	asistio map[uint]map[uint]bool,
	minFallas int,
) (repositories.CasosBienestarRow, bool) {
	if len(sesIDs) == 0 {
		return repositories.CasosBienestarRow{}, false
	}
	total := len(sesIDs)
	efectivas := 0
	for _, sid := range sesIDs {
		if asistio[ap.AprendizID][sid] {
			efectivas++
		}
	}
	inasistencias := total - efectivas
	if inasistencias < minFallas {
		return repositories.CasosBienestarRow{}, false
	}
	return repositories.CasosBienestarRow{
		AprendizID:           ap.AprendizID,
		PersonaNombre:        ap.PersonaNombre,
		NumeroDocumento:      ap.NumeroDocumento,
		FichaNumero:          ap.FichaNumero,
		ProgramaNombre:       ap.ProgramaNombre,
		SedeNombre:           ap.SedeNombre,
		JornadaNombre:        ap.JornadaNombre,
		InstructorNombre:     ap.InstructorNombre,
		AmbienteNombre:       ap.AmbienteNombre,
		ModalidadNombre:      ap.ModalidadNombre,
		TotalSesiones:        total,
		AsistenciasEfectivas: efectivas,
		Inasistencias:        inasistencias,
	}, true
}

func (c *CasosBienestarCalculator) Calcular(
	sedeID *uint,
	fechaInicio, fechaFin string,
	minFallas int,
) ([]repositories.CasosBienestarRow, error) {
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
	validaIDs := make([]uint, 0, len(validas))
	for _, s := range validas {
		validasPorFicha[s.FichaID] = append(validasPorFicha[s.FichaID], s.AsistenciaID)
		validaIDs = append(validaIDs, s.AsistenciaID)
	}

	asistencias, err := c.repo.ListAsistenciasEfectivasEnSesiones(validaIDs)
	if err != nil {
		return nil, err
	}
	asistio := mapAsistenciasEfectivas(asistencias)

	aprendices, err := c.repo.ListAprendicesActivosCasosBienestar(sedeID)
	if err != nil {
		return nil, err
	}

	var out []repositories.CasosBienestarRow
	for _, ap := range aprendices {
		row, ok := inasistenciasAprendiz(ap, validasPorFicha[ap.FichaID], asistio, minFallas)
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

func (c *CasosBienestarCalculator) CalcularDetalle(
	fichaNumero string,
	aprendizID uint,
	fechaInicio, fechaFin string,
	sedeNombre string,
) ([]repositories.InasistenciaDetalleRow, error) {
	tInicio, err := time.Parse(time.DateOnly, fechaInicio)
	if err != nil {
		return nil, err
	}
	tFin, err := time.Parse(time.DateOnly, fechaFin)
	if err != nil {
		return nil, err
	}

	sesiones, err := c.repo.ListDetalleSesionesCasosBienestar(fichaNumero, aprendizID, fechaInicio, fechaFin, sedeNombre)
	if err != nil {
		return nil, err
	}
	if err := c.precargarCalendario(tInicio, tFin, sedeIDsFromDetalleSesiones(sesiones)); err != nil {
		return nil, err
	}

	var out []repositories.InasistenciaDetalleRow
	for _, s := range sesiones {
		if !c.calendario.EsSesionFormacionValida(s.FichaID, s.InstructorID, s.Fecha) {
			continue
		}
		if s.AsistioEfectivo {
			continue
		}
		out = append(out, repositories.InasistenciaDetalleRow{
			Fecha:            s.Fecha.Format(time.DateOnly),
			InstructorNombre: s.InstructorNombre,
			Observaciones:    s.Observaciones,
		})
	}
	return out, nil
}
