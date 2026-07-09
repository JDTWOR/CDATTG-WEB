package services

import (
	"math"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/sena/cdattg-web-golang/utils"
)

type cumplimientoDiasResult struct {
	programados int
	conSesion   int
	detalle     []dto.AnalisisCumplimientoDia
	resumen     dto.AnalisisCumplimientoResumen
}

type semanaDiaResult struct {
	filas   []dto.AnalisisDiaSemanaFila
	ranking *dto.AnalisisDiaRanking
}

// fichaSesionesAgrupadas fuente única de conteo de sesiones (bloques A y B).
type fichaSesionesAgrupadas struct {
	numero        string
	programa      string
	jornada       string
	totalSesiones int
	fechas        map[string]struct{}
	minutos       []int
}

func agruparSesionesPorFicha(rows []repositories.SesionDetalleRow, loc *time.Location) map[uint]*fichaSesionesAgrupadas {
	out := make(map[uint]*fichaSesionesAgrupadas)
	for i := range rows {
		row := &rows[i]
		entry := out[row.FichaID]
		if entry == nil {
			entry = &fichaSesionesAgrupadas{
				numero:  row.FichaNumero,
				programa: row.ProgramaNombre,
				jornada: row.JornadaNombre,
				fechas:  make(map[string]struct{}),
			}
			out[row.FichaID] = entry
		}
		entry.totalSesiones++
		fechaKey := row.Fecha.In(loc).Format(time.DateOnly)
		entry.fechas[fechaKey] = struct{}{}
		if row.PrimeraHora != nil {
			local := row.PrimeraHora.In(loc)
			entry.minutos = append(entry.minutos, local.Hour()*60+local.Minute())
		}
	}
	return out
}

func fechasSesionFicha(agrupado map[uint]*fichaSesionesAgrupadas, fichaID uint) map[string]struct{} {
	entry := agrupado[fichaID]
	if entry == nil {
		return map[string]struct{}{}
	}
	out := make(map[string]struct{}, len(entry.fechas))
	for k := range entry.fechas {
		out[k] = struct{}{}
	}
	return out
}

// enriquecerHoraTomaConCumplimiento alinea «días con sesión» del bloque A con «con sesión» del bloque B.
func enriquecerHoraTomaConCumplimiento(hora *dto.AnalisisHoraTomaSection, cumpl dto.AnalisisCumplimientoSection) {
	porFicha := make(map[uint]int, len(cumpl.Items))
	for i := range cumpl.Items {
		porFicha[cumpl.Items[i].FichaID] = cumpl.Items[i].DiasConSesion
	}
	total := 0
	for i := range hora.DetallePorFicha {
		if d, ok := porFicha[hora.DetallePorFicha[i].FichaID]; ok {
			hora.DetallePorFicha[i].DiasConSesion = d
			total += d
		}
	}
	hora.TotalDiasConSesion = total
}

func filtrarFichasPorID(fichas []models.FichaCaracterizacion, fichaID *uint) []models.FichaCaracterizacion {
	if fichaID == nil || *fichaID == 0 {
		return fichas
	}
	for i := range fichas {
		if fichas[i].ID == *fichaID {
			return []models.FichaCaracterizacion{fichas[i]}
		}
	}
	return nil
}

func sedeIDUnica(sedeIDs []uint) *uint {
	if len(sedeIDs) != 1 {
		return nil
	}
	return &sedeIDs[0]
}

func fichaPasaFiltrosAnalisis(
	f *models.FichaCaracterizacion,
	d time.Time,
	fichaID *uint,
	jornada string,
	s *asistenciaAnalisisService,
) bool {
	if fichaID != nil && *fichaID > 0 && f.ID != *fichaID {
		return false
	}
	if jornada != "" && (f.Jornada == nil || f.Jornada.Nombre != jornada) {
		return false
	}
	return s.fichaTieneFormacionEnDia(f, d)
}

