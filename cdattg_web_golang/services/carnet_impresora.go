/**
 * Foto del carnet por cédula para la impresora de plásticos.
 * Lo hice porque el software de impresión suele pedir la foto con el documento,
 * no con el id interno de la solicitud.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"errors"
	"net/url"
	"strings"
	"unicode"
)

var (
	errDocumentoImpresoraVacio     = errors.New("falta el número de documento")
	errDocumentoImpresoraInvalido  = errors.New("el número de documento no es válido")
)

const rutaFotoImpresoraBase = "/api/impresora/carnets/foto?documento="

// LeerFotoBibliotecaPorDocumento entrega el JPEG si hay regular aprobado con esa cédula.
func (s *carnetDigitalService) LeerFotoBibliotecaPorDocumento(documento string) (*PersonaFotoArchivo, error) {
	doc, err := documentoImpresora(documento)
	if err != nil {
		return nil, err
	}
	sol, err := s.solicitudRepo.FindAprobadoRegularPorDocumento(doc)
	if err != nil {
		return nil, err
	}
	if !esCarnetParaBiblioteca(sol) {
		return nil, errCarnetNoBiblioteca
	}
	return leerFotoPersona(sol.FotoPath)
}

// documentoImpresora limpia la cédula: solo letras y números, máximo 20.
func documentoImpresora(raw string) (string, error) {
	doc := strings.TrimSpace(raw)
	if doc == "" {
		return "", errDocumentoImpresoraVacio
	}
	if len(doc) > 20 {
		return "", errDocumentoImpresoraInvalido
	}
	for _, r := range doc {
		if !unicode.IsLetter(r) && !unicode.IsDigit(r) {
			return "", errDocumentoImpresoraInvalido
		}
	}
	return doc, nil
}

// rutaFotoImpresora es el enlace relativo que la impresora completa con el host.
func rutaFotoImpresora(documento string) string {
	if documento == "" {
		return ""
	}
	return rutaFotoImpresoraBase + url.QueryEscape(documento)
}
