/**
 * Valido y guardo los comprobantes de la reposición del carnet.
 * Acepto PDF, JPG, PNG o WEBP: no confío en el nombre del archivo,
 * miro los primeros bytes (magic) y el peso máximo de 2 MB.
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
	carnetPerdidaDir      = "storage/carnets_perdidas"
	carnetPerdidaMaxBytes = 2 * 1024 * 1024
)

// CarnetPerdidaMaxBytes expone el tope de 2 MB al handler.
func CarnetPerdidaMaxBytes() uint {
	return carnetPerdidaMaxBytes
}

// ErrComprobanteGrande expone el error de tamaño al handler.
func ErrComprobanteGrande() error {
	return errComprobanteGrande
}

var (
	errComprobanteVacio   = errors.New("el comprobante está vacío")
	errComprobanteGrande  = errors.New("el comprobante no puede pesar más de 2 MB")
	errComprobanteTipo    = errors.New("el comprobante debe ser PDF, JPG, PNG o WEBP")
	errComprobanteAusente = errors.New("la solicitud no tiene ese comprobante")
)

func esPDF(b []byte) bool  { return len(b) >= 4 && string(b[:4]) == "%PDF" }
func esJPEG(b []byte) bool { return len(b) >= 3 && b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF }
func esPNG(b []byte) bool {
	return len(b) >= 4 && b[0] == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
}
func esWEBP(b []byte) bool {
	return len(b) >= 12 && string(b[:4]) == "RIFF" && string(b[8:12]) == "WEBP"
}

// detectarComprobante dice el type según los primeros bytes del archivo.
func detectarComprobante(data []byte) string {
	switch {
	case esPDF(data):
		return "application/pdf"
	case esJPEG(data):
		return "image/jpeg"
	case esPNG(data):
		return "image/png"
	case esWEBP(data):
		return "image/webp"
	}
	return ""
}

// extensionComprobante traduce el content type a la extensión del archivo.
func extensionComprobante(content string) string {
	switch content {
	case "application/pdf":
		return ".pdf"
	case "image/jpeg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/webp":
		return ".webp"
	}
	return ".bin"
}

// validarComprobante rechaza archivos vacíos, pesados o de tipo no permitido.
func validarComprobante(data []byte) error {
	switch {
	case len(data) == 0:
		return errComprobanteVacio
	case len(data) > carnetPerdidaMaxBytes:
		return errComprobanteGrande
	case detectarComprobante(data) == "":
		return errComprobanteTipo
	}
	return nil
}

// nombreComprobante es el archivo dentro de la carpeta de la solicitud.
func nombreComprobante(tipo, content string) string {
	return "comprobante_" + tipo + extensionComprobante(content)
}

// nombreBaseDeRuta deja solo el nombre del archivo guardado en disco.
func nombreBaseDeRuta(ruta string) string {
	partes := strings.Split(ruta, "/")
	return partes[len(partes)-1]
}

// guardarComprobante valida, crea la carpeta y escribe el comprobante.
func guardarComprobante(solicitudID uint, tipo string, data []byte) (string, error) {
	content := detectarComprobante(data)
	if err := validarComprobante(data); err != nil {
		return "", err
	}
	carpeta := filepath.Join(carnetPerdidaDir, fmt.Sprintf("%d", solicitudID))
	if err := os.MkdirAll(carpeta, 0o750); err != nil {
		return "", fmt.Errorf("no pude crear la carpeta del comprobante: %w", err)
	}
	ruta := filepath.Join(carpeta, nombreComprobante(tipo, content))
	if err := os.WriteFile(ruta, data, 0o640); err != nil {
		return "", fmt.Errorf("no pude guardar el comprobante: %w", err)
	}
	return strings.ReplaceAll(ruta, "\\", "/"), nil
}

// ArchivoComprobante es el comprobante listo para enviar al navegador.
type ArchivoComprobante struct {
	Bytes       []byte
	ContentType string
	Nombre      string
}

func leerComprobante(ruta string) ([]byte, error) {
	if strings.TrimSpace(ruta) == "" {
		return nil, errComprobanteAusente
	}
	data, err := os.ReadFile(ruta)
	if err != nil {
		return nil, errComprobanteAusente
	}
	return data, nil
}

// leerArchivoComprobante re-detecta el type al servir: si el archivo fue
// renombrado a mano, sigo entregando el content type correcto.
func leerArchivoComprobante(ruta string) (*ArchivoComprobante, error) {
	data, err := leerComprobante(ruta)
	if err != nil {
		return nil, err
	}
	return &ArchivoComprobante{
		Bytes:       data,
		ContentType: detectarComprobante(data),
		Nombre:      nombreBaseDeRuta(ruta),
	}, nil
}
