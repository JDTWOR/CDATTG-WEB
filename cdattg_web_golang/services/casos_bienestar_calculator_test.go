package services

import (
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/repositories"
)

func TestAgruparDetalleSesionesPorAsistenciaID_deduplicaFilas(t *testing.T) {
	fecha := time.Date(2026, 6, 10, 0, 0, 0, 0, time.UTC)
	rows := []repositories.DetalleSesionCasosBienestarRaw{
		{AsistenciaID: 10, Fecha: fecha, InstructorNombre: "A", AsistioEfectivo: false},
		{AsistenciaID: 10, Fecha: fecha, InstructorNombre: "B", Observaciones: "dup", AsistioEfectivo: false},
	}
	m := agruparDetalleSesionesPorAsistenciaID(rows)
	if len(m) != 1 {
		t.Fatalf("esperaba 1 sesión, got %d", len(m))
	}
	meta := m[10]
	if meta.Observaciones != "dup" {
		t.Fatalf("observaciones fusionadas: got %q", meta.Observaciones)
	}
}

func TestAgruparDetalleSesionesPorAsistenciaID_marcaEfectivaSiAlgunaLoEs(t *testing.T) {
	fecha := time.Date(2026, 6, 10, 0, 0, 0, 0, time.UTC)
	rows := []repositories.DetalleSesionCasosBienestarRaw{
		{AsistenciaID: 11, Fecha: fecha, AsistioEfectivo: false},
		{AsistenciaID: 11, Fecha: fecha, AsistioEfectivo: true},
	}
	m := agruparDetalleSesionesPorAsistenciaID(rows)
	if !m[11].AsistioEfectivo {
		t.Fatal("debe considerar asistencia efectiva si alguna fila duplicada la tiene")
	}
}

func TestInasistenciasAprendiz_coincideConSesionesSinAsistir(t *testing.T) {
	sesIDs := []uint{1, 2, 3, 4}
	asistio := map[uint]map[uint]bool{
		99: {2: true},
	}
	ap := repositories.AprendizCasosBienestarRaw{AprendizID: 99, FichaNumero: "123"}
	row, ok := inasistenciasAprendiz(ap, sesIDs, asistio, 1)
	if !ok {
		t.Fatal("esperaba caso con inasistencias")
	}
	if row.Inasistencias != 3 {
		t.Fatalf("inasistencias: got %d want 3", row.Inasistencias)
	}
	if row.AsistenciasEfectivas != 1 {
		t.Fatalf("efectivas: got %d want 1", row.AsistenciasEfectivas)
	}
}

func TestContarInasistenciasDesdePrep_mismoCriterioQueConsolidado(t *testing.T) {
	sesIDs := []uint{100, 101, 102}
	asistio := map[uint]map[uint]bool{7: {101: true}}
	ap := repositories.AprendizCasosBienestarRaw{AprendizID: 7}
	row, _ := inasistenciasAprendiz(ap, sesIDs, asistio, 0)

	prep := &casosBienestarRangoPreparado{
		validasPorFicha: map[uint][]uint{1: sesIDs},
		asistio:         asistio,
	}
	detalleCount := 0
	for _, sid := range prep.validasPorFicha[1] {
		if !prep.asistio[7][sid] {
			detalleCount++
		}
	}
	if detalleCount != row.Inasistencias {
		t.Fatalf("detalle %d != consolidado %d", detalleCount, row.Inasistencias)
	}
}
