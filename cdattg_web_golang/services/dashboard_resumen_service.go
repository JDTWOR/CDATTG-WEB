package services

import (
	"math"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/repositories"
)

type DashboardResumenService interface {
	GetResumen(userID uint, roles []string, fecha string, regionalID, sedeID *uint) (*dto.DashboardResumenResponse, error)
}

type dashboardResumenService struct {
	scopeSvc     DashboardScopeService
	asistenciaSvc AsistenciaService
	fichaRepo    repositories.FichaRepository
	aprendizRepo repositories.AprendizRepository
	asistRepo    repositories.AsistenciaRepository
	catalogoRepo repositories.CatalogoRepository
	instructorRepo repositories.InstructorRepository
	calendario   *CalendarioFormacionService
}

func NewDashboardResumenService() DashboardResumenService {
	calendario := NewCalendarioFormacionService()
	return &dashboardResumenService{
		scopeSvc:       NewDashboardScopeService(),
		asistenciaSvc:  NewAsistenciaService(),
		fichaRepo:      repositories.NewFichaRepository(),
		aprendizRepo:   repositories.NewAprendizRepository(),
		asistRepo:      repositories.NewAsistenciaRepository(),
		catalogoRepo:   repositories.NewCatalogoRepository(),
		instructorRepo: repositories.NewInstructorRepository(),
		calendario:     calendario,
	}
}

func (s *dashboardResumenService) GetResumen(userID uint, roles []string, fecha string, regionalID, sedeID *uint) (*dto.DashboardResumenResponse, error) {
	if strings.TrimSpace(fecha) == "" {
		loc := dashboardLoadLocation()
		fecha = time.Now().In(loc).Format(time.DateOnly)
	}
	scope, err := s.scopeSvc.Resolve(userID, roles)
	if err != nil {
		return nil, err
	}
	sedeIDs, empty := s.scopeSvc.ResolveEffectiveSedes(scope, regionalID, sedeID)
	resp := newDashboardResumenResponse(fecha, scope, empty)
	if empty || (scope != nil && scope.Empty) {
		return resp, nil
	}
	return s.fillDashboardResumen(resp, sedeIDs, scope, fecha)
}

func newDashboardResumenResponse(fecha string, scope *DashboardScope, empty bool) *dto.DashboardResumenResponse {
	resp := &dto.DashboardResumenResponse{
		Fecha: fecha,
		Alcance: dto.DashboardAlcance{
			Restricted:      scope != nil && scope.Restricted,
			Empty:           empty || (scope != nil && scope.Empty),
			RegionalIDs:     nil,
			RegionalNombres: nil,
		},
		FichasSinSesion:     []dto.AsistenciaDashboardFichaSinSesion{},
		PorSede:             []dto.DashboardSedeStats{},
		PorJornada:          []dto.DashboardJornadaStats{},
		PorRegional:         []dto.DashboardRegionalStats{},
		PorFicha:             []dto.AsistenciaDashboardPorFicha{},
		UltimosDiasFormacion: []dto.DashboardDiaFormacionStats{},
		JornadasActivas:      []string{},
		JornadasDisponibles:  []string{},
	}
	if scope != nil {
		resp.Alcance.RegionalIDs = scope.RegionalIDs
		resp.Alcance.RegionalNombres = scope.RegionalNames
	}
	return resp
}