func nombresFichaCumplimiento(f *models.FichaCaracterizacion) (programa, jornada, sede string) {
	if f.ProgramaFormacion != nil {
		programa = f.ProgramaFormacion.Nombre
	}
	if f.Jornada != nil {
		jornada = f.Jornada.Nombre
	}
	if f.Sede != nil {
		sede = f.Sede.Nombre
	}
	return programa, jornada, sede
}

func actualizarResumenCumplimientoDia(resumen *dto.AnalisisCumplimientoResumen, programado, tieneSesion bool) {
	switch {
	case programado && tieneSesion:
		resumen.DiasCumplidos++
	case programado && !tieneSesion:
		resumen.DiasSinToma++
	case !programado && tieneSesion:
		resumen.SesionesFueraProgramacion++
	}
}

func entradaCumplimientoDia(d time.Time, loc *time.Location, programado, tieneSesion bool) dto.AnalisisCumplimientoDia {
	diaID := int(WeekdayToDiaFormacionID(d.Weekday()))
	return dto.AnalisisCumplimientoDia{
		Fecha:       d.In(loc).Format(time.DateOnly),
		DiaSemana:   nombresDiaSemana[diaID],
		Programado:  programado,
		TieneSesion: tieneSesion,
	}
}

func (s *asistenciaAnalisisService) acumularDiaCumplimiento(
	f *models.FichaCaracterizacion,
	d time.Time,
	loc *time.Location,
	sesiones map[string]struct{},
	out *cumplimientoDiasResult,
) {
	key := d.In(loc).Format(time.DateOnly)
	programado := s.fichaTieneFormacionEnDia(f, d)
	_, tieneSesion := sesiones[key]
	if programado || tieneSesion {
		out.detalle = append(out.detalle, entradaCumplimientoDia(d, loc, programado, tieneSesion))
		actualizarResumenCumplimientoDia(&out.resumen, programado, tieneSesion)
	}
	if !programado {
		return
	}
	out.programados++
	if tieneSesion {
		out.conSesion++
	}
}

func (s *asistenciaAnalisisService) calcularCumplimientoDias(
	f *models.FichaCaracterizacion,
	start, end time.Time,
	sesiones map[string]struct{},
) cumplimientoDiasResult {
	loc := utils.AppLocation()
	out := cumplimientoDiasResult{detalle: make([]dto.AnalisisCumplimientoDia, 0)}
	for d := start; !d.After(end); d = d.AddDate(0, 0, 1) {
		s.acumularDiaCumplimiento(f, d, loc, sesiones, &out)
	}
	return out
}

func (s *asistenciaAnalisisService) itemCumplimientoFicha(
	f *models.FichaCaracterizacion,
	desde, hasta time.Time,
	sesiones map[string]struct{},
	totalSesiones int,
) (*dto.AnalisisCumplimientoFicha, error) {
	start, end := rangoDiasFichaEnConsulta(f, desde, hasta)
	if end.Before(start) {
		return nil, nil
	}
	dias := s.calcularCumplimientoDias(f, start, end, sesiones)
	if dias.programados == 0 {
		return nil, nil
	}
	prog, jornada, sede := nombresFichaCumplimiento(f)
	pct := math.Round(float64(dias.conSesion)/float64(dias.programados)*1000) / 10
	return &dto.AnalisisCumplimientoFicha{
		FichaID:         f.ID,
		FichaNumero:     f.Ficha,
		ProgramaNombre:  prog,
		JornadaNombre:   jornada,
		SedeNombre:      sede,
		DiasProgramados: dias.programados,
		DiasConSesion:   dias.conSesion,
		TotalSesiones:   totalSesiones,
		PctCumplimiento: pct,
		ResumenDetalle:  dias.resumen,
		DetalleDias:     dias.detalle,
	}, nil
}

func mapVinieronPorFicha(rows []repositories.DashboardFichaRow) map[uint]int {
	out := make(map[uint]int, len(rows))
	for _, row := range rows {
		out[row.FichaID] = row.CantidadVinieron
	}
	return out
}

