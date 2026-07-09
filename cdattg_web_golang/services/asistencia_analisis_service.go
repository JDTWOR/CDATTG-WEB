package services

import (
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/sena/cdattg-web-golang/utils"
)

type AsistenciaAnalisisParams struct {
	FechaDesde  string
	FechaHasta  string
	RegionalID  *uint
	SedeID      *uint
	Jornada     string
	FichaNumero string
	AprendizID  *uint
	DiaSemanaID *int
}

type AsistenciaAnalisisService interface {
	GetAnalisis(userID uint, roles []string, p AsistenciaAnalisisParams) (*dto.AsistenciaAnalisisResponse, error)
}

type asistenciaAnalisisService struct {
	scopeSvc    DashboardScopeService
	fichaRepo   repositories.FichaRepository
	aprendizRepo repositories.AprendizRepository
	analisisRepo repositories.AsistenciaAnalisisRepository
	asistRepo   repositories.AsistenciaRepository
	calendario  *CalendarioFormacionService
	horarioSvc  *InstructorHorarioService
}

func NewAsistenciaAnalisisService() AsistenciaAnalisisService {
	return &asistenciaAnalisisService{
		scopeSvc:     NewDashboardScopeService(),
		fichaRepo:    repositories.NewFichaRepository(),
		aprendizRepo: repositories.NewAprendizRepository(),
		analisisRepo: repositories.NewAsistenciaAnalisisRepository(),
		asistRepo:    repositories.NewAsistenciaRepository(),
		calendario:   NewCalendarioFormacionService(),
		horarioSvc:   NewInstructorHorarioService(),
	}
}

var nombresDiaSemana = map[int]string{
	1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves",
	5: "Viernes", 6: "Sábado", 7: "Domingo",
}

func (s *asistenciaAnalisisService) GetAnalisis(userID uint, roles []string, p AsistenciaAnalisisParams) (*dto.AsistenciaAnalisisResponse, error) {
	scope, err := s.scopeSvc.Resolve(userID, roles)
	if err != nil {
		return nil, err
	}
	sedeIDs, empty := s.scopeSvc.ResolveEffectiveSedes(scope, p.RegionalID, p.SedeID)
	if empty {
		return emptyAnalisisResponse(p), nil
	}

	desde, hasta, err := parseRangoAnalisis(p.FechaDesde, p.FechaHasta)
	if err != nil {
		return nil, err
	}
	jornada := strings.TrimSpace(p.Jornada)

	var fichaID *uint
	if num := strings.TrimSpace(p.FichaNumero); num != "" {
		f, err := s.fichaRepo.FindByFicha(num)
		if err != nil {
			return emptyAnalisisResponse(p), nil
		}
		fichaID = &f.ID
	}

	horaToma, err := s.buildHoraToma(desde, hasta, sedeIDs, fichaID, p.AprendizID, jornada)
	if err != nil {
		return nil, err
	}
	cumplimiento, err := s.buildCumplimiento(desde, hasta, sedeIDs, jornada, fichaID, horaToma.sesionesPorFicha)
	if err != nil {
		return nil, err
	}
	diaSemana, err := s.buildSemanaAnterior(sedeIDs, jornada, p.DiaSemanaID, fichaID)
	if err != nil {
		return nil, err
	}
	enriquecerHoraTomaConCumplimiento(&horaToma.section, cumplimiento)
	return &dto.AsistenciaAnalisisResponse{
		FechaDesde:   desde.Format(time.DateOnly),
		FechaHasta:   hasta.Add(-24 * time.Hour).Format(time.DateOnly),
		HoraToma:     horaToma.section,
		Cumplimiento: cumplimiento,
		DiaSemana:    diaSemana,
	}, nil
}

func emptyAnalisisResponse(p AsistenciaAnalisisParams) *dto.AsistenciaAnalisisResponse {
	return &dto.AsistenciaAnalisisResponse{
		FechaDesde: p.FechaDesde,
		FechaHasta: p.FechaHasta,
		HoraToma: dto.AnalisisHoraTomaSection{
			DetallePorFicha: []dto.AnalisisHoraTomaPorFicha{},
		},
		Cumplimiento: dto.AnalisisCumplimientoSection{Items: []dto.AnalisisCumplimientoFicha{}},
		DiaSemana: dto.AnalisisDiaSemanaSection{
			SemanaDesde:       "",
			SemanaHasta:       "",
			PorDia:            []dto.AnalisisDiaSemanaFila{},
			DiasMasAsistencia: []dto.AnalisisDiaRanking{},
		},
	}
}

