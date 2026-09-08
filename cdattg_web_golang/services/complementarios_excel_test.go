package services

import (
	"encoding/json"
	"testing"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/xuri/excelize/v2"
)

// excelDesdeFilas construye un xlsx en memoria con una sola hoja y las filas dadas.
func excelDesdeFilas(t *testing.T, filas [][]string) []byte {
	t.Helper()
	f := excelize.NewFile()
	defer func() { _ = f.Close() }()
	for i, fila := range filas {
		for j, celda := range fila {
			col, err := excelize.ColumnNumberToName(j + 1)
			if err != nil {
				t.Fatalf("col %d: %v", j, err)
			}
			if err := f.SetCellValue("Sheet1", col+string(rune('1'+i)), celda); err != nil {
				t.Fatalf("SetCellValue %d,%d: %v", i, j, err)
			}
		}
	}
	buf, err := f.WriteToBuffer()
	if err != nil {
		t.Fatalf("WriteToBuffer: %v", err)
	}
	return buf.Bytes()
}

func TestParsearLoteExcel_dedupYSaltaInvalidos(t *testing.T) {
	t.Parallel()
	contenido := excelDesdeFilas(t, [][]string{
		{"numero_documento", "tipo_documento"},
		{"1118028779", "CC"},
		{"1118028779", "TI"}, // duplicado: se descarta
		{"abc123"},           // no numérico: se descarta
		{"96355056", " CE "},
		{"", "CC"},
	})
	docs, err := ParsearLoteExcel(contenido)
	if err != nil {
		t.Fatalf("ParsearLoteExcel: %v", err)
	}
	if len(docs) != 2 {
		t.Fatalf("esperaba 2 documentos, obtuve %d: %+v", len(docs), docs)
	}
	if docs[0].NumeroDocumento != "1118028779" || docs[0].TipoDocumento != "CC" {
		t.Fatalf("doc0=%+v", docs[0])
	}
	if docs[1].NumeroDocumento != "96355056" || docs[1].TipoDocumento != "CE" {
		t.Fatalf("doc1=%+v", docs[1])
	}
}

func TestParsearLoteInscripcionesExcel_dedupPorClave(t *testing.T) {
	t.Parallel()
	contenido := excelDesdeFilas(t, [][]string{
		{"numero_documento", "programa", "tipo_documento"},
		{"1120955821", "TECNOLOGO EN ANALISIS Y DESARROLLO DE SOFTWARE", "CC"},
		{"1120955821", "tecnologo en analisis y desarrollo de software", "TI"}, // duplicado (case-insensitive)
		{"1120955821", "TECNOLOGO EN OTRO PROGRAMA", "TI"},                     // distinto programa: válido
		{"abc", "PROGRAMA"},                                                    // documento no numérico
		{"555", ""},                                                            // sin programa
	})
	filas, err := ParsearLoteInscripcionesExcel(contenido)
	if err != nil {
		t.Fatalf("ParsearLoteInscripcionesExcel: %v", err)
	}
	if len(filas) != 2 {
		t.Fatalf("esperaba 2 filas, obtuve %d: %+v", len(filas), filas)
	}
	if filas[0].NumeroDocumento != "1120955821" || filas[0].Programa != "TECNOLOGO EN ANALISIS Y DESARROLLO DE SOFTWARE" {
		t.Fatalf("fila0=%+v", filas[0])
	}
	if filas[1].NumeroDocumento != "1120955821" || filas[1].Programa != "TECNOLOGO EN OTRO PROGRAMA" {
		t.Fatalf("fila1=%+v", filas[1])
	}
}

func TestParsearLoteExcel_sinFilaDeEncabezado(t *testing.T) {
	t.Parallel()
	contenido := excelDesdeFilas(t, [][]string{
		{"1118028779", "CC"},
		{"96355056"},
	})
	docs, err := ParsearLoteExcel(contenido)
	if err != nil {
		t.Fatalf("ParsearLoteExcel: %v", err)
	}
	if len(docs) != 2 {
		t.Fatalf("esperaba 2 documentos, obtuve %d", len(docs))
	}
}

func TestParsearLoteExcel_excelCorrupto(t *testing.T) {
	t.Parallel()
	if _, err := ParsearLoteExcel([]byte("no soy un xlsx")); err == nil {
		t.Fatal("esperaba error al abrir un archivo corrupto")
	}
}

func TestParsearLoteInscripcionesExcel_excelCorrupto(t *testing.T) {
	t.Parallel()
	if _, err := ParsearLoteInscripcionesExcel([]byte("no soy un xlsx")); err == nil {
		t.Fatal("esperaba error al abrir un archivo corrupto")
	}
}

func TestGenerarPlantillaLote_parseaFilaEjemplo(t *testing.T) {
	t.Parallel()
	buf, err := GenerarPlantillaLote()
	if err != nil {
		t.Fatalf("GenerarPlantillaLote: %v", err)
	}
	docs, err := ParsearLoteExcel(buf)
	if err != nil {
		t.Fatalf("ParsearLoteExcel(plantilla): %v", err)
	}
	if len(docs) != 1 || docs[0].NumeroDocumento != "1012345678" {
		t.Fatalf("docs=%+v", docs)
	}
}

func TestGenerarPlantillaInscripciones_parseaFilaEjemplo(t *testing.T) {
	t.Parallel()
	buf, err := GenerarPlantillaInscripciones()
	if err != nil {
		t.Fatalf("GenerarPlantillaInscripciones: %v", err)
	}
	filas, err := ParsearLoteInscripcionesExcel(buf)
	if err != nil {
		t.Fatalf("ParsearLoteInscripcionesExcel(plantilla): %v", err)
	}
	if len(filas) != 1 {
		t.Fatalf("filas=%+v", filas)
	}
	if filas[0].NumeroDocumento != "1120955821" || filas[0].Programa == "" || filas[0].TipoDocumento != "CC" {
		t.Fatalf("fila0=%+v", filas[0])
	}
}

func TestEsFilaEncabezadoDocumento(t *testing.T) {
	t.Parallel()
	casos := []struct {
		entrada string
		es      bool
	}{
		{"numero_documento", true},
		{"Documento de identidad", true},
		{"1118028779", false},
	}
	for _, c := range casos {
		if got := esFilaEncabezadoDocumento(c.entrada); got != c.es {
			t.Errorf("esFilaEncabezadoDocumento(%q)=%v, esperado %v", c.entrada, got, c.es)
		}
	}
}

func TestLoteInscripcionFila_jsonRoundTrip(t *testing.T) {
	t.Parallel()
	fila := dto.LoteInscripcionFila{NumeroDocumento: "1120955821", Programa: "TECNOLOGO", TipoDocumento: "CC"}
	datos, err := json.Marshal(fila)
	if err != nil {
		t.Fatalf("Marshal: %v", err)
	}
	var vuelta dto.LoteInscripcionFila
	if err := json.Unmarshal(datos, &vuelta); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	if vuelta != fila {
		t.Fatalf("round trip=%+v, esperado %+v", vuelta, fila)
	}
}