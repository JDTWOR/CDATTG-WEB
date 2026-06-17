package services

import (
	"testing"
	"time"

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

var _ repositories.FichaDiasRepository = (*stubFichaDiasRepoCal)(nil)
