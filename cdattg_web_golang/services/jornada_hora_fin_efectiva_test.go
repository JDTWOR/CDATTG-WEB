package services

import (
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

func TestHoraFinEfectivaParaSesion_UsaUltimoBloqueMasExtension(t *testing.T) {
	ext := 30
	j := &models.Jornada{
		HoraInicio:          "",
		HoraFin:             "",
		MinutosExtensionFin: &ext,
	}
	ficha := &models.FichaCaracterizacion{
		Jornada: j,
		JornadaID: func() *uint {
			id := uint(1)
			return &id
		}(),
		FichaDiasFormacion: []models.FichaDiasFormacion{
			{DiaFormacionID: 1, HoraInicio: "06:00", HoraFin: "12:00"},
			{DiaFormacionID: 1, HoraInicio: "13:00", HoraFin: "17:00"},
		},
	}
	dia := time.Date(2026, 6, 15, 0, 0, 0, 0, time.Local) // lunes
	if WeekdayToDiaFormacionID(dia.Weekday()) != 1 {
		t.Skip("catálogo de días no coincide con lunes=2 en este entorno")
	}
	fin := HoraFinEfectivaParaSesion(j, ficha, dia)
	esperado := instanteHoraEnDia(dia, "17:00").Add(30 * time.Minute)
	if !fin.Equal(esperado) {
		t.Fatalf("fin efectivo = %v, esperado %v", fin, esperado)
	}
}

func TestHoraFinEfectivaParaSesion_AntesDeFinNoCierra(t *testing.T) {
	ext := 30
	j := &models.Jornada{
		MinutosExtensionFin: &ext,
		HoraFin:             "13:00",
	}
	ficha := &models.FichaCaracterizacion{
		Jornada: j,
		FichaDiasFormacion: []models.FichaDiasFormacion{
			{DiaFormacionID: 1, HoraInicio: "06:00", HoraFin: "13:00"},
		},
	}
	dia := time.Date(2026, 6, 15, 0, 0, 0, 0, time.Local)
	if WeekdayToDiaFormacionID(dia.Weekday()) != 1 {
		t.Skip("catálogo de días no coincide con lunes=2 en este entorno")
	}
	fin := HoraFinEfectivaParaSesion(j, ficha, dia)
	antes := instanteHoraEnDia(dia, "13:15")
	if !antes.Before(fin) {
		t.Fatalf("13:15 debería ser antes del cierre %v", fin)
	}
}

func TestHoraFinEfectivaParaSesion_FallbackLegacySinBloques(t *testing.T) {
	ext := 15
	j := &models.Jornada{
		HoraInicio:          "06:00",
		HoraFin:             "13:00",
		MinutosExtensionFin: &ext,
	}
	dia := time.Date(2026, 6, 15, 0, 0, 0, 0, time.Local)
	fin := HoraFinEfectivaParaSesion(j, nil, dia)
	esperado := HoraFinEfectiva(j, dia)
	if !fin.Equal(esperado) {
		t.Fatalf("fallback legacy = %v, esperado %v", fin, esperado)
	}
}
