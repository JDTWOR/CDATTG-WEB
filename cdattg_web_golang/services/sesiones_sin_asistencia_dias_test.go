package services

import (
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/repositories"
)

func TestClaveSesionInstructorFicha_estable(t *testing.T) {
	fecha := time.Date(2026, 3, 10, 0, 0, 0, 0, time.UTC)
	k1 := claveSesionInstructorFicha(42, fecha)
	k2 := claveSesionInstructorFicha(42, fecha)
	if k1 != k2 {
		t.Fatalf("clave inestable: %q vs %q", k1, k2)
	}
	if k1 != "42|2026-03-10" {
		t.Fatalf("clave: got %q", k1)
	}
}

func TestCompararIncumplimientoAsistencia_fechaRecientePrimero(t *testing.T) {
	older := repositories.SesionSinAsistenciaTomadaRow{
		Fecha: time.Date(2026, 3, 1, 0, 0, 0, 0, time.UTC),
	}
	newer := repositories.SesionSinAsistenciaTomadaRow{
		Fecha: time.Date(2026, 3, 10, 0, 0, 0, 0, time.UTC),
	}
	if compararIncumplimientoAsistencia(newer, older) >= 0 {
		t.Fatal("fecha más reciente debe ordenar antes")
	}
}