func (s *dashboardResumenService) fillDashboardResumen(
	resp *dto.DashboardResumenResponse,
	sedeIDs []uint,
	scope *DashboardScope,
	fecha string,
) (*dto.DashboardResumenResponse, error) {
	var singleSede *uint
	if len(sedeIDs) == 1 {
		singleSede = &sedeIDs[0]
	}

	_, porFichaRaw, err := getDashboardResumenScoped(s.asistRepo, singleSede, sedeIDs, fecha)
	if err != nil {
		return nil, err
	}
	pendientes, _ := countPendientesScoped(s.asistRepo, singleSede, sedeIDs, fecha)
	esperados, errEsp := calcularDashboardEsperadosSedes(s.fichaRepo, s.aprendizRepo, sedeIDs, fecha, true)
	if errEsp != nil {
		return nil, errEsp
	}
	formacionDia, errFormacion := calcularDashboardEsperadosSedes(s.fichaRepo, s.aprendizRepo, sedeIDs, fecha, false)
	if errFormacion != nil {
		return nil, errFormacion
	}
	porFichaActivas, totalEnFormacion := filtrarPorFichaEsperadas(porFichaRaw, esperados)
	porFicha, _ := filtrarPorFichaEsperadas(porFichaRaw, formacionDia)
	resolver := NewInstructorResponsableResolver(s.calendario)
	sinSesionDTO, errSin := buildFichasSinSesionEsperadasWithResolver(formacionDia, s.asistRepo, fecha, resolver)
	if errSin != nil {
		return nil, errSin
	}
	sinSesionActivas, errSinAct := buildFichasSinSesionEsperadasWithResolver(esperados, s.asistRepo, fecha, resolver)
	if errSinAct != nil {
		return nil, errSinAct
	}

	var totalFichas int64
	if n, errC := countFichasScoped(s.fichaRepo, singleSede, sedeIDs); errC == nil {
		totalFichas = n
	}

	pctCobertura := calcularPctCobertura(formacionDia, sinSesionDTO)

	resp.AsistenciaHoy = dto.DashboardAsistenciaHoy{
		EnFormacionAhora:       totalEnFormacion,
		Esperados:              esperados.TotalEsperados,
		PendientesRevision:     pendientes,
		FichasConSesion:        len(porFichaActivas),
		FichasSinSesion:        len(sinSesionActivas),
		PctCobertura:           pctCobertura,
		TotalFichasRegistradas: int(totalFichas),
	}
	resp.JornadasActivas = esperados.JornadasActivas
	resp.JornadasDisponibles = formacionDia.JornadasActivas
	resp.FichasSinSesion = sinSesionDTO
	resp.PorFicha = dashboardPorFichaToDTO(porFicha)
	resp.PorSede, resp.PorJornada, resp.PorRegional = aggregateDashboardDimensions(porFicha, sinSesionDTO, s.catalogoRepo)
	resp.Institucion = s.buildInstitucionStats(sedeIDs, scope)
	resp.Riesgo = s.buildRiesgoStats(singleSede, sedeIDs, pendientes)
	ultimosDias, errUltimos := buildUltimosDiasFormacion(s.asistRepo, s.fichaRepo, s.aprendizRepo, sedeIDs, fecha)
	if errUltimos != nil {
		return nil, errUltimos
	}
	resp.UltimosDiasFormacion = ultimosDias

	return resp, nil
}

func calcularPctCobertura(formacionDia *dashboardEsperadosCalc, sinSesion []dto.AsistenciaDashboardFichaSinSesion) float64 {
	totalFichasFormacion := len(formacionDia.FichasEsperadas)
	if totalFichasFormacion == 0 {
		return 0
	}
	conSesion := totalFichasFormacion - len(sinSesion)
	return math.Round(float64(conSesion)/float64(totalFichasFormacion)*1000) / 10
}

func dashboardPorFichaToDTO(rows []repositories.DashboardFichaRow) []dto.AsistenciaDashboardPorFicha {
	out := make([]dto.AsistenciaDashboardPorFicha, len(rows))
	for i := range rows {
		out[i] = dto.AsistenciaDashboardPorFicha{
			FichaID:             rows[i].FichaID,
			FichaNumero:         rows[i].FichaNumero,
			ProgramaNombre:      rows[i].ProgramaNombre,
			JornadaNombre:       rows[i].JornadaNombre,
			SedeNombre:          rows[i].SedeNombre,
			CantidadVinieron:    rows[i].CantidadVinieron,
			CantidadEnFormacion: rows[i].CantidadEnFormacion,
			TotalAprendices:     rows[i].TotalAprendices,
		}
	}
	return out
}

func getDashboardResumenScoped(repo repositories.AsistenciaRepository, singleSede *uint, sedeIDs []uint, fecha string) (int, []repositories.DashboardFichaRow, error) {
	if len(sedeIDs) <= 1 {
		return repo.GetDashboardResumen(singleSede, fecha)
	}
	var total int
	var merged []repositories.DashboardFichaRow
	seen := make(map[uint]struct{})
	for _, sid := range sedeIDs {
		id := sid
		t, pf, err := repo.GetDashboardResumen(&id, fecha)
		if err != nil {
			return 0, nil, err
		}
		total += t
		for i := range pf {
			if _, ok := seen[pf[i].FichaID]; ok {
				continue
			}
			seen[pf[i].FichaID] = struct{}{}
			merged = append(merged, pf[i])
		}
	}
	return total, merged, nil
}

func countPendientesScoped(repo repositories.AsistenciaRepository, singleSede *uint, sedeIDs []uint, fecha string) (int, error) {
	if len(sedeIDs) <= 1 {
		return repo.CountPendientesRevisionByFecha(singleSede, fecha)
	}
	total := 0
	for _, sid := range sedeIDs {
		id := sid
		n, err := repo.CountPendientesRevisionByFecha(&id, fecha)
		if err != nil {
			return 0, err
		}
		total += n
	}
	return total, nil
}

