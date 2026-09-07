/**
 * Pruebo la validación de los comprobantes PDF y el mapeo a DTO.
 * Uso slices en memoria; no toco base de datos ni disco (mocks de I/O).
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/models"
)

func TestValidarComprobante(t *testing.T) {
	casos := []struct {
		nombre string
		data   []byte
		wantOK bool
	}{
		{"vacio", []byte{}, false},
		{"mal tipo", []byte("XPDF-1.5 al reves"), false},
		{"no permitido", []byte("hola"), false},
		{"pesado", append([]byte("%PDF-ok-"), make([]byte, carnetPerdidaMaxBytes)...), false},
		{"pdf justo al limite", append([]byte("%PDF-1.7"), make([]byte, carnetPerdidaMaxBytes-len("%PDF-1.7"))...), true},
		{"pdf ok", []byte("%PDF-1.7 ejemplo"), true},
		{"jpg ok", []byte{0xFF, 0xD8, 0xFF, 0xE0, 0x00}, true},
		{"png ok", []byte{0x89, 0x50, 0x4E, 0x47, 0x0D}, true},
		{"webp ok", append([]byte("RIFF\x00\x00\x00\x00WEBP"), make([]byte, 8)...), true},
	}
	for i := range casos {
		caso := casos[i]
		t.Run(caso.nombre, func(t *testing.T) {
			err := validarComprobante(caso.data)
			if (err == nil) != caso.wantOK {
				t.Errorf("validarComprobante(%s) err=%v, wantOK=%v", caso.nombre, err, caso.wantOK)
			}
		})
	}
}

func TestDetectarComprobanteTipos(t *testing.T) {
	muestraPDF := []byte("%PDF-1.7 x")
	if got := detectarComprobante(muestraPDF); got != "application/pdf" {
		t.Errorf("detectarComprobante(pdf)=%q", got)
	}
	muestraJPG := []byte{0xFF, 0xD8, 0xFF, 0xE0}
	if got := detectarComprobante(muestraJPG); got != "image/jpeg" {
		t.Errorf("detectarComprobante(jpg)=%q", got)
	}
	muestraPNG := []byte{0x89, 0x50, 0x4E, 0x47}
	if got := detectarComprobante(muestraPNG); got != "image/png" {
		t.Errorf("detectarComprobante(png)=%q", got)
	}
	muestraWEBP := append([]byte("RIFF\x00\x00\x00\x00WEBP"), make([]byte, 4)...)
	if got := detectarComprobante(muestraWEBP); got != "image/webp" {
		t.Errorf("detectarComprobante(webp)=%q", got)
	}
	if got := detectarComprobante([]byte("indefinido")); got != "" {
		t.Errorf("detectarComprobante(invalido)=%q, quiero vacío", got)
	}
	if got := extensionComprobante("image/jpeg"); got != ".jpg" {
		t.Errorf("extensionComprobante(jpeg)=%q", got)
	}
}

func TestPerdidaEstadoLabel(t *testing.T) {
	casos := map[string]string{
		models.CarnetPerdidaEstadoPendiente: "Pendiente de revisión",
		models.CarnetPerdidaEstadoEspera:    "En espera de renovación física",
		models.CarnetPerdidaEstadoDevuelto:  "Devuelta",
		"desconocido":                       "Pendiente de revisión",
	}
	for estado, want := range casos {
		if got := perdidaEstadoLabel(estado); got != want {
			t.Errorf("perdidaEstadoLabel(%s)=%q, want %q", estado, got, want)
		}
	}
}

func TestPerdidaComprobantesConPaths(t *testing.T) {
	sol := models.CarnetPerdidaSolicitud{
		ComprobantePagoPath:    "storage/carnets_perdidas/1/comprobante_pago.pdf",
		ComprobanteDemandaPath: "storage/carnets_perdidas/1/comprobante_demanda.pdf",
	}
	comps := perdidaComprobantes(sol)
	if len(comps) != 2 {
		t.Fatalf("esperaba 2 comprobantes, obtuve %d", len(comps))
	}
	if comps[0].Tipo != "pago" || comps[1].Tipo != "demanda" {
		t.Errorf("orden de comprobantes incorrecto: %+v", comps)
	}
}

func TestPerdidaAItemMapeaCampos(t *testing.T) {
	sol := models.CarnetPerdidaSolicitud{
		PersonaID:           42,
		FichaID:             7,
		FichaNumero:         "2555555",
		Programa:            "Agroindustria",
		TipoFormacion:       models.TipoFormacionRegular,
		Estado:              models.CarnetPerdidaEstadoEspera,
		Nombres:             "ANA",
		Apellidos:           "LOPEZ",
		Rh:                  "O+",
		ComprobantePagoPath: "x/comprobante_pago.pdf",
	}
	item := perdidaAItem(sol)
	if item.Estado != models.CarnetPerdidaEstadoEspera {
		t.Errorf("estado no mapeado: %s", item.Estado)
	}
	if item.TipoLabel != "Regular" {
		t.Errorf("tipo label incorrecto: %s", item.TipoLabel)
	}
	if len(item.Comprobantes) != 1 {
		t.Errorf("debería tener 1 comprobante, tiene %d", len(item.Comprobantes))
	}
}
