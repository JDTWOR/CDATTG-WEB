/**
 * services: pruebas de ruta segura de archivos del portal.
 * @author Cristian Deysdayr Jiménez
 */
package services

import "testing"

func TestRutaArchivoPortal(t *testing.T) {
	if _, err := RutaArchivoPortal("../etc/passwd"); err == nil {
		t.Fatal("debe rechazar traversal")
	}
	if _, err := RutaArchivoPortal("foto.exe"); err == nil {
		t.Fatal("debe rechazar extensión")
	}
	got, err := RutaArchivoPortal("abc.png")
	if err != nil {
		t.Fatal(err)
	}
	if got != "storage/portal/abc.png" && got != "storage\\portal\\abc.png" {
		t.Fatalf("ruta: %q", got)
	}
	if _, err := RutaArchivoPortal("/abc.png"); err != nil {
		t.Fatal("gin *nombre trae barra inicial")
	}
	if _, err := RutaArchivoPortal("sub/abc.png"); err == nil {
		t.Fatal("debe rechazar subcarpetas")
	}
	if _, err := RutaArchivoPortal("politicas.pdf"); err != nil {
		t.Fatal(err)
	}
}
