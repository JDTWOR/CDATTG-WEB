package services

import (
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/config"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

type dashboardEsperadosCalc struct {
	TotalEsperados  int
	JornadasActivas []string
	FichasEsperadas []models.FichaCaracterizacion
	ConteoPorFicha  map[uint]int
}

const maxFichasSinSesionListado = 50

func filtrarFichasConFormacionEnFecha(
	fichas []models.FichaCaracterizacion,
	fecha time.Time,
	calendario *CalendarioFormacionService,
) []models.FichaCaracterizacion {
	if len(fichas) == 0 {
		return fichas
	}
	horarioSvc := NewInstructorHorarioService()
	diaID := WeekdayToDiaFormacionID(fecha.Weekday())
	out := make([]models.FichaCaracterizacion, 0, len(fichas))
	for i := range fichas {
		f := fichas[i]
		if calendario.EsDiaFestivoColombia(fecha) {
			continue
		}
		if f.SedeID != nil && *f.SedeID > 0 && calendario.EsDiaSinFormacionSede(*f.SedeID, fecha) {
			continue
		}
		if len(horarioSvc.bloquesDiaFicha(&f, diaID)) == 0 {
			continue
		}
		out = append(out, f)
	}
	return out
}

func dashboardLoadLocation() *time.Location {
	loc, err := time.LoadLocation(config.AppConfig.Database.TimeZone)
	if err != nil {
		return time.Local
	}
	return loc
}

func esFechaDashboardHoy(fecha string, loc *time.Location) bool {
	now := time.Now().In(loc)
	t, err := time.ParseInLocation(time.DateOnly, fecha, loc)
	if err != nil {
		return true
	}
	return t.Year() == now.Year() && t.Month() == now.Month() && t.Day() == now.Day()
}

// filtrarFichasEsperadasDashboard deja fichas con formación en la fecha; si esHoy, solo jornada en curso.
func filtrarFichasEsperadasDashboard(fichas []models.FichaCaracterizacion, refTime time.Time, esHoy bool) (filtered []models.FichaCaracterizacion, jornadasActivas []string) {
	jornadaSet := make(map[string]struct{})
	for i := range fichas {
		f := fichas[i]
		if esHoy && !ValidarHorarioJornadaModelAt(f.Jornada, refTime) {
			continue
		}
		filtered = append(filtered, f)
		if f.Jornada != nil && strings.TrimSpace(f.Jornada.Nombre) != "" {
			jornadaSet[f.Jornada.Nombre] = struct{}{}
		}
	}
	jornadasActivas = make([]string, 0, len(jornadaSet))
	for nombre := range jornadaSet {
		jornadasActivas = append(jornadasActivas, nombre)
	}
	sort.Strings(jornadasActivas)
	return filtered, jornadasActivas
}

func calcularDashboardEsperados(
	fichaRepo repositories.FichaRepository,
	aprendizRepo repositories.AprendizRepository,
	sedeID *uint,
	fecha string,
	filtrarPorHorarioJornada bool,
) (*dashboardEsperadosCalc, error) {
	sedeIDs := sedeIDsFromSingle(sedeID)
	return calcularDashboardEsperadosSedes(fichaRepo, aprendizRepo, sedeIDs, fecha, filtrarPorHorarioJornada)
}

func sedeIDsFromSingle(sedeID *uint) []uint {
	if sedeID != nil && *sedeID > 0 {
		return []uint{*sedeID}
	}
	return nil
}

func calcularDashboardEsperadosSedes(
	fichaRepo repositories.FichaRepository,
	aprendizRepo repositories.AprendizRepository,
	sedeIDs []uint,
	fecha string,
	filtrarPorHorarioJornada bool,
) (*dashboardEsperadosCalc, error) {
	loc := dashboardLoadLocation()
	refTime := time.Now().In(loc)
	fechaConsulta, err := time.ParseInLocation(time.DateOnly, fecha, loc)
	if err != nil {
		fechaConsulta = refTime
	}
	esHoy := esFechaDashboardHoy(fecha, loc)

	var sedeID *uint
	if len(sedeIDs) == 1 {
		sedeID = &sedeIDs[0]
	}
	fichas, err := fichaRepo.FindActivasParaFechaConJornada(fechaConsulta, sedeID)
	if err != nil {
		return nil, err
	}
	if len(sedeIDs) > 1 {
		fichas = filtrarFichasPorSedes(fichas, sedeIDs)
	}

	calendario := NewCalendarioFormacionService()
	fichas = filtrarFichasConFormacionEnFecha(fichas, fechaConsulta, calendario)

	filtered, jornadas := filtrarFichasEsperadasDashboard(fichas, refTime, esHoy && filtrarPorHorarioJornada)
	ids := make([]uint, len(filtered))
	for i := range filtered {
		ids[i] = filtered[i].ID
	}
	conteo, err := aprendizRepo.CountActivosByFichaIDs(ids)
	if err != nil {
		return nil, err
	}

	total := 0
	for _, n := range conteo {
		total += n
	}

	return &dashboardEsperadosCalc{
		TotalEsperados:  total,
		JornadasActivas: jornadas,
		FichasEsperadas: filtered,
		ConteoPorFicha:  conteo,
	}, nil
}

func fichaToSinSesionDTO(f models.FichaCaracterizacion, totalAprendices int) dto.AsistenciaDashboardFichaSinSesion {
	return dto.AsistenciaDashboardFichaSinSesion{
		FichaID:         f.ID,
		FichaNumero:     f.Ficha,
		ProgramaNombre:  nombreProgramaFicha(f),
		JornadaNombre:   nombreJornadaFicha(f),
		SedeNombre:      nombreSedeFicha(f),
		TotalAprendices: totalAprendices,
	}
}

func nombreProgramaFicha(f models.FichaCaracterizacion) string {
	if f.ProgramaFormacion == nil {
		return ""
	}
	return f.ProgramaFormacion.Nombre
}

func nombreJornadaFicha(f models.FichaCaracterizacion) string {
	if f.Jornada == nil {
		return ""
	}
	return f.Jornada.Nombre
}

func nombreSedeFicha(f models.FichaCaracterizacion) string {
	if f.Sede == nil {
		return ""
	}
	return f.Sede.Nombre
}

// filtrarPorFichaEsperadas deja solo fichas del resumen que están en el alcance esperado
// (formación hoy + jornada activa si es el día en curso). Alinea card, tabla y denominador.
func filtrarPorFichaEsperadas(
	porFicha []repositories.DashboardFichaRow,
	esperados *dashboardEsperadosCalc,
) (filtered []repositories.DashboardFichaRow, totalVinieron int) {
	if esperados == nil || len(esperados.FichasEsperadas) == 0 {
		return []repositories.DashboardFichaRow{}, 0
	}
	ids := make(map[uint]struct{}, len(esperados.FichasEsperadas))
	for i := range esperados.FichasEsperadas {
		ids[esperados.FichasEsperadas[i].ID] = struct{}{}
	}
	filtered = make([]repositories.DashboardFichaRow, 0, len(porFicha))
	for i := range porFicha {
		if _, ok := ids[porFicha[i].FichaID]; !ok {
			continue
		}
		filtered = append(filtered, porFicha[i])
		totalVinieron += porFicha[i].CantidadEnFormacion
	}
	return filtered, totalVinieron
}

func fichaTieneSesionHoy(repo repositories.AsistenciaRepository, fichaID uint, fecha string) (bool, error) {
	ids, err := repo.FindIDsByFichaIDAndFecha(fichaID, fecha)
	if err != nil {
		return false, err
	}
	return len(ids) > 0, nil
}

func sinSesionDTOFromFicha(
	f models.FichaCaracterizacion,
	conteo map[uint]int,
	fecha string,
	resolver *InstructorResponsableResolver,
) dto.AsistenciaDashboardFichaSinSesion {
	item := fichaToSinSesionDTO(f, conteo[f.ID])
	if resolver == nil {
		return item
	}
	nombre, instID := resolver.NombresParaFicha(f, fecha)
	item.InstructorNombre = nombre
	item.InstructorID = instID
	return item
}

func buildFichasSinSesionEsperadasWithResolver(
	esperados *dashboardEsperadosCalc,
	repo repositories.AsistenciaRepository,
	fecha string,
	resolver *InstructorResponsableResolver,
) ([]dto.AsistenciaDashboardFichaSinSesion, error) {
	if esperados == nil || len(esperados.FichasEsperadas) == 0 {
		return []dto.AsistenciaDashboardFichaSinSesion{}, nil
	}
	out := make([]dto.AsistenciaDashboardFichaSinSesion, 0)
	for i := range esperados.FichasEsperadas {
		f := esperados.FichasEsperadas[i]
		tieneSesion, err := fichaTieneSesionHoy(repo, f.ID, fecha)
		if err != nil {
			return nil, err
		}
		if tieneSesion {
			continue
		}
		out = append(out, sinSesionDTOFromFicha(f, esperados.ConteoPorFicha, fecha, resolver))
	}
	sort.Slice(out, func(i, j int) bool {
		return out[i].FichaNumero < out[j].FichaNumero
	})
	if len(out) > maxFichasSinSesionListado {
		out = out[:maxFichasSinSesionListado]
	}
	return out, nil
}

const dashboardDiasFormacionHistorial = 7

var diasSemanaCorto = []string{"Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"}

func etiquetaDiaFormacionChart(t time.Time, loc *time.Location) string {
	local := t.In(loc)
	return fmt.Sprintf("%s %02d/%02d", diasSemanaCorto[int(local.Weekday())], local.Day(), int(local.Month()))
}

func sumVinieronPorFicha(rows []repositories.DashboardFichaRow) int {
	total := 0
	for i := range rows {
		total += rows[i].CantidadVinieron
	}
	return total
}

// buildUltimosDiasFormacion devuelve hasta 7 días con formación programada hacia atrás desde fechaRef.
func buildUltimosDiasFormacion(
	asistRepo repositories.AsistenciaRepository,
	fichaRepo repositories.FichaRepository,
	aprendizRepo repositories.AprendizRepository,
	sedeIDs []uint,
	fechaRef string,
) ([]dto.DashboardDiaFormacionStats, error) {
	loc := dashboardLoadLocation()
	ref, err := time.ParseInLocation(time.DateOnly, fechaRef, loc)
	if err != nil {
		ref = time.Now().In(loc)
	}
	var singleSede *uint
	if len(sedeIDs) == 1 {
		singleSede = &sedeIDs[0]
	}

	collected := make([]dto.DashboardDiaFormacionStats, 0, dashboardDiasFormacionHistorial)
	day := ref
	for attempts := 0; len(collected) < dashboardDiasFormacionHistorial && attempts < 90; attempts++ {
		dayStr := day.Format(time.DateOnly)
		formacionDia, errForm := calcularDashboardEsperadosSedes(fichaRepo, aprendizRepo, sedeIDs, dayStr, false)
		if errForm != nil {
			return nil, errForm
		}
		if formacionDia != nil && formacionDia.TotalEsperados > 0 {
			_, porFichaRaw, errDash := getDashboardResumenScoped(asistRepo, singleSede, sedeIDs, dayStr)
			if errDash != nil {
				return nil, errDash
			}
			porFicha, _ := filtrarPorFichaEsperadas(porFichaRaw, formacionDia)
			vinieron := sumVinieronPorFicha(porFicha)
			collected = append(collected, dto.DashboardDiaFormacionStats{
				Fecha:     dayStr,
				Etiqueta:  etiquetaDiaFormacionChart(day, loc),
				Esperados: formacionDia.TotalEsperados,
				Vinieron:  vinieron,
				Pct:       dashboardPctVinieron(vinieron, formacionDia.TotalEsperados),
			})
		}
		day = day.AddDate(0, 0, -1)
	}
	// Orden cronológico (más antiguo primero)
	for i, j := 0, len(collected)-1; i < j; i, j = i+1, j-1 {
		collected[i], collected[j] = collected[j], collected[i]
	}
	return collected, nil
}

func dashboardPctVinieron(vinieron, esperados int) float64 {
	if esperados <= 0 {
		return 0
	}
	return math.Round(float64(vinieron)/float64(esperados)*1000) / 10
}
