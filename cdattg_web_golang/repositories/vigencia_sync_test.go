// @module vigencia_sync
// @description Tests del throttle de sincronización de vigencia (fichas e instructores).
// @author JDTWOR
// @created 2026-08-15
package repositories

import (
	"testing"
	"time"
)

func TestSincronizacionVigenciaPermitida(t *testing.T) {
	base := time.Date(2026, 8, 15, 10, 0, 0, 0, time.UTC)
	cases := []struct {
		name     string
		last     time.Time
		now      time.Time
		interval time.Duration
		want     bool
	}{
		{"primera vez siempre permite", time.Time{}, base, time.Minute, true},
		{"justo en el intervalo permite", base.Add(-time.Minute), base, time.Minute, true},
		{"antes del intervalo bloquea", base.Add(-30 * time.Second), base, time.Minute, false},
		{"despues del intervalo permite", base.Add(-2 * time.Minute), base, time.Minute, true},
		{"last futura bloquea (reloj atrasado)", base.Add(time.Minute), base, time.Minute, false},
		{"intervalo cero siempre permite", base.Add(-time.Second), base, 0, true},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := sincronizacionVigenciaPermitida(c.last, c.now, c.interval); got != c.want {
				t.Fatalf("got=%v want=%v", got, c.want)
			}
		})
	}
}