func countFichasScoped(fichaRepo repositories.FichaRepository, singleSede *uint, sedeIDs []uint) (int64, error) {
	if len(sedeIDs) <= 1 {
		return fichaRepo.CountAll(singleSede)
	}
	var total int64
	for _, sid := range sedeIDs {
		id := sid
		n, err := fichaRepo.CountAll(&id)
		if err != nil {
			return 0, err
		}
		total += n
	}
	return total, nil
}

func (s *dashboardResumenService) buildInstitucionStats(sedeIDs []uint, scope *DashboardScope) dto.DashboardInstitucionStats {
	stats := dto.DashboardInstitucionStats{}
	regionales, _ := s.catalogoRepo.FindRegionales()
	sedes, _ := s.catalogoRepo.FindSedes()
	sedeSet := make(map[uint]struct{})
	for _, id := range sedeIDs {
		sedeSet[id] = struct{}{}
	}
	regionalSet := make(map[uint]struct{})
	if len(sedeIDs) > 0 {
		for i := range sedes {
			if _, ok := sedeSet[sedes[i].ID]; ok && sedes[i].RegionalID != nil {
				regionalSet[*sedes[i].RegionalID] = struct{}{}
			}
		}
		stats.TotalSedes = len(sedeSet)
		stats.TotalRegionales = len(regionalSet)
	} else if scope != nil && scope.Restricted {
		stats.TotalRegionales = len(scope.RegionalIDs)
		stats.TotalSedes = len(scope.SedeIDs)
	} else {
		stats.TotalRegionales = len(regionales)
		stats.TotalSedes = len(sedes)
	}
	if n, err := countFichasScoped(s.fichaRepo, nil, sedeIDs); err == nil {
		stats.TotalFichasActivas = int(n)
	}
	if n, err := s.instructorRepo.CountActivos(sedeIDs); err == nil {
		stats.TotalInstructores = int(n)
	}
	if n, err := s.aprendizRepo.CountActivosScoped(sedeIDs); err == nil {
		stats.TotalAprendices = int(n)
	}
	return stats
}

func (s *dashboardResumenService) buildRiesgoStats(singleSede *uint, sedeIDs []uint, pendientes int) dto.DashboardRiesgoStats {
	return dto.DashboardRiesgoStats{
		CasosBienestar:     countCasosBienestarScoped(s.asistenciaSvc, singleSede, sedeIDs),
		PendientesRevision: pendientes,
	}
}

func countCasosBienestarScoped(svc AsistenciaService, singleSede *uint, sedeIDs []uint) int {
	if len(sedeIDs) <= 1 {
		if resp, err := svc.GetCasosBienestar(singleSede, 30, 3); err == nil && resp != nil {
			return len(resp.Casos)
		}
		return 0
	}
	seen := make(map[uint]struct{})
	total := 0
	for _, sid := range sedeIDs {
		id := sid
		resp, err := svc.GetCasosBienestar(&id, 30, 3)
		if err != nil || resp == nil {
			continue
		}
		for i := range resp.Casos {
			if _, ok := seen[resp.Casos[i].AprendizID]; ok {
				continue
			}
			seen[resp.Casos[i].AprendizID] = struct{}{}
			total++
		}
	}
	return total
}

func aggregateDashboardDimensions(
	porFicha []repositories.DashboardFichaRow,
	sinSesion []dto.AsistenciaDashboardFichaSinSesion,
	catalogoRepo repositories.CatalogoRepository,
) ([]dto.DashboardSedeStats, []dto.DashboardJornadaStats, []dto.DashboardRegionalStats) {
	regionalBySedeNombre := buildRegionalBySedeNombre(catalogoRepo)
	acc := newDashboardDimensionAccumulators()
	acc.accumulatePorFicha(porFicha, regionalBySedeNombre)
	acc.accumulateSinSesion(sinSesion, regionalBySedeNombre)
	return acc.toDTOs()
}

func buildRegionalBySedeNombre(catalogoRepo repositories.CatalogoRepository) map[string]string {
	sedes, _ := catalogoRepo.FindSedes()
	regionales, _ := catalogoRepo.FindRegionales()
	regionalByID := make(map[uint]string, len(regionales))
	for i := range regionales {
		regionalByID[regionales[i].ID] = regionales[i].Nombre
	}
	regionalBySedeNombre := make(map[string]string, len(sedes))
	for i := range sedes {
		name := ""
		if sedes[i].RegionalID != nil {
			name = regionalByID[*sedes[i].RegionalID]
		}
		regionalBySedeNombre[sedes[i].Nombre] = name
	}
	return regionalBySedeNombre
}

