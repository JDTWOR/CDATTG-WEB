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



func TestAgruparDetalleSesionesPorAsistenciaID_marcaJustificadaSiAlgunaLoEs(t *testing.T) {

	fecha := time.Date(2026, 6, 10, 0, 0, 0, 0, time.UTC)

	rows := []repositories.DetalleSesionCasosBienestarRaw{

		{AsistenciaID: 12, Fecha: fecha, Justificada: false},

		{AsistenciaID: 12, Fecha: fecha, Justificada: true},

	}

	m := agruparDetalleSesionesPorAsistenciaID(rows)

	if !m[12].Justificada {

		t.Fatal("debe considerar justificada si alguna fila duplicada lo indica")

	}

}



func TestInasistenciasAprendiz_coincideConSesionesSinAsistir(t *testing.T) {

	sesIDs := []uint{1, 2, 3, 4}

	asistio := map[uint]map[uint]bool{

		99: {2: true},

	}

	ap := repositories.AprendizCasosBienestarRaw{AprendizID: 99, FichaNumero: "123"}

	row, ok := inasistenciasAprendiz(ap, sesIDs, asistio, map[uint]map[uint]bool{}, 1)

	if !ok {

		t.Fatal("esperaba caso con inasistencias")

	}

	if row.Inasistencias != 3 {

		t.Fatalf("inasistencias sin justificar: got %d want 3", row.Inasistencias)

	}

	if row.AsistenciasEfectivas != 1 {

		t.Fatalf("efectivas: got %d want 1", row.AsistenciasEfectivas)

	}

}



func TestInasistenciasAprendiz_excluyeJustificadasDelUmbral(t *testing.T) {

	sesIDs := []uint{1, 2, 3, 4, 5}

	asistio := map[uint]map[uint]bool{}

	justificada := map[uint]map[uint]bool{

		50: {1: true, 2: true, 3: true},

	}

	ap := repositories.AprendizCasosBienestarRaw{AprendizID: 50}

	row, ok := inasistenciasAprendiz(ap, sesIDs, asistio, justificada, 2)

	if !ok {

		t.Fatal("esperaba caso: 2 sin justificar y 3 justificadas")

	}

	if row.Inasistencias != 2 {

		t.Fatalf("sin justificar: got %d want 2", row.Inasistencias)

	}

	if row.InasistenciasJustificadas != 3 {

		t.Fatalf("justificadas: got %d want 3", row.InasistenciasJustificadas)

	}

}



func TestInasistenciasAprendiz_noAlertaSiSoloJustificadasSuperanUmbral(t *testing.T) {

	sesIDs := []uint{1, 2, 3}

	justificada := map[uint]map[uint]bool{

		51: {1: true, 2: true, 3: true},

	}

	ap := repositories.AprendizCasosBienestarRaw{AprendizID: 51}

	_, ok := inasistenciasAprendiz(ap, sesIDs, map[uint]map[uint]bool{}, justificada, 3)

	if ok {

		t.Fatal("no debe alertar si todas las inasistencias están justificadas")

	}

}



func TestContarInasistenciasDesdePrep_mismoCriterioQueConsolidado(t *testing.T) {

	sesIDs := []uint{100, 101, 102}

	asistio := map[uint]map[uint]bool{7: {101: true}}

	justificada := map[uint]map[uint]bool{7: {100: true}}

	ap := repositories.AprendizCasosBienestarRaw{AprendizID: 7}

	row, _ := inasistenciasAprendiz(ap, sesIDs, asistio, justificada, 0)



	prep := &casosBienestarRangoPreparado{

		validasPorFicha: map[uint][]uint{1: sesIDs},

		asistio:         asistio,

		justificada:     justificada,

	}

	detalleCount := 0

	for _, sid := range prep.validasPorFicha[1] {

		if !prep.asistio[7][sid] && !prep.justificada[7][sid] {

			detalleCount++

		}

	}

	if detalleCount != row.Inasistencias {

		t.Fatalf("detalle %d != consolidado %d", detalleCount, row.Inasistencias)

	}

	if row.Inasistencias != 1 {

		t.Fatalf("sin justificar: got %d want 1", row.Inasistencias)

	}

	if row.InasistenciasJustificadas != 1 {

		t.Fatalf("justificadas: got %d want 1", row.InasistenciasJustificadas)

	}

}



func TestInasistenciasAprendiz_excluyeSesionSinAsistenciaTomadaEnTotal(t *testing.T) {

	sesIDs := []uint{2}

	asistio := map[uint]map[uint]bool{99: {2: true}}

	ap := repositories.AprendizCasosBienestarRaw{AprendizID: 99}

	row, ok := inasistenciasAprendiz(ap, sesIDs, asistio, map[uint]map[uint]bool{}, 1)

	if ok {

		t.Fatalf("con una sola sesión válida y asistencia, no debe superar umbral: inasistencias=%d", row.Inasistencias)

	}

}

func TestClasificarInasistenciasDetalle_separaJustificadas(t *testing.T) {
	fecha := time.Date(2026, 6, 10, 0, 0, 0, 0, time.UTC)
	prep := &casosBienestarRangoPreparado{
		validasPorFicha: map[uint][]uint{1: {10, 11, 12}},
		validaPorID: map[uint]repositories.SesionCasosBienestarRaw{
			10: {AsistenciaID: 10, Fecha: fecha},
			11: {AsistenciaID: 11, Fecha: fecha},
			12: {AsistenciaID: 12, Fecha: fecha},
		},
		asistio:     map[uint]map[uint]bool{7: {12: true}},
		justificada: map[uint]map[uint]bool{7: {10: true}},
	}
	meta := map[uint]repositories.DetalleSesionCasosBienestarRaw{
		11: {AsistenciaID: 11, Fecha: fecha, Justificada: true, Observaciones: "excusa"},
	}

	sinJustificar, justificadas := clasificarInasistenciasDetalle(prep, 1, 7, meta)
	if len(sinJustificar) != 0 {
		t.Fatalf("sin justificar: got %d want 0", len(sinJustificar))
	}
	if len(justificadas) != 2 {
		t.Fatalf("justificadas: got %d want 2", len(justificadas))
	}
}