func parseRangoAnalisis(desdeStr, hastaStr string) (time.Time, time.Time, error) {
	loc := utils.AppLocation()
	now := time.Now().In(loc)
	if strings.TrimSpace(hastaStr) == "" {
		hastaStr = now.Format(time.DateOnly)
	}
	if strings.TrimSpace(desdeStr) == "" {
		d := now.AddDate(0, 0, -89)
		desdeStr = d.Format(time.DateOnly)
	}
	desde, err := time.ParseInLocation(time.DateOnly, desdeStr, loc)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("fecha_desde inválida")
	}
	hastaDay, err := time.ParseInLocation(time.DateOnly, hastaStr, loc)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("fecha_hasta inválida")
	}
	hasta := hastaDay.Add(24 * time.Hour)
	if !desde.Before(hasta) {
		return time.Time{}, time.Time{}, fmt.Errorf("fecha_desde debe ser anterior a fecha_hasta")
	}
	return desde, hasta, nil
}

func formatoHoraDesdeMinutos(m int) string {
	if m < 0 {
		m = 0
	}
	h := m / 60
	mi := m % 60
	return fmt.Sprintf("%02d:%02d", h, mi)
}

func promedioMinutos(vals []int) int {
	if len(vals) == 0 {
		return 0
	}
	sum := 0
	for _, v := range vals {
		sum += v
	}
	return int(math.Round(float64(sum) / float64(len(vals))))
}

type horaTomaBuildResult struct {
	section         dto.AnalisisHoraTomaSection
	sesionesPorFicha map[uint]*fichaSesionesAgrupadas
}

func (s *asistenciaAnalisisService) buildHoraToma(
	desde, hasta time.Time,
	sedeIDs []uint,
	fichaID, aprendizID *uint,
	jornada string,
) (horaTomaBuildResult, error) {
	rows, err := s.analisisRepo.FindSesionesDetalle(desde, hasta, sedeIDs, fichaID, aprendizID, jornada)
	if err != nil {
		return horaTomaBuildResult{}, err
	}
	loc := utils.AppLocation()
	agrupado := agruparSesionesPorFicha(rows, loc)

	allMinutos := make([]int, 0, len(rows))
	for _, entry := range agrupado {
		allMinutos = append(allMinutos, entry.minutos...)
	}
	avg := promedioMinutos(allMinutos)

	totalDias := make(map[string]struct{})
	detalle := make([]dto.AnalisisHoraTomaPorFicha, 0, len(agrupado))
	for fid, e := range agrupado {
		for fecha := range e.fechas {
			totalDias[fecha] = struct{}{}
		}
		pm := promedioMinutos(e.minutos)
		detalle = append(detalle, dto.AnalisisHoraTomaPorFicha{
			FichaID:        fid,
			FichaNumero:    e.numero,
			ProgramaNombre: e.programa,
			JornadaNombre:  e.jornada,
			PromedioHora:   formatoHoraDesdeMinutos(pm),
			TotalSesiones:  e.totalSesiones,
			DiasConSesion:  len(e.fechas),
		})
	}
	sort.Slice(detalle, func(i, j int) bool { return detalle[i].FichaNumero < detalle[j].FichaNumero })

	totalSesiones := 0
	for _, e := range agrupado {
		totalSesiones += e.totalSesiones
	}
	return horaTomaBuildResult{
		section: dto.AnalisisHoraTomaSection{
			PromedioHora:       formatoHoraDesdeMinutos(avg),
			PromedioMinutosDia: avg,
			TotalSesiones:      totalSesiones,
			TotalDiasConSesion: len(totalDias),
			DetallePorFicha:    detalle,
		},
		sesionesPorFicha: agrupado,
	}, nil
}

func (s *asistenciaAnalisisService) fichaTieneFormacionEnDia(f *models.FichaCaracterizacion, dia time.Time) bool {
	if f == nil {
		return false
	}
	if s.calendario.EsDiaFestivoColombia(dia) {
		return false
	}
	if f.SedeID != nil && *f.SedeID > 0 && s.calendario.EsDiaSinFormacionSede(*f.SedeID, dia) {
		return false
	}
	diaID := WeekdayToDiaFormacionID(dia.Weekday())
	return len(s.horarioSvc.bloquesDiaFicha(f, diaID)) > 0
}

