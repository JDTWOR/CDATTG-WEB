/**
 * Armo el Excel de biblioteca para la otra máquina o para descargarlo.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/xuri/excelize/v2"
)

var cabeceraExcelBiblioteca = []string{
	"Primer nombre", "Segundo nombre", "Primer apellido", "Segundo apellido",
	"Cédula", "RH", "Programa", "Número de grupo",
}

const hojaExcelBiblioteca = "Carnets regulares"

// ExcelBiblioteca baja solo regulares aprobados; fichaID 0 = todas.
func (s *carnetDigitalService) ExcelBiblioteca(fichaID uint) ([]byte, error) {
	out, err := s.ListarBiblioteca(fichaID)
	if err != nil {
		return nil, err
	}
	return excelDeItemsBiblioteca(out.Items)
}

func filtrarItemsBiblioteca(items []dto.CarnetBibliotecaItem, fichaID uint) []dto.CarnetBibliotecaItem {
	if fichaID == 0 {
		return items
	}
	out := make([]dto.CarnetBibliotecaItem, 0, len(items))
	for i := range items {
		if items[i].FichaID == fichaID {
			out = append(out, items[i])
		}
	}
	return out
}

func filaExcelBiblioteca(it dto.CarnetBibliotecaItem) []string {
	return []string{
		it.PrimerNombre, it.SegundoNombre, it.PrimerApellido, it.SegundoApellido,
		it.NumeroDocumento, it.Rh, it.Programa, it.FichaNumero,
	}
}

func excelDeItemsBiblioteca(items []dto.CarnetBibliotecaItem) ([]byte, error) {
	f := excelize.NewFile()
	defer func() { _ = f.Close() }()
	nombre := f.GetSheetName(0)
	_ = f.SetSheetName(nombre, hojaExcelBiblioteca)
	for c, titulo := range cabeceraExcelBiblioteca {
		celda, _ := excelize.CoordinatesToCellName(c+1, 1)
		_ = f.SetCellValue(hojaExcelBiblioteca, celda, titulo)
	}
	for i := range items {
		vals := filaExcelBiblioteca(items[i])
		for c, v := range vals {
			celda, _ := excelize.CoordinatesToCellName(c+1, i+2)
			_ = f.SetCellValue(hojaExcelBiblioteca, celda, v)
		}
	}
	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
