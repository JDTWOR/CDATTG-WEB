/**
 * services: pruebas de líneas, integrantes y proyectos.
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/dto"
)

func TestHijosLineasOmiteVacios(t *testing.T) {
	got := hijosLineas(dto.SemilleroRequest{
		Lineas: []dto.SemilleroLineaItem{{Nombre: "  "}, {Nombre: "Agro"}},
	})
	if len(got) != 1 || got[0].Nombre != "Agro" {
		t.Fatalf("got %#v", got)
	}
}

func TestHijosIntegrantesNormalizaCorreo(t *testing.T) {
	got := hijosIntegrantes(dto.SemilleroRequest{
		Integrantes: []dto.SemilleroIntegranteItem{{Nombre: "Ana", Correo: " Ana@SENA.edu.co "}},
	})
	if len(got) != 1 || got[0].Correo != "ana@sena.edu.co" {
		t.Fatalf("got %#v", got)
	}
}

func TestHijosProyectosOmiteSinTitulo(t *testing.T) {
	got := hijosProyectos(dto.SemilleroRequest{
		Proyectos: []dto.SemilleroProyectoItem{{Titulo: "", Anio: 2024}, {Titulo: "Bio", Anio: 2025}},
	})
	if len(got) != 1 || got[0].Anio != 2025 {
		t.Fatalf("got %#v", got)
	}
}

func TestHijosLineasEstadoPorDefecto(t *testing.T) {
	got := hijosLineas(dto.SemilleroRequest{
		Lineas: []dto.SemilleroLineaItem{{Nombre: "Agro"}},
	})
	if len(got) != 1 || got[0].EstadoPublicacion != "publicado" {
		t.Fatalf("got %#v", got)
	}
}
