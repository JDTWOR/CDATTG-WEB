/**
 * Pruebo vigencia de ficha y armado de datos del carnet.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

func TestFichaSirveParaCarnet(t *testing.T) {
	t.Parallel()
	hoy := time.Date(2026, 8, 29, 12, 0, 0, 0, time.UTC)
	ayer := hoy.AddDate(0, 0, -1)
	manana := hoy.AddDate(0, 0, 1)
	if fichaSirveParaCarnet(nil, hoy) {
		t.Fatal("nil no sirve")
	}
	inactiva := &models.FichaCaracterizacion{Status: false, FechaFin: &manana}
	if fichaSirveParaCarnet(inactiva, hoy) {
		t.Fatal("inactiva no sirve")
	}
	vencida := &models.FichaCaracterizacion{Status: true, FechaFin: &ayer}
	if fichaSirveParaCarnet(vencida, hoy) {
		t.Fatal("vencida no sirve")
	}
	vigente := &models.FichaCaracterizacion{Status: true, FechaFin: &manana}
	if !fichaSirveParaCarnet(vigente, hoy) {
		t.Fatal("vigente debe servir")
	}
}

func TestPersonaACarnetDatos(t *testing.T) {
	t.Parallel()
	p := models.Persona{
		PrimerNombre: "Cristian", SegundoNombre: "Deysdayr",
		PrimerApellido: "Jimenez", SegundoApellido: "Grajales",
		NumeroDocumento: "1120955821", Rh: "O+", FotoPath: "x.png",
	}
	d := personaACarnetDatos(p)
	if d.Nombres != "CRISTIAN DEYSDAYR" || d.Apellidos != "JIMENEZ GRAJALES" {
		t.Fatalf("nombre %q %q", d.Nombres, d.Apellidos)
	}
	if !d.TieneFoto || d.Rh != "O+" || d.NumeroDocumento != "1120955821" {
		t.Fatalf("%+v", d)
	}
}

func TestFichasVigentesDeCarnet(t *testing.T) {
	t.Parallel()
	hoy := time.Date(2026, 8, 29, 0, 0, 0, 0, time.UTC)
	fin := hoy.AddDate(0, 1, 0)
	prog := models.ProgramaFormacion{Nombre: "ADSO"}
	ficha := models.FichaCaracterizacion{
		Status: true, Ficha: "3173334", FechaFin: &fin, ProgramaFormacion: &prog,
	}
	ficha.ID = 9
	list := fichasVigentesDeCarnet([]models.Aprendiz{
		{FichaCaracterizacion: &ficha},
		{FichaCaracterizacion: &models.FichaCaracterizacion{Status: false}},
	}, hoy)
	if len(list) != 1 || list[0].Numero != "3173334" || list[0].Programa != "ADSO" {
		t.Fatalf("%+v", list)
	}
}
