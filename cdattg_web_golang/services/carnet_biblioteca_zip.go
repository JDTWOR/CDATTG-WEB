/**
 * Empaqueto las fotos de los carnets regulares en un zip: van en el mismo
 * orden que el Excel y cada una se llama "cédula nombres apellidos.jpg".
 * Leo la foto tal cual quedó guardada, sin volverla a comprimir.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"archive/zip"
	"bytes"
	"strings"
	"unicode"

	"github.com/sena/cdattg-web-golang/models"
)

// FotosBibliotecaZip baja solo regulares aprobados; fichaID 0 = todas.
// Si una persona no tiene foto, la omito y las demás conservan el orden.
func (s *carnetDigitalService) FotosBibliotecaZip(fichaID uint) ([]byte, error) {
	list, err := s.solicitudRepo.FindAprobadosRegular()
	if err != nil {
		if tablaCarnetAusente(err) {
			list = nil
		} else {
			return nil, err
		}
	}
	return zipDeFotosBiblioteca(list, fichaID)
}

// zipDeFotosBiblioteca quita duplicados de renovación y agrupa las fotos.
// Usa el mismo orden del Excel: ficha, apellidos y nombres.
func zipDeFotosBiblioteca(list []models.CarnetSolicitud, fichaID uint) ([]byte, error) {
	list = ultimasSolicitudesBiblioteca(list)
	buf := new(bytes.Buffer)
	zipW := zip.NewWriter(buf)
	for i := range list {
		sol := list[i]
		if fichaID != 0 && sol.FichaID != fichaID {
			continue
		}
		arch, err := leerFotoPersona(sol.FotoPath)
		if err != nil {
			continue
		}
		if err := zipPut(zipW, nombreArchivoFotoZip(sol), arch.Bytes); err != nil {
			return nil, err
		}
	}
	if err := zipW.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// nombreArchivoFotoZip arma "cédula nombres apellidos.jpg" y limpia signos.
func nombreArchivoFotoZip(sol models.CarnetSolicitud) string {
	base := strings.TrimSpace(strings.Join([]string{
		sol.NumeroDocumento, sol.Nombres, sol.Apellidos,
	}, " "))
	return nombreLimpioFotosZip(base) + ".jpg"
}

// nombreLimpioFotosZip deja solo letras, números y un espacio entre palabras.
// Lo hago para que el nombre no rompa el sistema de archivos al descomprimir.
func nombreLimpioFotosZip(nombre string) string {
	var b strings.Builder
	for _, r := range nombre {
		if r == ' ' || unicode.IsLetter(r) || unicode.IsDigit(r) {
			b.WriteRune(r)
			continue
		}
		b.WriteRune('-')
	}
	return strings.Join(strings.Fields(b.String()), " ")
}
