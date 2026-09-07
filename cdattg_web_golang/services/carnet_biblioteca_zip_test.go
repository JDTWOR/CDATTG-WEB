/**
 * Pruebo el zip de fotos: orden igual al Excel, nombre con cédula y apellidos,
 * y que las personas sin foto se omitan sin cortar la descarga.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"archive/zip"
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/sena/cdattg-web-golang/models"
)

func fotoTemporal(t *testing.T, dir, doc string) string {
	t.Helper()
	ruta := filepath.Join(dir, doc+".jpg")
	// Bytes con la marca del JPEG; leerFotoPersona no re-comprime el archivo.
	if err := os.WriteFile(ruta, []byte{0xFF, 0xD8, 0xFF, 0xD9, 0x01, 0x02}, 0o640); err != nil {
		t.Fatalf("foto %v", err)
	}
	return strings.ReplaceAll(ruta, "\\", "/")
}

func TestZipDeFotosBibliotecaFeliz(t *testing.T) {
	t.Parallel()
	dir := t.TempDir()
	recepcionista := func(id uint, documento, nombres, apellidos, ruta string) models.CarnetSolicitud {
		s := models.CarnetSolicitud{
			PersonaID: id, FichaID: 8, Nombres: nombres, Apellidos: apellidos,
			NumeroDocumento: documento, FotoPath: ruta,
		}
		s.ID = id + 10
		return s
	}
	list := []models.CarnetSolicitud{
		recepcionista(1, "111", "Ana Maria", "Rojas Perez", fotoTemporal(t, dir, "111")),
		recepcionista(2, "222", "Luis", "Diaz", fotoTemporal(t, dir, "222")),
	}
	got, err := zipDeFotosBiblioteca(list, 0)
	if err != nil {
		t.Fatalf("zip %v", err)
	}
	z, err := zip.NewReader(bytes.NewReader(got), int64(len(got)))
	if err != nil || len(z.File) != 2 {
		t.Fatalf("leer zip %v archivos %d", err, len(z.File))
	}
	if z.File[0].Name != "111 Ana Maria Rojas Perez.jpg" || z.File[1].Name != "222 Luis Diaz.jpg" {
		t.Fatalf("nombres %q %q", z.File[0].Name, z.File[1].Name)
	}
}

func TestZipDeFotosBibliotecaOmitirSinFoto(t *testing.T) {
	t.Parallel()
	dir := t.TempDir()
	solo := models.CarnetSolicitud{PersonaID: 1, FichaID: 8, Nombres: "Luis", Apellidos: "Diaz", NumeroDocumento: "2", FotoPath: fotoTemporal(t, dir, "2")}
	solo.ID = 12
	sinFoto := models.CarnetSolicitud{PersonaID: 2, FichaID: 8, Nombres: "Ana", Apellidos: "Rojas", NumeroDocumento: "1"}
	sinFoto.ID = 11
	got, err := zipDeFotosBiblioteca([]models.CarnetSolicitud{sinFoto, solo}, 0)
	if err != nil {
		t.Fatalf("zip %v", err)
	}
	z, err := zip.NewReader(bytes.NewReader(got), int64(len(got)))
	if err != nil {
		t.Fatalf("leer %v", err)
	}
	if len(z.File) != 1 || z.File[0].Name != "2 Luis Diaz.jpg" {
		t.Fatalf("%+v", z.File)
	}
}

func TestZipDeFotosBibliotecaFiltraPorFicha(t *testing.T) {
	t.Parallel()
	dir := t.TempDir()
	de := func(id uint, ficha uint, documento string) models.CarnetSolicitud {
		s := models.CarnetSolicitud{
			PersonaID: id, FichaID: ficha, Nombres: "Ana", Apellidos: "Rojas",
			NumeroDocumento: documento, FotoPath: fotoTemporal(t, dir, documento),
		}
		s.ID = id + 10
		return s
	}
	list := []models.CarnetSolicitud{de(1, 8, "1"), de(2, 9, "2")}
	got, err := zipDeFotosBiblioteca(list, 9)
	if err != nil {
		t.Fatalf("zip %v", err)
	}
	z, err := zip.NewReader(bytes.NewReader(got), int64(len(got)))
	if err != nil {
		t.Fatalf("leer %v", err)
	}
	if len(z.File) != 1 || z.File[0].Name != "2 Ana Rojas.jpg" {
		t.Fatalf("%+v", z.File)
	}
}

func TestNombreLimpioFotosZip(t *testing.T) {
	t.Parallel()
	if got := nombreLimpioFotosZip("1 Ana/Maria:Rojas"); got != "1 Ana-Maria-Rojas" {
		t.Fatalf("%q", got)
	}
	if got := nombreArchivoFotoZip(models.CarnetSolicitud{NumeroDocumento: "1", Nombres: "Ana", Apellidos: "Rojas"}); got != "1 Ana Rojas.jpg" {
		t.Fatalf("%q", got)
	}
}
