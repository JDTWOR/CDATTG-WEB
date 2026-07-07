package services

import (
	"testing"
	"time"
)

type stubAsistenciaRepoRango struct {
	minFecha time.Time
	ok       bool
}

func (s *stubAsistenciaRepoRango) MinFechaAsistencia(*uint) (time.Time, bool, error) {
	return s.minFecha, s.ok, nil
}

func TestResolverRangoCasosBienestar_historicoCompleto(t *testing.T) {
	min := time.Date(2024, 1, 15, 0, 0, 0, 0, time.UTC)
	repo := &stubAsistenciaRepoRango{minFecha: min, ok: true}
	rango, err := resolverRangoCasosBienestar(repo, nil, 0)
	if err != nil {
		t.Fatal(err)
	}
	if !rango.Historico {
		t.Fatal("esperaba histórico completo")
	}
	if rango.DiasAnalizados != 0 {
		t.Fatalf("dias analizados: got %d", rango.DiasAnalizados)
	}
	if !rango.FechaInicio.Equal(min) {
		t.Fatalf("fecha inicio: got %v want %v", rango.FechaInicio, min)
	}
}

func TestResolverRangoCasosBienestar_ventanaMovil(t *testing.T) {
	repo := &stubAsistenciaRepoRango{}
	rango, err := resolverRangoCasosBienestar(repo, nil, 30)
	if err != nil {
		t.Fatal(err)
	}
	if rango.Historico {
		t.Fatal("no debe ser histórico")
	}
	if rango.DiasAnalizados != 30 {
		t.Fatalf("dias: got %d", rango.DiasAnalizados)
	}
}
