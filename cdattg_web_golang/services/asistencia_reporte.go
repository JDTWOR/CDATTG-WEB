package services

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/jung-kurt/gofpdf/v2"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

// paraPDF normaliza texto para fuentes PDF sin UTF-8 (ñ y tildes).
func paraPDF(s string) string {
	repl := strings.NewReplacer(
		"á", "a", "é", "e", "í", "i", "ó", "o", "ú", "u",
		"Á", "A", "É", "E", "Í", "I", "Ó", "O", "Ú", "U",
		"ñ", "n", "Ñ", "N", "ü", "u", "Ü", "U",
	)
	return repl.Replace(s)
}

const reporteAsistenciaDir = "storage/asistencia_pdfs"

// GenerateReporteFinalizacion genera un PDF de reporte (asistieron / no asistieron) al finalizar una sesión.
// Guarda en storage/asistencia_pdfs/ y devuelve la ruta del archivo.
func GenerateReporteFinalizacion(asist *models.Asistencia, aprendicesFicha []models.Aprendiz) (string, error) {
	if err := os.MkdirAll(reporteAsistenciaDir, 0755); err != nil {
		return "", fmt.Errorf("crear directorio reportes: %w", err)
	}
	fichaNum := "ficha"
	if asist.InstructorFicha != nil && asist.InstructorFicha.Ficha != nil {
		fichaNum = asist.InstructorFicha.Ficha.Ficha
	}
	fecha := asist.Fecha.Format("2006-01-02")
	nombreArchivo := fmt.Sprintf("asistencia_%s_%s_%d.pdf", fichaNum, fecha, asist.ID)
	ruta := filepath.Join(reporteAsistenciaDir, nombreArchivo)

	idsConIngreso := make(map[uint]bool)
	for i := range asist.AsistenciaAprendices {
		aa := &asist.AsistenciaAprendices[i]
		if aa.HoraIngreso != nil {
			idsConIngreso[aa.AprendizFichaID] = true
		}
	}

	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(15, 15, 15)
	pdf.SetAutoPageBreak(true, 15)
	pdf.AddPage()
	pdf.SetFont("Helvetica", "B", 14)
	pdf.CellFormat(0, 8, "REPORTE DE ASISTENCIA", "", 1, "C", false, 0, "")
	pdf.Ln(4)
	pdf.SetFont("Helvetica", "", 10)
	pdf.CellFormat(0, 6, fmt.Sprintf("Ficha: %s  |  Fecha: %s  |  Sesion ID: %d", fichaNum, fecha, asist.ID), "", 1, "L", false, 0, "")
	pdf.CellFormat(0, 6, fmt.Sprintf("Hora inicio: %s  |  Hora fin: %s", formatTime(asist.HoraInicio), formatTime(asist.HoraFin)), "", 1, "L", false, 0, "")
	pdf.Ln(6)

	// Tabla ASISTIERON
	pdf.SetFont("Helvetica", "B", 11)
	pdf.CellFormat(0, 7, "ASISTIERON", "", 1, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 9)
	wDoc, wNom, wIng, wSal := 35.0, 70.0, 28.0, 28.0
	pdf.SetFillColor(230, 230, 230)
	pdf.CellFormat(wDoc, 7, "Documento", "1", 0, "L", true, 0, "")
	pdf.CellFormat(wNom, 7, "Nombre", "1", 0, "L", true, 0, "")
	pdf.CellFormat(wIng, 7, "Ingreso", "1", 0, "C", true, 0, "")
	pdf.CellFormat(wSal, 7, "Salida", "1", 1, "C", true, 0, "")
	for _, a := range asist.AsistenciaAprendices {
		if a.HoraIngreso == nil {
			continue
		}
		nombre := "-"
		doc := "-"
		if a.Aprendiz != nil && a.Aprendiz.Persona != nil {
			nombre = paraPDF(truncateStr(a.Aprendiz.Persona.GetFullName(), 40))
			doc = a.Aprendiz.Persona.NumeroDocumento
		}
		pdf.CellFormat(wDoc, 6, paraPDF(doc), "1", 0, "L", false, 0, "")
		pdf.CellFormat(wNom, 6, nombre, "1", 0, "L", false, 0, "")
		pdf.CellFormat(wIng, 6, formatTime(a.HoraIngreso), "1", 0, "C", false, 0, "")
		pdf.CellFormat(wSal, 6, formatTime(a.HoraSalida), "1", 1, "C", false, 0, "")
	}
	pdf.Ln(8)

	// Tabla NO ASISTIERON
	pdf.SetFont("Helvetica", "B", 11)
	pdf.CellFormat(0, 7, "NO ASISTIERON", "", 1, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 9)
	pdf.SetFillColor(230, 230, 230)
	pdf.CellFormat(wDoc, 7, "Documento", "1", 0, "L", true, 0, "")
	pdf.CellFormat(0, 7, "Nombre", "1", 1, "L", true, 0, "")
	for _, a := range aprendicesFicha {
		if !a.Estado || idsConIngreso[a.ID] {
			continue
		}
		nombre := "-"
		doc := "-"
		if a.Persona != nil {
			nombre = paraPDF(truncateStr(a.Persona.GetFullName(), 70))
			doc = a.Persona.NumeroDocumento
		}
		pdf.CellFormat(wDoc, 6, paraPDF(doc), "1", 0, "L", false, 0, "")
		pdf.CellFormat(0, 6, nombre, "1", 1, "L", false, 0, "")
	}

	if err := pdf.OutputFileAndClose(ruta); err != nil {
		return "", fmt.Errorf("escribir PDF: %w", err)
	}
	return ruta, nil
}

func formatTime(t *time.Time) string {
	if t == nil {
		return "-"
	}
	return t.Format("15:04")
}

func truncateStr(s string, max int) string {
	runes := []rune(s)
	if len(runes) <= max {
		return s
	}
	return string(runes[:max])
}

// CargarAprendicesFichaParaReporte carga los aprendices activos de la ficha para el reporte.
func CargarAprendicesFichaParaReporte(fichaID uint) ([]models.Aprendiz, error) {
	repo := repositories.NewAprendizRepository()
	return repo.FindByFichaID(fichaID)
}
