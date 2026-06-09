package services

import (
	"strings"
	"testing"
	"time"
)

func TestValidarHorariosSinSolape_aceptaBloquesDisjuntos(t *testing.T) {
	bloques := []HorarioBloqueInput{
		{DiaFormacionID: 1, HoraInicio: "18:00", HoraFin: "23:00"},
		{DiaFormacionID: 6, HoraInicio: "15:00", HoraFin: "19:00"},
	}
	if err := ValidarHorariosSinSolape(bloques); err != nil {
		t.Fatalf("esperaba sin error (ficha 3151098), got %v", err)
	}
}

func TestValidarHorariosSinSolape_rechazaSolapeMismoDia(t *testing.T) {
	bloques := []HorarioBloqueInput{
		{DiaFormacionID: 1, HoraInicio: "10:00", HoraFin: "12:00"},
		{DiaFormacionID: 1, HoraInicio: "11:00", HoraFin: "13:00"},
	}
	err := ValidarHorariosSinSolape(bloques)
	if err == nil {
		t.Fatal("esperaba error de solape")
	}
	if !strings.Contains(err.Error(), "solapan") {
		t.Fatalf("mensaje inesperado: %v", err)
	}
}

func TestValidarHorariosSinSolape_rechazaDiurnaTardeContinuaMismoDia(t *testing.T) {
	bloques := []HorarioBloqueInput{
		{DiaFormacionID: 1, HoraInicio: "06:30", HoraFin: "13:00"},
		{DiaFormacionID: 1, HoraInicio: "13:00", HoraFin: "18:00"},
		{DiaFormacionID: 1, HoraInicio: "06:00", HoraFin: "18:00"},
	}
	err := ValidarHorariosSinSolape(bloques)
	if err == nil {
		t.Fatal("esperaba error al combinar plantillas solapadas el mismo día")
	}
}

func TestMomentoEnAlgunBloque_ficha3151098Sabado(t *testing.T) {
	bloques := []HorarioBloqueInput{
		{DiaFormacionID: 1, HoraInicio: "18:00", HoraFin: "23:00"},
		{DiaFormacionID: 6, HoraInicio: "15:00", HoraFin: "19:00"},
	}
	// Sábado 16:00 dentro del bloque custom
	now := mustParseLocal(t, "2026-06-06T16:00:00")
	if !MomentoEnAlgunBloque(bloques, 0, now) {
		t.Fatal("16:00 sábado debería estar en ventana del bloque 15:00–19:00")
	}
}

func mustParseLocal(t *testing.T, iso string) (tm time.Time) {
	t.Helper()
	parsed, err := time.ParseInLocation("2006-01-02T15:04:05", iso, time.Local)
	if err != nil {
		t.Fatalf("parse time: %v", err)
	}
	return parsed
}
