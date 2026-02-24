package services

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/xuri/excelize/v2"
)

// Formato Excel reporte aprendices: fila con "Ficha de Caracterización:", luego "CODE - NOMBRE PROGRAMA";
// fila de cabecera con "Tipo de Documento", "Número de Documento", "Nombre", "Apellidos", "Celular", "Correo Electrónico";
// siguientes filas = datos.
const (
	fichaColTipoDoc   = 0
	fichaColNumDoc    = 1
	fichaColNombre    = 2
	fichaColApellidos = 3
	fichaColCelular   = 4
	fichaColCorreo    = 5
)

type FichaImportService interface {
	ImportFromExcel(fileBytes []byte, filename string) (*FichaImportResult, error)
}

type fichaImportService struct {
	personaRepo   repositories.PersonaRepository
	programaRepo  repositories.ProgramaFormacionRepository
	fichaRepo     repositories.FichaRepository
	aprendizRepo  repositories.AprendizRepository
	catalogoRepo  repositories.CatalogoRepository
	personaSvc    PersonaService
}

func NewFichaImportService() FichaImportService {
	return &fichaImportService{
		personaRepo:  repositories.NewPersonaRepository(),
		programaRepo: repositories.NewProgramaFormacionRepository(),
		fichaRepo:    repositories.NewFichaRepository(),
		aprendizRepo: repositories.NewAprendizRepository(),
		catalogoRepo: repositories.NewCatalogoRepository(),
		personaSvc:  NewPersonaService(),
	}
}

type FichaImportResult struct {
	ProcessedCount   int `json:"processed_count"`
	UpdatedCount    int `json:"updated_count"`
	CreatedCount    int `json:"created_count"`
	DuplicatesCount int `json:"duplicates_count"`
	ErrorCount      int `json:"error_count"`
	FichaCreated    bool `json:"ficha_created"`
	Status          string `json:"status"`
}