type dashboardDimensionAccumulators struct {
	sedeMap     map[string]*sedeAcc
	jornadaMap  map[string]*jornadaAcc
	regionalMap map[string]*regionalAcc
}

type sedeAcc struct {
	vinieron, total int
	regional        string
}

type jornadaAcc struct{ vinieron, total int }

type regionalAcc struct {
	vinieron, total, sinSesion int
}

func newDashboardDimensionAccumulators() *dashboardDimensionAccumulators {
	return &dashboardDimensionAccumulators{
		sedeMap:     make(map[string]*sedeAcc),
		jornadaMap:  make(map[string]*jornadaAcc),
		regionalMap: make(map[string]*regionalAcc),
	}
}

func normalizeDashboardLabel(name, fallback string) string {
	if name == "" {
		return fallback
	}
	return name
}

func (a *dashboardDimensionAccumulators) accumulatePorFicha(
	porFicha []repositories.DashboardFichaRow,
	regionalBySedeNombre map[string]string,
) {
	for i := range porFicha {
		row := porFicha[i]
		sn := normalizeDashboardLabel(row.SedeNombre, "Sin sede")
		if a.sedeMap[sn] == nil {
			a.sedeMap[sn] = &sedeAcc{regional: regionalBySedeNombre[sn]}
		}
		a.sedeMap[sn].vinieron += row.CantidadVinieron
		a.sedeMap[sn].total += row.TotalAprendices

		jn := normalizeDashboardLabel(row.JornadaNombre, "Sin jornada")
		if a.jornadaMap[jn] == nil {
			a.jornadaMap[jn] = &jornadaAcc{}
		}
		a.jornadaMap[jn].vinieron += row.CantidadVinieron
		a.jornadaMap[jn].total += row.TotalAprendices

		rn := normalizeDashboardLabel(regionalBySedeNombre[sn], "Sin regional")
		if a.regionalMap[rn] == nil {
			a.regionalMap[rn] = &regionalAcc{}
		}
		a.regionalMap[rn].vinieron += row.CantidadVinieron
		a.regionalMap[rn].total += row.TotalAprendices
	}
}

func (a *dashboardDimensionAccumulators) accumulateSinSesion(
	sinSesion []dto.AsistenciaDashboardFichaSinSesion,
	regionalBySedeNombre map[string]string,
) {
	for i := range sinSesion {
		sn := normalizeDashboardLabel(sinSesion[i].SedeNombre, "Sin sede")
		rn := normalizeDashboardLabel(regionalBySedeNombre[sn], "Sin regional")
		if a.regionalMap[rn] == nil {
			a.regionalMap[rn] = &regionalAcc{}
		}
		a.regionalMap[rn].sinSesion++
	}
}

func dashboardPct(vinieron, total int) float64 {
	if total <= 0 {
		return 0
	}
	return math.Round(float64(vinieron)/float64(total)*1000) / 10
}

func (a *dashboardDimensionAccumulators) toDTOs() (
	[]dto.DashboardSedeStats,
	[]dto.DashboardJornadaStats,
	[]dto.DashboardRegionalStats,
) {
	porSede := make([]dto.DashboardSedeStats, 0, len(a.sedeMap))
	for nombre, acc := range a.sedeMap {
		porSede = append(porSede, dto.DashboardSedeStats{
			Nombre:         nombre,
			RegionalNombre: acc.regional,
			Vinieron:       acc.vinieron,
			Total:          acc.total,
			Pct:            dashboardPct(acc.vinieron, acc.total),
		})
	}
	porJornada := make([]dto.DashboardJornadaStats, 0, len(a.jornadaMap))
	for nombre, acc := range a.jornadaMap {
		porJornada = append(porJornada, dto.DashboardJornadaStats{
			Nombre:   nombre,
			Vinieron: acc.vinieron,
			Total:    acc.total,
			Pct:      dashboardPct(acc.vinieron, acc.total),
		})
	}
	porRegional := make([]dto.DashboardRegionalStats, 0, len(a.regionalMap))
	for nombre, acc := range a.regionalMap {
		porRegional = append(porRegional, dto.DashboardRegionalStats{
			Nombre:          nombre,
			Vinieron:        acc.vinieron,
			Total:           acc.total,
			FichasSinSesion: acc.sinSesion,
		})
	}
	return porSede, porJornada, porRegional
}
