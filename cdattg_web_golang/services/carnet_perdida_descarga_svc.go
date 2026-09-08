/**
 * Lectura de los archivos de una reposición para descargarlos: comprobantes
 * individuales, los dos en zip y la foto del solicitante.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"archive/zip"
	"bytes"
	"errors"
	"strings"

	"github.com/sena/cdattg-web-golang/models"
)

// LeerComprobante devuelve el archivo (pago o demanda) listo para servir.
func (s *carnetPerdidaService) LeerComprobante(solicitudID uint, tipo string) (*ArchivoComprobante, error) {
	sol, err := s.perdidaRepo.FindByID(solicitudID)
	if err != nil {
		return nil, errCarnetPerdidaNoEncontrada
	}
	switch tipo {
	case "pago":
		return leerArchivoComprobante(sol.ComprobantePagoPath)
	case "demanda":
		return leerArchivoComprobante(sol.ComprobanteDemandaPath)
	default:
		return nil, errComprobanteAusente
	}
}

// LeerFoto entrega la foto del solicitante: la misma que vería en su carnet.
func (s *carnetPerdidaService) LeerFoto(solicitudID uint) (*PersonaFotoArchivo, error) {
	sol, err := s.perdidaRepo.FindByID(solicitudID)
	if err != nil {
		return nil, errCarnetPerdidaNoEncontrada
	}
	return leerFotoPersona(sol.FotoPath)
}

// LeerComprobantesZip empaqueta los dos comprobantes en un zip para la descarga.
func (s *carnetPerdidaService) LeerComprobantesZip(solicitudID uint) ([]byte, error) {
	sol, err := s.perdidaRepo.FindByID(solicitudID)
	if err != nil {
		return nil, errCarnetPerdidaNoEncontrada
	}
	pago, errPago := leerComprobante(sol.ComprobantePagoPath)
	demanda, errDemanda := leerComprobante(sol.ComprobanteDemandaPath)
	if errPago != nil || errDemanda != nil {
		return nil, errComprobanteAusente
	}
	buf := new(bytes.Buffer)
	zipW := zip.NewWriter(buf)
	if err := zipPut(zipW, nombreBaseDeRuta(sol.ComprobantePagoPath), pago); err != nil {
		return nil, err
	}
	if err := zipPut(zipW, nombreBaseDeRuta(sol.ComprobanteDemandaPath), demanda); err != nil {
		return nil, err
	}
	if err := zipW.Close(); err != nil {
		return nil, errors.New("no se pudo empaquetar")
	}
	return buf.Bytes(), nil
}

// LeerFotoZip empaqueta la foto del solicitante en un zip para descargarla sola.
func (s *carnetPerdidaService) LeerFotoZip(solicitudID uint) ([]byte, error) {
	sol, err := s.perdidaRepo.FindByID(solicitudID)
	if err != nil {
		return nil, errCarnetPerdidaNoEncontrada
	}
	return zipDeFotoPerdida(*sol)
}

// zipDeFotoPerdida junta la foto sin recomprimirla: va tal cual quedó guardada.
func zipDeFotoPerdida(sol models.CarnetPerdidaSolicitud) ([]byte, error) {
	arch, err := leerFotoPersona(sol.FotoPath)
	if err != nil {
		return nil, err
	}
	buf := new(bytes.Buffer)
	zipW := zip.NewWriter(buf)
	if err := zipPut(zipW, nombreFotoPerdidaZip(sol), arch.Bytes); err != nil {
		return nil, err
	}
	if err := zipW.Close(); err != nil {
		return nil, errors.New("no se pudo empaquetar")
	}
	return buf.Bytes(), nil
}

// nombreFotoPerdidaZip arma "cédula nombres apellidos.jpg" sin signos raros.
func nombreFotoPerdidaZip(sol models.CarnetPerdidaSolicitud) string {
	base := strings.TrimSpace(strings.Join([]string{
		sol.NumeroDocumento, sol.Nombres, sol.Apellidos,
	}, " "))
	return nombreLimpioFotosZip(base) + ".jpg"
}

// zipPut escribe un archivo dentro del zip y lo cierra.
func zipPut(zipW *zip.Writer, nombre string, data []byte) error {
	w, err := zipW.Create(nombre)
	if err != nil {
		return err
	}
	_, err = w.Write(data)
	return err
}
