/**
 * Pruebo el zip de la foto de una reposición: nombre con cédula y apellidos,
 * bytes originales (sin recomprimir) y el caso en que no hay foto.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"archive/zip"
	"bytes"
	"testing"

	"github.com/sena/cdattg-web-golang/models"
)

func TestZipDeFotoPerdidaFeliz(t *testing.T) {
	t.Parallel()
	sol := models.CarnetPerdidaSolicitud{
		NumeroDocumento: "111",
		Nombres:         "Ana Maria",
		Apellidos:       "Rojas Perez",
		FotoPath:        fotoTemporal(t, t.TempDir(), "111"),
	}
	got, err := zipDeFotoPerdida(sol)
	if err != nil {
		t.Fatalf("zip %v", err)
	}
	z, err := zip.NewReader(bytes.NewReader(got), int64(len(got)))
	if err != nil || len(z.File) != 1 {
		t.Fatalf("leer zip %v archivos %d", err, len(z.File))
	}
	if z.File[0].Name != "111 Ana Maria Rojas Perez.jpg" {
		t.Fatalf("nombre %q", z.File[0].Name)
	}
	abierto, err := z.File[0].Open()
	if err != nil {
		t.Fatalf("abrir %v", err)
	}
	var contenido bytes.Buffer
	_, _ = contenido.ReadFrom(abierto)
	_ = abierto.Close()
	if !bytes.Equal(contenido.Bytes(), []byte{0xFF, 0xD8, 0xFF, 0xD9, 0x01, 0x02}) {
		t.Fatalf("contenido no es el original")
	}
}

func TestZipDeFotoPerdidaSinFotoDaError(t *testing.T) {
	t.Parallel()
	if _, err := zipDeFotoPerdida(models.CarnetPerdidaSolicitud{}); err == nil {
		t.Fatal("sin foto debe fallar")
	}
}

func TestNombreFotoPerdidaZipLimpiaSignos(t *testing.T) {
	t.Parallel()
	sol := models.CarnetPerdidaSolicitud{NumeroDocumento: "1", Nombres: "Ana", Apellidos: "Rojas/Perez"}
	if got := nombreFotoPerdidaZip(sol); got != "1 Ana Rojas-Perez.jpg" {
		t.Fatalf("%q", got)
	}
}
