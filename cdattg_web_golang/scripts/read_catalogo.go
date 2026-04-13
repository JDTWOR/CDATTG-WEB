//go:build ignore

package main

import (
	"fmt"
	"log"
	"strings"

	"github.com/xuri/excelize/v2"
)

const idxNivelFormacion = 5 // NIVEL DE FORMACION (columna fija en el catálogo esperado)

func main() {
	f, err := excelize.OpenFile("Catalogo.xlsx")
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()
	name := f.GetSheetList()[0]
	rows, err := f.GetRows(name)
	if err != nil {
		log.Fatal(err)
	}
	if len(rows) == 0 {
		log.Fatal("hoja sin filas")
	}
	fmt.Println("Total rows:", len(rows))
	h := rows[0]
	for i, c := range h {
		fmt.Printf("  %d: %q\n", i, strings.TrimSpace(c))
	}
	idxRed, idxTipo := findRedAndTipoColumnIndices(h)
	fmt.Println("Idx Red de Conocimiento:", idxRed, "Idx TIPO DE FORMACION:", idxTipo)

	tipos, niveles := countTipoAndNivel(rows, idxTipo, idxNivelFormacion)
	printTipoCounts(tipos)
	printNivelSample(niveles, 25)
	printSampleTituladaRows(rows, idxRed, idxTipo, idxNivelFormacion)
}

func findRedAndTipoColumnIndices(h []string) (idxRed, idxTipo int) {
	idxRed, idxTipo = -1, -1
	for i, c := range h {
		s := strings.TrimSpace(strings.ToUpper(c))
		if strings.Contains(s, "RED") && strings.Contains(s, "CONOCIMIENTO") {
			idxRed = i
		}
		if strings.Contains(s, "TIPO") && strings.Contains(s, "FORMACION") {
			idxTipo = i
		}
	}
	return idxRed, idxTipo
}

func countTipoAndNivel(rows [][]string, idxTipo, idxNivel int) (tipos, niveles map[string]int) {
	tipos = make(map[string]int)
	niveles = make(map[string]int)
	for i := 1; i < len(rows); i++ {
		row := rows[i]
		if idxTipo >= 0 && idxTipo < len(row) {
			tipos[strings.TrimSpace(row[idxTipo])]++
		}
		if idxNivel < len(row) {
			niveles[strings.TrimSpace(row[idxNivel])]++
		}
	}
	return tipos, niveles
}

func printTipoCounts(tipos map[string]int) {
	fmt.Println("\nValores en TIPO DE FORMACION:")
	for t, n := range tipos {
		fmt.Printf("  %q: %d\n", t, n)
	}
}

func printNivelSample(niveles map[string]int, max int) {
	fmt.Println("\nValores en NIVEL DE FORMACION (muestra):")
	n := 0
	for niv, c := range niveles {
		fmt.Printf("  %q: %d\n", niv, c)
		n++
		if n >= max {
			break
		}
	}
}

func printSampleTituladaRows(rows [][]string, idxRed, idxTipo, idxNivel int) {
	const maxSamples = 5
	count := 0
	for i := 1; i < len(rows) && count < maxSamples; i++ {
		row := rows[i]
		if idxTipo < 0 || idxTipo >= len(row) {
			continue
		}
		tipo := strings.TrimSpace(strings.ToUpper(row[idxTipo]))
		nivel := nivelCell(row, idxNivel)
		if tipo != "TITULADA" && !strings.Contains(strings.ToUpper(nivel), "TECN") {
			continue
		}
		count++
		fmt.Printf("\n--- Row %d ---\n", i+1)
		fmt.Printf("  codigo=%q version=%q tipo=%q nombre=%q red=%q dur=%q\n",
			safe(row, 0), safe(row, 1), safe(row, idxTipo), safe(row, 4), safe(row, idxRed), safe(row, 6))
	}
}

func nivelCell(row []string, idxNivel int) string {
	if idxNivel < len(row) {
		return strings.TrimSpace(row[idxNivel])
	}
	return ""
}

func safe(row []string, i int) string {
	if i < len(row) {
		return row[i]
	}
	return ""
}
