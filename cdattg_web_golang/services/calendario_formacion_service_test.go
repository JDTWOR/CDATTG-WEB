package services

import (
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/config"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

type stubFichaDiasRepoCal struct {
	dias []models.FichaDiasFormacion
}

func (s *stubFichaDiasRepoCal) ReplaceByFichaID(uint, []uint) error { return nil }
func (s *stubFichaDiasRepoCal) ReplaceByFichaIDWithHorarios(uint, []repositories.FichaDiaInput) error {
	return nil
}
func (s *stubFichaDiasRepoCal) FindByFichaID(uint) ([]models.FichaDiasFormacion, error) {
	return s.dias, nil
}
func (s *stubFichaDiasRepoCal) FindDistinctFichaIDsReferencingJornada(uint) ([]uint, error) {
	return nil, nil
}

func TestInstructorTieneFormacionEnFecha_ExcluyeSabadoSinProgramacion(t *testing.T) {
	inicio := time.Date(2025, 1, 1, 0, 0, 0, 0, time.Local)
	fin := time.Date(2026, 12, 31, 0, 0, 0, 0, time.Local)
	ficha := &models.FichaCaracterizacion{
		UserAuditModel: models.UserAuditModel{BaseModel: models.BaseModel{ID: 10}},
		Status:         true,
		FechaInicio:    &inicio,
		FechaFin:       &fin,
	}
	ifc := &models.InstructorFichaCaracterizacion{InstructorID: 1, FichaID: 10, FechaInicio: &inicio, FechaFin: &fin}
	fichaDias := []models.FichaDiasFormacion{
		{DiaFormacionID: 1}, {DiaFormacionID: 2}, {DiaFormacionID: 3},
		{DiaFormacionID: 4}, {DiaFormacionID: 5},
	}
	diasInst := []models.InstructorFichaDias{{DiaFormacionID: 3}}
	svc := &CalendarioFormacionService{}
	sabado := time.Date(2026, 6, 13, 0, 0, 0, 0, time.Local) // sábado
	if svc.instructorTieneFormacionEnFecha(ficha, ifc, fichaDias, diasInst, nil, sabado) {
		t.Fatal("sábado no debe contar cuando ficha e instructor no lo tienen programado")
	}
	miercoles := time.Date(2026, 6, 3, 0, 0, 0, 0, time.Local)
	if !svc.instructorTieneFormacionEnFecha(ficha, ifc, fichaDias, diasInst, nil, miercoles) {
		t.Fatal("miércoles sí debe contar")
	}
}

func TestDiaIDsProgramadosConFallback_UsaDiasFicha(t *testing.T) {
	fichaDias := []models.FichaDiasFormacion{{DiaFormacionID: 6}}
	got := diaIDsProgramadosConFallback(nil, fichaDias)
	if len(got) != 1 || got[0] != 6 {
		t.Fatalf("esperaba sábado en fallback, got %#v", got)
	}
}

func TestEsSesionFormacionValida_RelaxarPermiteSinDiaProgramado(t *testing.T) {
	prev := config.AppConfig
	t.Cleanup(func() { config.AppConfig = prev })
	config.AppConfig = &config.Config{
		Negocio: config.NegocioConfig{RelaxarRestriccionAsistencia: true},
	}

	inicio := time.Date(2025, 1, 1, 0, 0, 0, 0, time.Local)
	fin := time.Date(2026, 12, 31, 0, 0, 0, 0, time.Local)
	ficha := &models.FichaCaracterizacion{
		UserAuditModel: models.UserAuditModel{BaseModel: models.BaseModel{ID: 10}},
		Status:         true,
		FechaInicio:    &inicio,
		FechaFin:       &fin,
	}
	ifc := &models.InstructorFichaCaracterizacion{InstructorID: 1, FichaID: 10, FechaInicio: &inicio, FechaFin: &fin}
	svc := &CalendarioFormacionService{
		fichaRepo:             &stubFichaRepoHorario{ficha: ficha},
		instFichaRepo:         &stubInstFichaRepo{ifc: ifc},
		fichaDiasRepo:         &stubFichaDiasRepoCal{dias: []models.FichaDiasFormacion{{DiaFormacionID: 1}}},
		instFichaDiasRepo:     &stubInstFichaDiasRepo{dias: []models.InstructorFichaDias{{DiaFormacionID: 1}}},
		trasladoFechaRepo:     &stubTrasladoFechaRepo{},
		festivosCache:         make(map[string]bool),
		sinFormacionSedeCache: make(map[uint]map[string]string),
	}
	miercoles := time.Date(2026, 6, 3, 0, 0, 0, 0, time.Local)
	svc.festivosCache[miercoles.Format(time.DateOnly)] = false
	if !svc.EsSesionFormacionValida(10, 1, miercoles) {
		t.Fatal("con relax debe ser válida aunque no sea día programado")
	}
}

func TestEsSesionFormacionValida_SinRelaxRechazaDiaNoProgramado(t *testing.T) {
	prev := config.AppConfig
	t.Cleanup(func() { config.AppConfig = prev })
	config.AppConfig = &config.Config{
		Negocio: config.NegocioConfig{RelaxarRestriccionAsistencia: false},
	}

	inicio := time.Date(2025, 1, 1, 0, 0, 0, 0, time.Local)
	fin := time.Date(2026, 12, 31, 0, 0, 0, 0, time.Local)
	ficha := &models.FichaCaracterizacion{
		UserAuditModel: models.UserAuditModel{BaseModel: models.BaseModel{ID: 10}},
		Status:         true,
		FechaInicio:    &inicio,
		FechaFin:       &fin,
	}
	ifc := &models.InstructorFichaCaracterizacion{InstructorID: 1, FichaID: 10, FechaInicio: &inicio, FechaFin: &fin}
	svc := &CalendarioFormacionService{
		fichaRepo:             &stubFichaRepoHorario{ficha: ficha},
		instFichaRepo:         &stubInstFichaRepo{ifc: ifc},
		fichaDiasRepo:         &stubFichaDiasRepoCal{dias: []models.FichaDiasFormacion{{DiaFormacionID: 1}, {DiaFormacionID: 3}}},
		instFichaDiasRepo:     &stubInstFichaDiasRepo{dias: []models.InstructorFichaDias{{DiaFormacionID: 1}}},
		trasladoFechaRepo:     &stubTrasladoFechaRepo{},
		festivosCache:         make(map[string]bool),
		sinFormacionSedeCache: make(map[uint]map[string]string),
	}
	miercoles := time.Date(2026, 6, 3, 0, 0, 0, 0, time.Local)
	svc.festivosCache[miercoles.Format(time.DateOnly)] = false
	if svc.EsSesionFormacionValida(10, 1, miercoles) {
		t.Fatal("sin relax no debe validar sesión en día no programado")
	}
}

var _ repositories.FichaDiasRepository = (*stubFichaDiasRepoCal)(nil)
