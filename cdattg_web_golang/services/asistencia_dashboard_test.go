package services

import (
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

func fichaTest(id uint, numero string, j *models.Jornada) models.FichaCaracterizacion {
	return models.FichaCaracterizacion{
		UserAuditModel: models.UserAuditModel{BaseModel: models.BaseModel{ID: id}},
		Ficha:          numero,
		Jornada:        j,
	}
}

func jornadaManana() *models.Jornada {
	ext := 60
	return &models.Jornada{
		Nombre:              "MAÑANA",
		HoraInicio:          "06:00",
		HoraFin:             "13:00",
		MinutosExtensionFin: &ext,
	}
}

func jornadaTarde() *models.Jornada {
	ext := 60
	return &models.Jornada{
		Nombre:              "TARDE",
		HoraInicio:          "13:00",
		HoraFin:             "18:10",
		MinutosExtensionFin: &ext,
	}
}

func jornadaContinua() *models.Jornada {
	ext := 60
	return &models.Jornada{
		Nombre:              "JORNADA CONTINUA",
		HoraInicio:          "06:00",
		HoraFin:             "18:00",
		MinutosExtensionFin: &ext,
	}
}

func TestFiltrarFichasEsperadasDashboard_jornadaManana10am(t *testing.T) {
	loc := time.Local
	ref := time.Date(2026, 6, 2, 10, 0, 0, 0, loc) // martes 10:00
	fichas := []models.FichaCaracterizacion{
		fichaTest(1, "111", jornadaManana()),
		fichaTest(2, "222", jornadaTarde()),
		fichaTest(3, "333", jornadaContinua()),
	}
	filtered, jornadas := filtrarFichasEsperadasDashboard(fichas, ref, true)
	if len(filtered) != 2 {
		t.Fatalf("esperadas 2 fichas (mañana+continua), got %d", len(filtered))
	}
	if len(jornadas) != 2 {
		t.Fatalf("esperadas 2 jornadas activas, got %v", jornadas)
	}
}

func TestFiltrarFichasEsperadasDashboard_jornadaManana1430(t *testing.T) {
	loc := time.Local
	ref := time.Date(2026, 6, 2, 14, 30, 0, 0, loc)
	fichas := []models.FichaCaracterizacion{
		fichaTest(1, "111", jornadaManana()),
		fichaTest(2, "222", jornadaTarde()),
	}
	filtered, _ := filtrarFichasEsperadasDashboard(fichas, ref, true)
	if len(filtered) != 1 || filtered[0].ID != 2 {
		t.Fatalf("a las 14:30 solo tarde, got %+v", filtered)
	}
}

func TestFiltrarFichasEsperadasDashboard_fechaHistoricaSinFiltroHorario(t *testing.T) {
	ref := time.Date(2026, 6, 2, 10, 0, 0, 0, time.Local)
	fichas := []models.FichaCaracterizacion{
		fichaTest(1, "111", jornadaManana()),
		fichaTest(2, "222", jornadaTarde()),
	}
	filtered, jornadas := filtrarFichasEsperadasDashboard(fichas, ref, false)
	if len(filtered) != 2 {
		t.Fatalf("fecha histórica incluye todas, got %d", len(filtered))
	}
	if len(jornadas) != 2 {
		t.Fatalf("jornadas históricas: %v", jornadas)
	}
}

func TestValidarHorarioJornadaModelAt_continuaEnVentana(t *testing.T) {
	loc := time.Local
	j := jornadaContinua()
	for _, h := range []int{6, 12, 17} {
		now := time.Date(2026, 6, 2, h, 30, 0, 0, loc)
		if !ValidarHorarioJornadaModelAt(j, now) {
			t.Fatalf("continua debería estar activa a las %d:30", h)
		}
	}
	now := time.Date(2026, 6, 2, 5, 30, 0, 0, loc)
	if ValidarHorarioJornadaModelAt(j, now) {
		t.Fatal("continua no debería estar activa a las 5:30")
	}
}
