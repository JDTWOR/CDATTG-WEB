package seeders

import "testing"

func TestJornadaBloquesSeed_conteos(t *testing.T) {
	if len(jornadaBloquesSeed["JORNADA CONTINUA"]) != 5 {
		t.Fatalf("JORNADA CONTINUA debe tener 5 bloques (Lun–Vie), got %d", len(jornadaBloquesSeed["JORNADA CONTINUA"]))
	}
	if len(jornadaBloquesSeed["FINES DE SEMANA"]) != 6 {
		t.Fatalf("FINES DE SEMANA debe tener 6 bloques, got %d", len(jornadaBloquesSeed["FINES DE SEMANA"]))
	}
}

func TestJornadaBloquesSeed_finesDeSemana_dosBloquesPorDia(t *testing.T) {
	bloques := jornadaBloquesSeed["FINES DE SEMANA"]
	byDay := map[uint]int{}
	for _, b := range bloques {
		byDay[b.DiaID]++
	}
	for _, dia := range []uint{5, 6, 7} {
		if byDay[dia] != 2 {
			t.Fatalf("día %d debe tener 2 bloques, got %d", dia, byDay[dia])
		}
	}
}
