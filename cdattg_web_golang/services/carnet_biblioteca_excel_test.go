/**
 * Pruebo el orden del Excel y el filtro por ficha.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/dto"
)

func TestFilaExcelBiblioteca(t *testing.T) {
	t.Parallel()
	got := filaExcelBiblioteca(dto.CarnetBibliotecaItem{
		PrimerNombre: "Ana", SegundoNombre: "Maria",
		PrimerApellido: "Rojas", SegundoApellido: "Perez",
		NumeroDocumento: "1", Rh: "O+", Programa: "ADSO", FichaNumero: "8",
	})
	want := []string{"Ana", "Maria", "Rojas", "Perez", "1", "O+", "ADSO", "8"}
	if len(got) != len(want) {
		t.Fatalf("%v", got)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("col %d %q != %q", i, got[i], want[i])
		}
	}
}

func TestFiltrarItemsBiblioteca(t *testing.T) {
	t.Parallel()
	list := []dto.CarnetBibliotecaItem{{ID: 1, FichaID: 8}, {ID: 2, FichaID: 9}}
	if n := filtrarItemsBiblioteca(list, 0); len(n) != 2 {
		t.Fatalf("todas %d", len(n))
	}
	solo := filtrarItemsBiblioteca(list, 8)
	if len(solo) != 1 || solo[0].ID != 1 {
		t.Fatalf("%+v", solo)
	}
}

func TestExcelDeItemsBiblioteca(t *testing.T) {
	t.Parallel()
	data, err := excelDeItemsBiblioteca([]dto.CarnetBibliotecaItem{{PrimerNombre: "Ana", FichaNumero: "8"}})
	if err != nil || len(data) < 100 {
		t.Fatalf("excel %v %d", err, len(data))
	}
}
