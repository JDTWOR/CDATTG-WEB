// +build ignore

package main

import (
	"fmt"
	"log"
	"strings"
	"github.com/xuri/excelize/v2"
)

func main() {
	f, err := excelize.OpenFile("Catalogo.xlsx")
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()
	name := f.GetSheetList()[0]
	rows, _ := f.GetRows(name)
	fmt.Println("Total rows:", len(rows))
	h := rows[0]
	for i, c := range h {
		fmt.Printf("  %d: %q\n", i, strings.TrimSpace(c))
	}
	// find Red de Conocimiento and TIPO DE FORMACION
	var idxRed, idxTipo int = -1, -1
	for i, c := range h {
		s := strings.TrimSpace(strings.ToUpper(c))
		if strings.Contains(s, "RED") && strings.Contains(s, "CONOCIMIENTO") { idxRed = i }
		if strings.Contains(s, "TIPO") && strings.Contains(s, "FORMACION") { idxTipo = i }
	}
	fmt.Println("Idx Red de Conocimiento:", idxRed, "Idx TIPO DE FORMACION:", idxTipo)
	idxNivel := 5 // NIVEL DE FORMACION
	tipos := make(map[string]int)
	niveles := make(map[string]int)
	for i := 1; i < len(rows); i++ {
		row := rows[i]
		if idxTipo < len(row) { tipos[strings.TrimSpace(row[idxTipo])]++ }
		if idxNivel < len(row) { niveles[strings.TrimSpace(row[idxNivel])]++ }
	}
	fmt.Println("\nValores en TIPO DE FORMACION:")
	for t, n := range tipos { fmt.Printf("  %q: %d\n", t, n) }
	fmt.Println("\nValores en NIVEL DE FORMACION (muestra):")
	n := 0
	for niv, c := range niveles {
		fmt.Printf("  %q: %d\n", niv, c)
		n++
		if n >= 25 { break }
	}
	// sample rows TITULADA (técnico/tecnólogo suelen ser titulada) o cualquier con version > 1
	count := 0
	for i := 1; i < len(rows) && count < 5; i++ {
		row := rows[i]
		if idxTipo >= len(row) { continue }
		tipo := strings.TrimSpace(strings.ToUpper(row[idxTipo]))
		nivel := ""
		if idxNivel < len(row) { nivel = strings.TrimSpace(row[idxNivel]) }
		// show TITULADA or rows where NIVEL contains TECN
		if tipo != "TITULADA" && !strings.Contains(strings.ToUpper(nivel), "TECN") { continue }
		count++
		fmt.Printf("\n--- Row %d ---\n", i+1)
		fmt.Printf("  codigo=%q version=%q tipo=%q nombre=%q red=%q dur=%q\n",
			safe(row, 0), safe(row, 1), safe(row, idxTipo), safe(row, 4), safe(row, idxRed), safe(row, 6))
	}
}

func safe(row []string, i int) string {
	if i < len(row) { return row[i] }
	return ""
}
