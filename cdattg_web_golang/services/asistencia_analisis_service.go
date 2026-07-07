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
	cumplimiento, err := s.buildCumplimiento(desde, hasta, sedeIDs, jornada, fichaID)
	if err != nil {
		return nil, err
	}
	diaSemana, err := s.buildDiaSemana(desde, hasta, sedeIDs, jornada, p.DiaSemanaID, fichaID)
	if err != nil {
		return nil, err
	}

	return &dto.AsistenciaAnalisisResponse{
		FechaDesde:   desde.Format(time.DateOnly),
		FechaHasta:   hasta.Add(-24 * time.Hour).Format(time.DateOnly),
		HoraToma:     horaToma,
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
			PorDiaJornada:     []dto.AnalisisDiaSemanaJornada{},
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

func minutosDesdeMedianoche(t time.Time, loc *time.Location) int {
	local := t.In(loc)
	return local.Hour()*60 + local.Minute()
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

func (s *asistenciaAnalisisService) buildHoraToma(
	desde, hasta time.Time,
	sedeIDs []uint,
	fichaID, aprendizID *uint,
	jornada string,
) (dto.AnalisisHoraTomaSection, error) {
	rows, err := s.analisisRepo.FindSesionesPrimeraHora(desde, hasta, sedeIDs, fichaID, aprendizID, jornada)
	if err != nil {
		return dto.AnalisisHoraTomaSection{}, err
	}
	loc := utils.AppLocation()
	minutos := make([]int, 0, len(rows))
	byFicha := make(map[uint]*struct {
		numero string
		jornada string
		mins    []int
	})
	for i := range rows {
		if rows[i].PrimeraHora == nil {
			continue
		}
		m := minutosDesdeMedianoche(*rows[i].PrimeraHora, loc)
		minutos = append(minutos, m)
		entry := byFicha[rows[i].FichaID]
		if entry == nil {
			entry = &struct {
				numero  string
				jornada string
				mins    []int
			}{numero: rows[i].FichaNumero, jornada: rows[i].JornadaNombre}
			byFicha[rows[i].FichaID] = entry
		}
		entry.mins = append(entry.mins, m)
	}
	avg := promedioMinutos(minutos)
	detalle := make([]dto.AnalisisHoraTomaPorFicha, 0, len(byFicha))
	for fid, e := range byFicha {
		pm := promedioMinutos(e.mins)
		detalle = append(detalle, dto.AnalisisHoraTomaPorFicha{
			FichaID:       fid,
			FichaNumero:   e.numero,
			JornadaNombre: e.jornada,
			PromedioHora:  formatoHoraDesdeMinutos(pm),
			TotalSesiones: len(e.mins),
		})
	}
	sort.Slice(detalle, func(i, j int) bool { return detalle[i].FichaNumero < detalle[j].FichaNumero })
	return dto.AnalisisHoraTomaSection{
		PromedioHora:       formatoHoraDesdeMinutos(avg),
		PromedioMinutosDia: avg,
		TotalSesiones:      len(minutos),
		DetallePorFicha:    detalle,
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
) (dto.AnalisisCumplimientoSection, error) {
	fichas, err := s.fichaRepo.FindActivasSolapandoRango(desde, hasta, sedeIDs, jornada, false)
	if err != nil {
		return dto.AnalisisCumplimientoSection{}, err
	}
	if fichaID != nil && *fichaID > 0 {
		filtered := make([]models.FichaCaracterizacion, 0, 1)
		for i := range fichas {
			if fichas[i].ID == *fichaID {
				filtered = append(filtered, fichas[i])
				break
			}
		}
		fichas = filtered
	}
	items := make([]dto.AnalisisCumplimientoFicha, 0, len(fichas))
	for i := range fichas {
		f := &fichas[i]
		start, end := rangoDiasFichaEnConsulta(f, desde, hasta)
		if end.Before(start) {
			continue
		}
		sesiones, err := s.analisisRepo.FindFechasConSesionPorFicha(f.ID, desde, hasta)
		if err != nil {
			return dto.AnalisisCumplimientoSection{}, err
		}
		programados := 0
		conSesion := 0
		for d := start; !d.After(end); d = d.AddDate(0, 0, 1) {
			if !s.fichaTieneFormacionEnDia(f, d) {
				continue
			}
			programados++
			key := d.Format(time.DateOnly)
			if _, ok := sesiones[key]; ok {
				conSesion++
			}
		}
		if programados == 0 {
			continue
		}
		pct := math.Round(float64(conSesion)/float64(programados)*1000) / 10
		progNombre := ""
		if f.ProgramaFormacion != nil {
			progNombre = f.ProgramaFormacion.Nombre
		}
		jornadaNombre := ""
		if f.Jornada != nil {
			jornadaNombre = f.Jornada.Nombre
		}
		sedeNombre := ""
		if f.Sede != nil {
			sedeNombre = f.Sede.Nombre
		}
		items = append(items, dto.AnalisisCumplimientoFicha{
			FichaID:         f.ID,
			FichaNumero:     f.Ficha,
			ProgramaNombre:  progNombre,
			JornadaNombre:   jornadaNombre,
			SedeNombre:      sedeNombre,
			DiasProgramados: programados,
			DiasConSesion:   conSesion,
			PctCumplimiento: pct,
		})
	}
	sort.Slice(items, func(i, j int) bool { return items[i].PctCumplimiento < items[j].PctCumplimiento })
	return dto.AnalisisCumplimientoSection{Items: items}, nil
}

type diaJornadaKey struct {
	diaID   int
	jornada string
}

func (s *asistenciaAnalisisService) buildDiaSemana(
	desde, hasta time.Time,
	sedeIDs []uint,
	jornada string,
	diaSemanaID *int,
	fichaID *uint,
) (dto.AnalisisDiaSemanaSection, error) {
	loc := utils.AppLocation()
	agg := make(map[diaJornadaKey]*struct{ esperados, vinieron int })
	diaTotal := make(map[int]*struct{ esperados, vinieron int })

	endDay := hasta.Add(-time.Second)
	for d := desde.In(loc); !d.After(endDay); d = d.AddDate(0, 0, 1) {
		diaID := int(WeekdayToDiaFormacionID(d.Weekday()))
		if diaSemanaID != nil && *diaSemanaID > 0 && diaID != *diaSemanaID {
			continue
		}
		var sedeID *uint
		if len(sedeIDs) == 1 {
			sedeID = &sedeIDs[0]
		}
		fichas, err := s.fichaRepo.FindActivasParaFechaConJornada(d, sedeID)
		if err != nil {
			return dto.AnalisisDiaSemanaSection{}, err
		}
		fichas = filtrarFichasPorSedes(fichas, sedeIDs)
		fechaStr := d.Format(time.DateOnly)
		var sedeForDash *uint
		if len(sedeIDs) == 1 {
			sedeForDash = &sedeIDs[0]
		}
		_, porFichaDia, err := s.asistRepo.GetDashboardResumen(sedeForDash, fechaStr)
		if err != nil {
			return dto.AnalisisDiaSemanaSection{}, err
		}
		vinieronPorFicha := make(map[uint]int, len(porFichaDia))
		for _, row := range porFichaDia {
			vinieronPorFicha[row.FichaID] = row.CantidadVinieron
		}
		for i := range fichas {
			f := &fichas[i]
			if fichaID != nil && *fichaID > 0 && f.ID != *fichaID {
				continue
			}
			if jornada != "" && (f.Jornada == nil || f.Jornada.Nombre != jornada) {
				continue
			}
			if !s.fichaTieneFormacionEnDia(f, d) {
				continue
			}
			aprendices, err := s.aprendizRepo.FindByFichaID(f.ID)
			if err != nil {
				return dto.AnalisisDiaSemanaSection{}, err
			}
			activeCount := 0
			for _, ap := range aprendices {
				if ap.Estado {
					activeCount++
				}
			}
			if activeCount == 0 {
				continue
			}
			jornadaNombre := ""
			if f.Jornada != nil {
				jornadaNombre = f.Jornada.Nombre
			}
			key := diaJornadaKey{diaID: diaID, jornada: jornadaNombre}
			if agg[key] == nil {
				agg[key] = &struct{ esperados, vinieron int }{}
			}
			agg[key].esperados += activeCount
			vinieron := vinieronPorFicha[f.ID]
			agg[key].vinieron += vinieron

			if diaTotal[diaID] == nil {
				diaTotal[diaID] = &struct{ esperados, vinieron int }{}
			}
			diaTotal[diaID].esperados += activeCount
			diaTotal[diaID].vinieron += vinieron
		}
	}

	porDiaJornada := make([]dto.AnalisisDiaSemanaJornada, 0, len(agg))
	for key, v := range agg {
		pct := 0.0
		if v.esperados > 0 {
			pct = math.Round(float64(v.vinieron)/float64(v.esperados)*1000) / 10
		}
		porDiaJornada = append(porDiaJornada, dto.AnalisisDiaSemanaJornada{
			DiaSemanaID:   key.diaID,
			DiaSemana:     nombresDiaSemana[key.diaID],
			JornadaNombre: key.jornada,
			Esperados:     v.esperados,
			Vinieron:      v.vinieron,
			Pct:           pct,
		})
	}
	sort.Slice(porDiaJornada, func(i, j int) bool {
		if porDiaJornada[i].DiaSemanaID != porDiaJornada[j].DiaSemanaID {
			return porDiaJornada[i].DiaSemanaID < porDiaJornada[j].DiaSemanaID
		}
		return porDiaJornada[i].JornadaNombre < porDiaJornada[j].JornadaNombre
	})

	ranking := make([]dto.AnalisisDiaRanking, 0, len(diaTotal))
	for diaID, v := range diaTotal {
		pct := 0.0
		if v.esperados > 0 {
			pct = math.Round(float64(v.vinieron)/float64(v.esperados)*1000) / 10
		}
		ranking = append(ranking, dto.AnalisisDiaRanking{
			DiaSemanaID: diaID,
			DiaSemana:   nombresDiaSemana[diaID],
			Vinieron:    v.vinieron,
			Pct:         pct,
		})
	}
	sort.Slice(ranking, func(i, j int) bool {
		if ranking[i].Vinieron != ranking[j].Vinieron {
			return ranking[i].Vinieron > ranking[j].Vinieron
		}
		return ranking[i].Pct > ranking[j].Pct
	})

	return dto.AnalisisDiaSemanaSection{
		PorDiaJornada:     porDiaJornada,
		DiasMasAsistencia: ranking,
	}, nil
}