func (s *fichaImportService) ImportFromExcel(fileBytes []byte, filename string) (*FichaImportResult, error) {
	f, err := excelize.OpenReader(bytes.NewReader(fileBytes))
	if err != nil {
		return nil, fmt.Errorf("archivo Excel inválido: %w", err)
	}
	defer f.Close()

	sheetName := f.GetSheetName(0)
	if sheetName == "" {
		return nil, fmt.Errorf("el archivo no contiene hojas")
	}

	rows, err := f.GetRows(sheetName)
	if err != nil || len(rows) < 6 {
		return nil, fmt.Errorf("el archivo debe tener al menos cabecera y una fila de datos")
	}

	// Buscar fila "Ficha de Caracterización:" y extraer "CODE - NOMBRE PROGRAMA"
	var fichaCode, programName string
	for i, row := range rows {
		if len(row) > 2 {
			cell0 := strings.TrimSpace(strings.ToLower(row[0]))
			if strings.Contains(cell0, "ficha") && strings.Contains(cell0, "caracterización") {
				val := strings.TrimSpace(row[2])
				if val != "" {
					idx := strings.Index(val, " - ")
					if idx > 0 {
						fichaCode = strings.TrimSpace(val[:idx])
						programName = strings.TrimSpace(val[idx+3:])
					} else {
						fichaCode = val
					}
				}
				break
			}
		}
		_ = i
	}
	if fichaCode == "" {
		return nil, fmt.Errorf("no se encontró la línea 'Ficha de Caracterización' con código y nombre de programa")
	}

	// Buscar fila de cabecera (Tipo de Documento, Número de Documento, Nombre, Apellidos...)
	dataStartRow := -1
	for i, row := range rows {
		if len(row) > 5 {
			c0 := strings.TrimSpace(strings.ToLower(row[0]))
			c1 := strings.TrimSpace(strings.ToLower(row[1]))
			if (strings.Contains(c0, "tipo") && strings.Contains(c0, "documento")) &&
				(strings.Contains(c1, "número") || strings.Contains(c1, "numero")) {
				dataStartRow = i + 1
				break
			}
		}
	}
	if dataStartRow < 0 {
		return nil, fmt.Errorf("no se encontró la fila de cabecera (Tipo de Documento, Número de Documento, Nombre, Apellidos...)")
	}

	// Programa por nombre
	programa, err := s.programaRepo.FindFirstByNombreContaining(programName)
	if err != nil {
		return nil, fmt.Errorf("programa de formación no encontrado por nombre: %q", programName)
	}

	// Obtener o crear ficha
	var ficha *models.FichaCaracterizacion
	fichaCreated := false
	ficha, err = s.fichaRepo.FindByFicha(fichaCode)
	if err != nil {
		ficha = &models.FichaCaracterizacion{
			ProgramaFormacionID: programa.ID,
			Ficha:               fichaCode,
			Status:              true,
		}
		if err := s.fichaRepo.Create(ficha); err != nil {
			return nil, fmt.Errorf("error al crear ficha %s: %w", fichaCode, err)
		}
		fichaCreated = true
	}

	// Tipos de documento (CC -> ID)
	tiposDoc, _ := s.catalogoRepo.FindTiposDocumento()
	tipoByCode := make(map[string]uint)
	for _, t := range tiposDoc {
		nombreNorm := strings.TrimSpace(strings.ToUpper(normalizeAccentsFicha(t.Nombre)))
		for cod, nom := range tipoDocCodigoANombre {
			if strings.TrimSpace(strings.ToUpper(normalizeAccentsFicha(nom))) == nombreNorm {
				tipoByCode[strings.ToUpper(cod)] = t.ID
			}
		}
	}

	var processed, updated, created, duplicates, errors int

	for i := dataStartRow; i < len(rows); i++ {
		row := rows[i]
		if len(row) <= fichaColNumDoc {
			continue
		}
		numeroDoc := strings.TrimSpace(row[fichaColNumDoc])
		if numeroDoc == "" {
			continue
		}

		tipoDocStr := strings.TrimSpace(strings.ToUpper(row[fichaColTipoDoc]))
		nombreStr := strings.TrimSpace(row[fichaColNombre])
		apellidosStr := strings.TrimSpace(row[fichaColApellidos])
		celular := ""
		if len(row) > fichaColCelular {
			celular = strings.TrimSpace(row[fichaColCelular])
		}
		correo := ""
		if len(row) > fichaColCorreo {
			correo = strings.TrimSpace(row[fichaColCorreo])
		}

		primerNombre, segundoNombre := splitNombre(nombreStr)
		primerApellido, segundoApellido := splitNombre(apellidosStr)
		if primerNombre == "" && primerApellido == "" {
			primerNombre = nombreStr
			primerApellido = apellidosStr
		}

		tipoID := tipoByCode[tipoDocStr]
		req := dto.PersonaRequest{
			NumeroDocumento: numeroDoc,
			PrimerNombre:    primerNombre,
			SegundoNombre:   segundoNombre,
			PrimerApellido:  primerApellido,
			SegundoApellido: segundoApellido,
			Celular:         celular,
			Email:           correo,
			Status:          ptrBool(true),
		}
		if tipoID != 0 {
			req.TipoDocumento = &tipoID
		}

		persona, errFind := s.personaRepo.FindByNumeroDocumento(numeroDoc)
		var personaID uint
		if errFind != nil || persona == nil {
			createdResp, errCreate := s.personaSvc.Create(req)
			if errCreate != nil {
				errors++
				continue
			}
			personaID = createdResp.ID
			created++
		} else {
			personaID = persona.ID
			_, errUpdate := s.personaSvc.Update(persona.ID, req)
			if errUpdate != nil {
				errors++
				continue
			}
			updated++
		}

		_, errAprendiz := s.aprendizRepo.FindByPersonaIDAndFichaID(personaID, ficha.ID)
		if errAprendiz == nil {
			duplicates++
			continue
		}
		aprendiz := models.Aprendiz{
			PersonaID:            personaID,
			FichaCaracterizacionID: ficha.ID,
			Estado:               true,
		}
		if err := s.aprendizRepo.Create(&aprendiz); err != nil {
			errors++
			continue
		}
		processed++
	}

	return &FichaImportResult{
		ProcessedCount:   processed,
		UpdatedCount:    updated,
		CreatedCount:    created,
		DuplicatesCount: duplicates,
		ErrorCount:      errors,
		FichaCreated:    fichaCreated,
		Status:          "completado",
	}, nil
}

func splitNombre(s string) (first, rest string) {
	s = strings.TrimSpace(s)
	parts := strings.Fields(s)
	if len(parts) == 0 {
		return "", ""
	}
	if len(parts) == 1 {
		return parts[0], ""
	}
	return parts[0], strings.Join(parts[1:], " ")
}

func normalizeAccentsFicha(s string) string {
	var b strings.Builder
	for _, r := range s {
		switch r {
		case 'Á', 'À', 'Â', 'Ã':
			b.WriteRune('A')
		case 'É', 'È', 'Ê':
			b.WriteRune('E')
		case 'Í', 'Ì', 'Î':
			b.WriteRune('I')
		case 'Ó', 'Ò', 'Ô', 'Õ':
			b.WriteRune('O')
		case 'Ú', 'Ù', 'Û':
			b.WriteRune('U')
		case 'Ñ':
			b.WriteRune('N')
		default:
			b.WriteRune(r)
		}
	}
	return b.String()
}
