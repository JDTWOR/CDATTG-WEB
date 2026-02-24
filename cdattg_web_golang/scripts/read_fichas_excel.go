//go:build ignore

package main

import (
	"fmt"
	"log"
	"strings"

	"github.com/xuri/excelize/v2"
)

func main() {
	f, err := excelize.OpenFile("3388883.xlsx")
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()
	name := f.GetSheetList()[0]
	rows, _ := f.GetRows(name)
	fmt.Println("Total rows:", len(rows))
	for i := 0; i < len(rows) && i < 15; i++ {
		fmt.Printf("\n--- Row %d ---\n", i+1)
		for j, c := range rows[i] {
			s := strings.TrimSpace(c)
			if len(s) > 50 {
				s = s[:50] + "..."
			}
			if s != "" {
				fmt.Printf("  %d: %q\n", j, s)
			}
		}
	}
}
