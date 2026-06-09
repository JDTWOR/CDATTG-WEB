package services

import (
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
) (*dashboardEsperadosCalc, error) {
	loc := dashboardLoadLocation()
	refTime := time.Now().In(loc)
	fechaConsulta, err := time.ParseInLocation(time.DateOnly, fecha, loc)
	if err != nil {
		fechaConsulta = refTime
	}
	esHoy := esFechaDashboardHoy(fecha, loc)

	fichas, err := fichaRepo.FindActivasParaFechaConJornada(fechaConsulta, sedeID)
	if err != nil {
		return nil, err
	}

	filtered, jornadas := filtrarFichasEsperadasDashboard(fichas, refTime, esHoy)
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
	programa := ""
	if f.ProgramaFormacion != nil {
		programa = f.ProgramaFormacion.Nombre
	}
	jornada := ""
	if f.Jornada != nil {
		jornada = f.Jornada.Nombre
	}
	sede := ""
	if f.Sede != nil {
		sede = f.Sede.Nombre
	}
	return dto.AsistenciaDashboardFichaSinSesion{
		FichaID:         f.ID,
		FichaNumero:     f.Ficha,
		ProgramaNombre:  programa,
		JornadaNombre:   jornada,
		SedeNombre:      sede,
		TotalAprendices: totalAprendices,
	}
}

func buildFichasSinSesionEsperadas(
	esperados *dashboardEsperadosCalc,
	repo repositories.AsistenciaRepository,
	fecha string,
) ([]dto.AsistenciaDashboardFichaSinSesion, error) {
	if esperados == nil || len(esperados.FichasEsperadas) == 0 {
		return []dto.AsistenciaDashboardFichaSinSesion{}, nil
	}
	out := make([]dto.AsistenciaDashboardFichaSinSesion, 0)
	for i := range esperados.FichasEsperadas {
		f := esperados.FichasEsperadas[i]
		ids, err := repo.FindIDsByFichaIDAndFecha(f.ID, fecha)
		if err != nil {
			return nil, err
		}
		if len(ids) > 0 {
			continue
		}
		out = append(out, fichaToSinSesionDTO(f, esperados.ConteoPorFicha[f.ID]))
	}
	sort.Slice(out, func(i, j int) bool {
		return out[i].FichaNumero < out[j].FichaNumero
	})
	return out, nil
}
