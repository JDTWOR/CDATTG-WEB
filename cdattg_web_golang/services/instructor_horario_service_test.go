package services

import (
	"strings"
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

type stubInstFichaRepo struct {
	ifc *models.InstructorFichaCaracterizacion
}

func (s *stubInstFichaRepo) FindByID(uint) (*models.InstructorFichaCaracterizacion, error) {
	return nil, nil
}
func (s *stubInstFichaRepo) FindByFichaID(uint) ([]models.InstructorFichaCaracterizacion, error) {
	return nil, nil
}
func (s *stubInstFichaRepo) FindByFichaIDAndInstructorID(_, _ uint) (*models.InstructorFichaCaracterizacion, error) {
	return s.ifc, nil
}
func (s *stubInstFichaRepo) FindByInstructorID(uint) ([]models.InstructorFichaCaracterizacion, error) {
	return nil, nil
}
func (s *stubInstFichaRepo) CountActiveFichasByInstructorID(uint) (int, error) { return 0, nil }
func (s *stubInstFichaRepo) Create(*models.InstructorFichaCaracterizacion) error  { return nil }
func (s *stubInstFichaRepo) Update(*models.InstructorFichaCaracterizacion) error  { return nil }
func (s *stubInstFichaRepo) Delete(uint) error                                     { return nil }
func (s *stubInstFichaRepo) DeleteByFichaIDAndInstructorID(_, _ uint) error      { return nil }

type stubFichaRepoHorario struct {
	ficha *models.FichaCaracterizacion
}

func (s *stubFichaRepoHorario) FindByID(id uint) (*models.FichaCaracterizacion, error) {
	if s.ficha != nil && s.ficha.ID == id {
		return s.ficha, nil
	}
	return nil, nil
}
func (s *stubFichaRepoHorario) FindByIDWithInstructoresAndAprendices(uint) (*models.FichaCaracterizacion, error) {
	return nil, nil
}
func (s *stubFichaRepoHorario) FindByFicha(string) (*models.FichaCaracterizacion, error) { return nil, nil }
func (s *stubFichaRepoHorario) FindAll(int, int, *uint, *uint, string) ([]models.FichaCaracterizacion, int64, error) {
	return nil, 0, nil
}
func (s *stubFichaRepoHorario) FindActivasParaHoyConJornada(time.Time) ([]models.FichaCaracterizacion, error) {
	return nil, nil
}
func (s *stubFichaRepoHorario) Search(string) ([]models.FichaCaracterizacion, error) { return nil, nil }
func (s *stubFichaRepoHorario) Create(*models.FichaCaracterizacion) error           { return nil }
func (s *stubFichaRepoHorario) Update(*models.FichaCaracterizacion) error           { return nil }
func (s *stubFichaRepoHorario) Delete(uint) error                                   { return nil }
func (s *stubFichaRepoHorario) ExistsByFicha(string) bool                           { return false }
func (s *stubFichaRepoHorario) ExistsByFichaExcludingID(string, uint) bool          { return false }
func (s *stubFichaRepoHorario) CountAll(*uint) (int64, error)                       { return 0, nil }

type stubInstFichaDiasRepo struct {
	dias []models.InstructorFichaDias
}

func (s *stubInstFichaDiasRepo) ReplaceByInstructorAndFicha(uint, uint, []uint) error { return nil }
func (s *stubInstFichaDiasRepo) FindByInstructorAndFicha(_, _ uint) ([]models.InstructorFichaDias, error) {
	return s.dias, nil
}
func (s *stubInstFichaDiasRepo) FindByInstructorID(uint) ([]models.InstructorFichaDias, error) {
	return nil, nil
}
func (s *stubInstFichaDiasRepo) DeleteByInstructorAndFicha(uint, uint) error { return nil }

func testHorarioService(ifc *models.InstructorFichaCaracterizacion, ficha *models.FichaCaracterizacion, dias []models.InstructorFichaDias) *InstructorHorarioService {
	return &InstructorHorarioService{
		instFichaRepo:     &stubInstFichaRepo{ifc: ifc},
		fichaRepo:         &stubFichaRepoHorario{ficha: ficha},
		instFichaDiasRepo: &stubInstFichaDiasRepo{dias: dias},
	}
}

func TestValidarPuedeTomarAsistencia_LegacySinDiasProgramados(t *testing.T) {
	inicio := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	fin := time.Date(2026, 12, 31, 0, 0, 0, 0, time.UTC)
	momento := time.Date(2026, 6, 3, 10, 0, 0, 0, time.UTC) // miércoles

	svc := testHorarioService(
		&models.InstructorFichaCaracterizacion{InstructorID: 1, FichaID: 6, FechaInicio: &inicio, FechaFin: &fin},
		&models.FichaCaracterizacion{
			UserAuditModel: models.UserAuditModel{BaseModel: models.BaseModel{ID: 6}},
			Status:         true,
			FechaInicio:    &inicio,
			FechaFin:       &fin,
		},
		nil,
	)
	if err := svc.ValidarPuedeTomarAsistencia(1, 6, momento); err != nil {
		t.Fatalf("esperaba nil en modo legacy, got %v", err)
	}
}

func TestValidarPuedeTomarAsistencia_ConDiasSinDiaHoy(t *testing.T) {
	inicio := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	fin := time.Date(2026, 12, 31, 0, 0, 0, 0, time.UTC)
	momento := time.Date(2026, 6, 3, 10, 0, 0, 0, time.UTC) // miércoles = 3

	svc := testHorarioService(
		&models.InstructorFichaCaracterizacion{InstructorID: 1, FichaID: 6, FechaInicio: &inicio, FechaFin: &fin},
		&models.FichaCaracterizacion{
			UserAuditModel: models.UserAuditModel{BaseModel: models.BaseModel{ID: 6}},
			Status:         true,
			FechaInicio:    &inicio,
			FechaFin:       &fin,
		},
		[]models.InstructorFichaDias{{DiaFormacionID: 1}}, // solo lunes
	)
	err := svc.ValidarPuedeTomarAsistencia(1, 6, momento)
	if err == nil {
		t.Fatal("esperaba error cuando hay programación explícita sin el día de hoy")
	}
	want := strings.ToLower(errMsgDiaNoProgramadoInstructor)
	if !strings.Contains(strings.ToLower(err.Error()), want) {
		t.Fatalf("error = %q, want contener %q", err.Error(), want)
	}
}

var _ repositories.InstructorFichaRepository = (*stubInstFichaRepo)(nil)
var _ repositories.FichaRepository = (*stubFichaRepoHorario)(nil)
var _ repositories.InstructorFichaDiasRepository = (*stubInstFichaDiasRepo)(nil)