func agregarPorJornadaSemana(
	fichas []models.FichaCaracterizacion,
	d time.Time,
	fichaID *uint,
	jornada string,
	s *asistenciaAnalisisService,
	visibles map[uint]int,
	vinieron map[uint]int,
) map[string]struct{ esperados, vinieron int } {
	agg := make(map[string]struct{ esperados, vinieron int })
	for i := range fichas {
		f := &fichas[i]
		if !fichaPasaFiltrosAnalisis(f, d, fichaID, jornada, s) {
			continue
		}
		esp := visibles[f.ID]
		if esp == 0 {
			continue
		}
		jornadaNombre := ""
		if f.Jornada != nil {
			jornadaNombre = f.Jornada.Nombre
		}
		entry := agg[jornadaNombre]
		entry.esperados += esp
		entry.vinieron += vinieron[f.ID]
		agg[jornadaNombre] = entry
	}
	return agg
}

func filasDesdeAggSemana(fechaStr string, diaID int, agg map[string]struct{ esperados, vinieron int }) (filas []dto.AnalisisDiaSemanaFila, esperados, vinieron int) {
	filas = make([]dto.AnalisisDiaSemanaFila, 0, len(agg))
	for jornadaNombre, v := range agg {
		pct := 0.0
		if v.esperados > 0 {
			pct = math.Round(float64(v.vinieron)/float64(v.esperados)*1000) / 10
		}
		filas = append(filas, dto.AnalisisDiaSemanaFila{
			Fecha:         fechaStr,
			DiaSemanaID:   diaID,
			DiaSemana:     nombresDiaSemana[diaID],
			JornadaNombre: jornadaNombre,
			Esperados:     v.esperados,
			Vinieron:      v.vinieron,
			Pct:           pct,
		})
		esperados += v.esperados
		vinieron += v.vinieron
	}
	return filas, esperados, vinieron
}

func (s *asistenciaAnalisisService) procesarDiaSemanaAnterior(
	d time.Time,
	sedeIDs []uint,
	jornada string,
	fichaID *uint,
) (semanaDiaResult, error) {
	diaID := int(WeekdayToDiaFormacionID(d.Weekday()))
	fechaStr := d.Format(time.DateOnly)

	fichas, err := s.fichaRepo.FindActivasParaFechaConJornada(d, sedeIDUnica(sedeIDs))
	if err != nil {
		return semanaDiaResult{}, err
	}
	fichas = filtrarFichasPorSedes(fichas, sedeIDs)

	fichaIDs := make([]uint, 0, len(fichas))
	for i := range fichas {
		if fichaPasaFiltrosAnalisis(&fichas[i], d, fichaID, jornada, s) {
			fichaIDs = append(fichaIDs, fichas[i].ID)
		}
	}
	if len(fichaIDs) == 0 {
		return semanaDiaResult{}, nil
	}

	visibles, err := s.aprendizRepo.CountVisiblesAsistenciaByFichaIDs(fichaIDs)
	if err != nil {
		return semanaDiaResult{}, err
	}
	_, porFichaDia, err := s.asistRepo.GetDashboardResumen(sedeIDUnica(sedeIDs), fechaStr)
	if err != nil {
		return semanaDiaResult{}, err
	}

	agg := agregarPorJornadaSemana(fichas, d, fichaID, jornada, s, visibles, mapVinieronPorFicha(porFichaDia))
	filas, diaEsp, diaVin := filasDesdeAggSemana(fechaStr, diaID, agg)
	if diaEsp == 0 {
		return semanaDiaResult{filas: filas}, nil
	}
	pctDia := math.Round(float64(diaVin)/float64(diaEsp)*1000) / 10
	return semanaDiaResult{
		filas: filas,
		ranking: &dto.AnalisisDiaRanking{
			Fecha:       fechaStr,
			DiaSemanaID: diaID,
			DiaSemana:   nombresDiaSemana[diaID],
			Vinieron:    diaVin,
			Pct:         pctDia,
		},
	}, nil
}
