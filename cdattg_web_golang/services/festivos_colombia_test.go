package services

import (
	"testing"
	"time"
)

func TestTrasladarFestivoEmiliani_LunesSeMantiene(t *testing.T) {
	got := trasladarFestivoEmiliani(2024, 1, 1) // lunes
	want := time.Date(2024, 1, 1, 0, 0, 0, 0, time.Local)
	if !got.Equal(want) {
		t.Fatalf("esperaba %v, got %v", want, got)
	}
}

func TestTrasladarFestivoEmiliani_SabadoAlLunes(t *testing.T) {
	got := trasladarFestivoEmiliani(2029, 1, 6) // sábado
	want := time.Date(2029, 1, 8, 0, 0, 0, 0, time.Local)
	if !got.Equal(want) {
		t.Fatalf("esperaba %v, got %v", want, got)
	}
}

func TestGenerarFestivosColombiaAnio2026_ContieneFijos(t *testing.T) {
	festivos := GenerarFestivosColombiaAnio(2026)
	fechas := map[string]string{}
	for _, f := range festivos {
		fechas[f.Fecha.Format(time.DateOnly)] = f.Nombre
	}
	for _, want := range []string{"2026-01-01", "2026-05-01", "2026-07-20", "2026-12-25"} {
		if _, ok := fechas[want]; !ok {
			t.Fatalf("falta festivo fijo %s", want)
		}
	}
}

func TestEasterSunday2026(t *testing.T) {
	got := easterSunday(2026)
	want := time.Date(2026, 4, 5, 0, 0, 0, 0, time.Local)
	if !got.Equal(want) {
		t.Fatalf("Pascua 2026 esperada %v, got %v", want, got)
	}
}
