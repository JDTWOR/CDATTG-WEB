package services

import (
	"errors"
	"testing"
	"time"
)

func TestSegundosRestantesParaSalida(t *testing.T) {
	ingreso := time.Date(2026, 6, 4, 10, 0, 0, 0, time.UTC)

	cases := []struct {
		name   string
		ahora  time.Time
		want   int
	}{
		{"justo al ingresar", ingreso, 60},
		{"a los 30s", ingreso.Add(30 * time.Second), 30},
		{"al minuto", ingreso.Add(60 * time.Second), 0},
		{"pasado el minuto", ingreso.Add(90 * time.Second), 0},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := segundosRestantesParaSalida(ingreso, tc.ahora)
			if got != tc.want {
				t.Fatalf("segundosRestantesParaSalida() = %d, want %d", got, tc.want)
			}
		})
	}
}

func TestEsErrorEsperaMinutoSalida(t *testing.T) {
	if !esErrorEsperaMinutoSalida(errors.New(errMsgEsperaMinutoSalida)) {
		t.Fatal("esperaba true para error de espera de salida")
	}
	if esErrorEsperaMinutoSalida(errors.New("otro error")) {
		t.Fatal("esperaba false para otro error")
	}
}
