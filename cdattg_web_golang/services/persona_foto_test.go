/**
 * Pruebo validación y rutas de la foto de perfil.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"bytes"
	"os"
	"path/filepath"
	"testing"
)

func TestValidarBytesFoto(t *testing.T) {
	t.Parallel()
	if err := validarBytesFoto(nil); err != errPersonaFotoVacia {
		t.Fatalf("vacía: %v", err)
	}
	grande := bytes.Repeat([]byte{1}, personaFotoMaxBytes+1)
	if err := validarBytesFoto(grande); err != errPersonaFotoGrande {
		t.Fatalf("grande: %v", err)
	}
	if err := validarBytesFoto([]byte("hola")); err != errPersonaFotoTipo {
		t.Fatalf("tipo: %v", err)
	}
	jpeg := []byte{0xFF, 0xD8, 0xFF, 0xE0}
	if err := validarBytesFoto(jpeg); err != nil {
		t.Fatalf("jpeg válido: %v", err)
	}
	png := []byte{0x89, 0x50, 0x4E, 0x47}
	if err := validarBytesFoto(png); err != errPersonaFotoTipo {
		t.Fatalf("png no vale: %v", err)
	}
}

func TestRutaYLeerFotoPersona(t *testing.T) {
	if got := rutaFotoPersona(7); filepath.Base(got) != "7.jpg" {
		t.Fatalf("ruta %s", got)
	}
	if _, err := leerFotoPersona(""); err != errPersonaFotoAusente {
		t.Fatalf("sin path: %v", err)
	}
	tmp := filepath.Join(t.TempDir(), "f.jpg")
	jpeg := []byte{0xFF, 0xD8, 0xFF, 0xE0}
	if err := os.WriteFile(tmp, jpeg, 0o600); err != nil {
		t.Fatal(err)
	}
	arch, err := leerFotoPersona(tmp)
	if err != nil || arch.ContentType != "image/jpeg" {
		t.Fatalf("leer: %v %#v", err, arch)
	}
}
