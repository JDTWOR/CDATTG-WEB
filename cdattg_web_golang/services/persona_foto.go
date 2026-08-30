/**
 * Guardo y leo la foto de perfil de una persona.
 * Lo hice para no mezclar archivos con el CRUD de datos.
 * Lo usa el handler de mi-foto y el carnet digital.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

const (
	personaFotoDir     = "storage/personas_fotos"
	personaFotoMaxBytes = 20 * 1024
)

var (
	errPersonaFotoVacia    = errors.New("la foto está vacía")
	errPersonaFotoGrande   = errors.New("la foto no puede pesar más de 20 KB")
	errPersonaFotoTipo     = errors.New("la foto debe ser JPG")
	errPersonaFotoAusente  = errors.New("esta persona no tiene foto")
)

// PersonaFotoArchivo es la foto lista para enviarla al navegador.
type PersonaFotoArchivo struct {
	Bytes       []byte
	ContentType string
}

// detectarTipoFoto mira los primeros bytes. Lo hice para no confiar en el nombre.
func detectarTipoFoto(data []byte) string {
	if len(data) >= 3 && data[0] == 0xFF && data[1] == 0xD8 && data[2] == 0xFF {
		return "image/jpeg"
	}
	return ""
}

func validarBytesFoto(data []byte) error {
	if len(data) == 0 {
		return errPersonaFotoVacia
	}
	if len(data) > personaFotoMaxBytes {
		return errPersonaFotoGrande
	}
	if detectarTipoFoto(data) == "" {
		return errPersonaFotoTipo
	}
	return nil
}

func rutaFotoPersona(personaID uint) string {
	return filepath.Join(personaFotoDir, fmt.Sprintf("%d.jpg", personaID))
}

func guardarFotoPersona(personaID uint, data []byte) (string, error) {
	if err := validarBytesFoto(data); err != nil {
		return "", err
	}
	if err := os.MkdirAll(personaFotoDir, 0o750); err != nil {
		return "", fmt.Errorf("no pude crear la carpeta de fotos: %w", err)
	}
	ruta := rutaFotoPersona(personaID)
	if err := os.WriteFile(ruta, data, 0o640); err != nil {
		return "", fmt.Errorf("no pude guardar la foto: %w", err)
	}
	return strings.ReplaceAll(ruta, "\\", "/"), nil
}

func leerFotoPersona(fotoPath string) (*PersonaFotoArchivo, error) {
	if strings.TrimSpace(fotoPath) == "" {
		return nil, errPersonaFotoAusente
	}
	data, err := os.ReadFile(fotoPath)
	if err != nil {
		return nil, errPersonaFotoAusente
	}
	tipo := detectarTipoFoto(data)
	if tipo == "" {
		tipo = "image/jpeg"
	}
	return &PersonaFotoArchivo{Bytes: data, ContentType: tipo}, nil
}
