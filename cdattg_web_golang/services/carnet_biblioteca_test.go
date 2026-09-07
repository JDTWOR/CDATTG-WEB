/**
 * Pruebo que biblioteca solo arme regulares aprobados y el catálogo de fichas.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/models"
)

func TestEsCarnetParaBiblioteca(t *testing.T) {
	t.Parallel()
	if esCarnetParaBiblioteca(nil) {
		t.Fatal("nil no sirve")
	}
	pend := &models.CarnetSolicitud{Estado: models.CarnetEstadoPendiente, TipoFormacion: models.TipoFormacionRegular}
	if esCarnetParaBiblioteca(pend) {
		t.Fatal("pendiente no sirve")
	}
	media := &models.CarnetSolicitud{Estado: models.CarnetEstadoAprobado, TipoFormacion: models.TipoFormacionMediaTecnica}
	if esCarnetParaBiblioteca(media) {
		t.Fatal("media técnica no sirve")
	}
	ok := &models.CarnetSolicitud{Estado: models.CarnetEstadoAprobado, TipoFormacion: models.TipoFormacionRegular}
	if !esCarnetParaBiblioteca(ok) {
		t.Fatal("regular aprobado debe servir")
	}
}

func TestBibliotecaDesdeSolicitudes(t *testing.T) {
	t.Parallel()
	list := []models.CarnetSolicitud{
		{FichaID: 8, FichaNumero: "3173334", Programa: "ADSO", Nombres: "Ana", Apellidos: "Rojas", NumeroDocumento: "1", Rh: "O+", FotoPath: "a.jpg"},
		{FichaID: 8, FichaNumero: "3173334", Programa: "ADSO", Nombres: "Luis", Apellidos: "Diaz", NumeroDocumento: "2", Rh: "A+"},
	}
	list[0].ID = 11
	list[1].ID = 12
	personas := map[uint]models.Persona{
		1: {PrimerNombre: "Ana", SegundoNombre: "Maria", PrimerApellido: "Rojas", SegundoApellido: "Perez"},
	}
	list[0].PersonaID = 1
	out := bibliotecaDesdeSolicitudes(list, map[uint]string{8: "Lider Uno"}, personas)
	if len(out.Fichas) != 1 || out.Fichas[0].InstructorLider != "Lider Uno" {
		t.Fatalf("fichas %+v", out.Fichas)
	}
	if len(out.Items) != 2 || !out.Items[0].TieneFoto || out.Items[1].TieneFoto {
		t.Fatalf("items %+v", out.Items)
	}
	if out.Items[0].PrimerNombre != "Ana" || out.Items[0].SegundoApellido != "Perez" {
		t.Fatalf("nombres %+v", out.Items[0])
	}
	if out.Items[0].FotoURL != "/api/impresora/carnets/foto?documento=1" {
		t.Fatalf("foto_url %q", out.Items[0].FotoURL)
	}
	if ids := fichaIDsDeSolicitudes(list); len(ids) != 1 || ids[0] != 8 {
		t.Fatalf("ids %v", ids)
	}
}

func TestUltimasSolicitudesBiblioteca(t *testing.T) {
	t.Parallel()
	vieja := models.CarnetSolicitud{PersonaID: 1, FichaID: 8, Nombres: "Ana", NumeroDocumento: "1"}
	nueva := models.CarnetSolicitud{PersonaID: 1, FichaID: 8, Nombres: "Ana Maria", NumeroDocumento: "1"}
	otra := models.CarnetSolicitud{PersonaID: 2, FichaID: 8, Nombres: "Luis", NumeroDocumento: "2"}
	vieja.ID, nueva.ID, otra.ID = 11, 20, 12
	got := ultimasSolicitudesBiblioteca([]models.CarnetSolicitud{vieja, nueva, otra})
	if len(got) != 2 || got[0].ID != 20 || got[1].ID != 12 {
		t.Fatalf("renovacion %+v", got)
	}
	mismaOtraFicha := models.CarnetSolicitud{PersonaID: 1, FichaID: 9, Nombres: "Ana", NumeroDocumento: "1"}
	mismaOtraFicha.ID = 21
	got = ultimasSolicitudesBiblioteca([]models.CarnetSolicitud{nueva, mismaOtraFicha})
	if len(got) != 2 {
		t.Fatalf("otra ficha %d", len(got))
	}
}
