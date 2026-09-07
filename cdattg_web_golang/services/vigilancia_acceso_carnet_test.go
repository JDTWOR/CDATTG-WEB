/**
 * Pruebo que portería congele el nombre y la foto del carnet validado.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func TestAplicarCarnetEnAcceso(t *testing.T) {
	t.Parallel()
	base := dto.AccesoPersonaFicha{
		PrimerNombre: "Nuevo", PrimerApellido: "Cambio",
		NombreCompleto: "Nuevo Cambio", TieneFoto: true,
	}
	if got := aplicarCarnetEnAcceso(base, nil); got.NombreCompleto != "Nuevo Cambio" {
		t.Fatalf("sin carnet %+v", got)
	}
	sol := &models.CarnetSolicitud{Nombres: "Ana Maria", Apellidos: "Rojas Perez", FotoPath: "c.jpg"}
	got := aplicarCarnetEnAcceso(base, sol)
	if got.NombreCompleto != "Ana Maria Rojas Perez" || got.PrimerNombre != "Ana Maria" || !got.FotoDesdeCarnet {
		t.Fatalf("con carnet %+v", got)
	}
}

func TestFotoPathAcceso(t *testing.T) {
	t.Parallel()
	p := &models.Persona{FotoPath: "perfil.jpg"}
	if fotoPathAcceso(p, nil) != "perfil.jpg" {
		t.Fatal("sin carnet usa perfil")
	}
	sol := &models.CarnetSolicitud{FotoPath: "carnet.jpg"}
	if fotoPathAcceso(p, sol) != "carnet.jpg" {
		t.Fatal("con carnet usa la validada")
	}
	if fotoPathAcceso(nil, nil) != "" {
		t.Fatal("vacío")
	}
}