func rangoDiasFichaEnConsulta(f *models.FichaCaracterizacion, desde, hasta time.Time) (time.Time, time.Time) {
	loc := utils.AppLocation()
	start := desde.In(loc)
	end := hasta.Add(-time.Second).In(loc)
	if f.FechaInicio != nil {
		fi, _ := time.ParseInLocation(time.DateOnly, f.FechaInicio.Format(time.DateOnly), loc)
		if fi.After(start) {
			start = fi
		}
	}
	if f.FechaFin != nil {
		ff, _ := time.ParseInLocation(time.DateOnly, f.FechaFin.Format(time.DateOnly), loc)
		if ff.Before(end) {
			end = ff
		}
	}
	return start, end
}

func (s *asistenciaAnalisisService) buildCumplimiento(
	desde, hasta time.Time,
	sedeIDs []uint,
	jornada string,
	fichaID *uint,
	sesionesPorFicha map[uint]*fichaSesionesAgrupadas,
) (dto.AnalisisCumplimientoSection, error) {
	fichas, err := s.fichaRepo.FindActivasSolapandoRango(desde, hasta, sedeIDs, jornada, false)
	if err != nil {
		return dto.AnalisisCumplimientoSection{}, err
	}
	fichas = filtrarFichasPorID(fichas, fichaID)

	items := make([]dto.AnalisisCumplimientoFicha, 0, len(fichas))
	for i := range fichas {
		f := &fichas[i]
		entry := sesionesPorFicha[f.ID]
		totalSesiones := 0
		if entry != nil {
			totalSesiones = entry.totalSesiones
		}
		item, err := s.itemCumplimientoFicha(f, desde, hasta, fechasSesionFicha(sesionesPorFicha, f.ID), totalSesiones)
		if err != nil {
			return dto.AnalisisCumplimientoSection{}, err
		}
		if item != nil {
			items = append(items, *item)
		}
	}
	sort.Slice(items, func(i, j int) bool { return items[i].PctCumplimiento < items[j].PctCumplimiento })
	return dto.AnalisisCumplimientoSection{Items: items}, nil
}

// rangoSemanaAnteriorCompleta devuelve [lunes, lunes) de la semana calendario anterior a la actual.
func rangoSemanaAnteriorCompleta(ref time.Time) (time.Time, time.Time) {
	loc := utils.AppLocation()
	ref = ref.In(loc)
	daysSinceMonday := int(ref.Weekday() - time.Monday)
	if ref.Weekday() == time.Sunday {
		daysSinceMonday = 6
	}
	mondayThisWeek := ref.AddDate(0, 0, -daysSinceMonday)
	mondayPrev := mondayThisWeek.AddDate(0, 0, -7)
	return mondayPrev, mondayThisWeek
}

func (s *asistenciaAnalisisService) buildSemanaAnterior(
	sedeIDs []uint,
	jornada string,
	diaSemanaID *int,
	fichaID *uint,
) (dto.AnalisisDiaSemanaSection, error) {
	loc := utils.AppLocation()
	desde, hasta := rangoSemanaAnteriorCompleta(time.Now())
	endDay := hasta.Add(-time.Second)

	porDia := make([]dto.AnalisisDiaSemanaFila, 0, 7)
	rankingRows := make([]dto.AnalisisDiaRanking, 0, 7)

	for d := desde.In(loc); !d.After(endDay); d = d.AddDate(0, 0, 1) {
		diaID := int(WeekdayToDiaFormacionID(d.Weekday()))
		if diaSemanaID != nil && *diaSemanaID > 0 && diaID != *diaSemanaID {
			continue
		}
		diaRes, err := s.procesarDiaSemanaAnterior(d, sedeIDs, jornada, fichaID)
		if err != nil {
			return dto.AnalisisDiaSemanaSection{}, err
		}
		porDia = append(porDia, diaRes.filas...)
		if diaRes.ranking != nil {
			rankingRows = append(rankingRows, *diaRes.ranking)
		}
	}

	sort.Slice(porDia, func(i, j int) bool {
		if porDia[i].Fecha != porDia[j].Fecha {
			return porDia[i].Fecha < porDia[j].Fecha
		}
		return porDia[i].JornadaNombre < porDia[j].JornadaNombre
	})
	sort.Slice(rankingRows, func(i, j int) bool {
		if rankingRows[i].Vinieron != rankingRows[j].Vinieron {
			return rankingRows[i].Vinieron > rankingRows[j].Vinieron
		}
		return rankingRows[i].Pct > rankingRows[j].Pct
	})

	return dto.AnalisisDiaSemanaSection{
		SemanaDesde:       desde.Format(time.DateOnly),
		SemanaHasta:       endDay.Format(time.DateOnly),
		PorDia:            porDia,
		DiasMasAsistencia: rankingRows,
	}, nil
}
