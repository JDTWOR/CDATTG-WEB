package services

import (
	"bytes"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/xuri/excelize/v2"
)

// instructorImportHeaders mapea nombres de columnas del Excel (normalizados) al canonónico.
// Compatible con "BASE DE DATOS CONTRATISTAS REGULAR.xlsx".
var instructorImportHeaders = map[string]string{
	"nombres y apellidos completo": "nombres_completo",
	"nombres y apellidos":         "nombres_completo",
	"tipo documento":             "tipo_documento",
	"tipo_documento":             "tipo_documento",
	"identificación":             "identificacion",
	"identificacion":             "identificacion",
	"numero documento":           "identificacion",
	"numero_telefono":             "numero_telefono",
	"numero telefono":             "numero_telefono",
	"correo personal":            "correo",
	"correo":                     "correo",
	"email":                      "correo",
	"fecha de nacimiento":        "fecha_nacimiento",
	"fecha_nacimiento":            "fecha_nacimiento",
	"género":                     "genero",
	"genero":                     "genero",
}

// tipoDocNombreExcelANombreBD mapea textos del Excel al nombre en catálogo (CÉDULA DE CIUDADANÍA, etc.).
var tipoDocNombreExcelANombreBD = map[string]string{
	"cédula de ciudadanía":     "CÉDULA DE CIUDADANÍA",
	"cedula de ciudadania":     "CÉDULA DE CIUDADANÍA",
	"cédula de extranjería":    "CÉDULA DE EXTRANJERÍA",
	"cedula de extranjeria":    "CÉDULA DE EXTRANJERÍA",
	"pasaporte":                "PASAPORTE",
	"tarjeta de identidad":     "TARJETA DE IDENTIDAD",
	"registro civil":           "REGISTRO CIVIL",
	"sin identificación":       "SIN IDENTIFICACIÓN",
	"sin identificacion":       "SIN IDENTIFICACIÓN",
}

// InstructorImportService define la importación masiva de instructores desde Excel.
type InstructorImportService interface {
	ImportFromExcel(fileBytes []byte, filename string, userID uint, regionalIDDefault *uint) (*ImportResult, error)
	ListImports(limit int) ([]InstructorImportLogItem, error)
}

type instructorImportService struct {
	personaRepo    repositories.PersonaRepository
	personaService PersonaService
	instructorRepo repositories.InstructorRepository
	instructorSvc  InstructorService
	catalogoRepo   repositories.CatalogoRepository
	logRepo        repositories.InstructorImportLogRepository
}

// InstructorImportLogItem es un ítem del historial de importaciones de instructores.
type InstructorImportLogItem struct {
	ID               uint      `json:"id"`
	Filename         string    `json:"filename"`
	ProcessedCount   int       `json:"processed_count"`
	DuplicatesCount  int       `json:"duplicates_count"`
	ErrorCount       int       `json:"error_count"`
	Status           string    `json:"status"`
	UsuarioNombre    string    `json:"usuario_nombre"`
	CreatedAt        time.Time `json:"created_at"`
}

// NewInstructorImportService crea el servicio de importación de instructores.
func NewInstructorImportService() InstructorImportService {
	return &instructorImportService{
		personaRepo:    repositories.NewPersonaRepository(),
		personaService: NewPersonaService(),
		instructorRepo: repositories.NewInstructorRepository(),
		instructorSvc:  NewInstructorService(),
		catalogoRepo:   repositories.NewCatalogoRepository(),
		logRepo:        repositories.NewInstructorImportLogRepository(),
	}
}

// ImportFromExcel procesa un archivo Excel y crea/vincula personas e instructores.
// regionalIDDefault se asigna a cada instructor nuevo (ej. regional GUAVIARE); si es nil se deja null.
func (s *instructorImportService) ImportFromExcel(fileBytes []byte, filename string, userID uint, regionalIDDefault *uint) (*ImportResult, error) {
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
	if err != nil || len(rows) < 2 {
		return nil, fmt.Errorf("el archivo debe tener al menos encabezados y una fila de datos")
	}

	colIndex, err := s.buildColumnIndex(rows[0])
	if err != nil {
		return nil, err
	}

	tipoByKey, err := s.buildTipoDocumentoMap()
	if err != nil {
		return nil, err
	}
	generoByKey, err := s.buildGeneroMap()
	if err != nil {
		return nil, err
	}

	var processed, duplicates, errorsCount int
	var createdPersonaIDs []uint

	for i := 1; i < len(rows); i++ {
		row := rows[i]
		req := s.rowToPersonaRequest(row, colIndex, tipoByKey, generoByKey)
		if req == nil {
			errorsCount++
			continue
		}

		numeroDoc := strings.TrimSpace(req.NumeroDocumento)
		if numeroDoc == "" {
			errorsCount++
			continue
		}

		persona, findErr := s.personaRepo.FindByNumeroDocumento(numeroDoc)
		var personaID uint
		if findErr != nil || persona == nil {
			// Crear persona nueva
			resp, createErr := s.personaService.CreateWithoutUser(*req)
			if createErr != nil {
				if strings.Contains(createErr.Error(), "ya está registrado") || strings.Contains(createErr.Error(), "ya registrado") {
					duplicates++
				} else {
					errorsCount++
				}
				continue
			}
			personaID = resp.ID
			createdPersonaIDs = append(createdPersonaIDs, personaID)
		} else {
			personaID = persona.ID
		}

		existingInst, _ := s.instructorRepo.FindByPersonaID(personaID)
		if existingInst != nil {
			duplicates++
			continue
		}

		_, createErr := s.instructorSvc.CreateFromPersona(dto.CreateInstructorRequest{
			PersonaID:  personaID,
			RegionalID:  regionalIDDefault,
		})
		if createErr != nil {
			errorsCount++
			continue
		}
		processed++
	}

	if len(createdPersonaIDs) > 0 {
		_ = s.personaService.EnsureUsersForPersonas(createdPersonaIDs)
	}

	logEntry := &models.InstructorImportLog{
		Filename:        filename,
		UserID:          userID,
		ProcessedCount:  processed,
		DuplicatesCount: duplicates,
		ErrorCount:      errorsCount,
		Status:          "completado",
		CreatedAt:       time.Now(),
	}
	_ = s.logRepo.Create(logEntry)

	return &ImportResult{
		ProcessedCount:  processed,
		DuplicatesCount: duplicates,
		ErrorCount:      errorsCount,
		Status:          "completado",
	}, nil
}

func (s *instructorImportService) ListImports(limit int) ([]InstructorImportLogItem, error) {
	logs, err := s.logRepo.FindAll(limit)
	if err != nil {
		return nil, err
	}
	items := make([]InstructorImportLogItem, len(logs))
	for i, l := range logs {
		items[i] = InstructorImportLogItem{
			ID:               l.ID,
			Filename:         l.Filename,
			ProcessedCount:   l.ProcessedCount,
			DuplicatesCount:  l.DuplicatesCount,
			ErrorCount:       l.ErrorCount,
			Status:           l.Status,
			CreatedAt:        l.CreatedAt,
		}
		if l.User != nil {
			items[i].UsuarioNombre = l.User.Email
		}
	}
	return items, nil
}

func (s *instructorImportService) buildColumnIndex(headerRow []string) (map[string]int, error) {
	colIndex := make(map[string]int)
	for i, cell := range headerRow {
		key := strings.TrimSpace(strings.ToLower(cell))
		if canonical, ok := instructorImportHeaders[key]; ok {
			colIndex[canonical] = i
		}
	}
	if _, has := colIndex["identificacion"]; !has {
		return nil, fmt.Errorf("falta la columna 'IDENTIFICACIÓN' (o 'Identificación')")
	}
	if _, has := colIndex["nombres_completo"]; !has {
		return nil, fmt.Errorf("falta la columna 'NOMBRES Y APELLIDOS COMPLETO'")
	}
	return colIndex, nil
}

func (s *instructorImportService) buildTipoDocumentoMap() (map[string]uint, error) {
	tipos, err := s.catalogoRepo.FindTiposDocumento()
	if err != nil {
		return nil, err
	}
	byName := make(map[string]uint)
	for _, t := range tipos {
		nombreNorm := strings.TrimSpace(strings.ToLower(t.Nombre))
		byName[nombreNorm] = t.ID
	}
	for codigo, nombreCompleto := range tipoDocCodigoANombre {
		nombreNorm := strings.TrimSpace(strings.ToLower(nombreCompleto))
		if id, has := byName[nombreNorm]; has {
			byName[strings.ToLower(codigo)] = id
		}
	}
	for excelKey, nombreBD := range tipoDocNombreExcelANombreBD {
		nombreNorm := strings.TrimSpace(strings.ToLower(nombreBD))
		if id, has := byName[nombreNorm]; has {
			byName[excelKey] = id
		}
	}
	return byName, nil
}

func (s *instructorImportService) buildGeneroMap() (map[string]uint, error) {
	generos, err := s.catalogoRepo.FindGeneros()
	if err != nil {
		return nil, err
	}
	byKey := make(map[string]uint)
	for _, g := range generos {
		nombreNorm := strings.TrimSpace(strings.ToLower(g.Nombre))
		byKey[nombreNorm] = g.ID
	}
	return byKey, nil
}

func (s *instructorImportService) rowToPersonaRequest(row []string, colIndex map[string]int, tipoByKey map[string]uint, generoByKey map[string]uint) *dto.PersonaRequest {
	get := func(key string) string {
		if idx, ok := colIndex[key]; ok && idx < len(row) {
			return strings.TrimSpace(row[idx])
		}
		return ""
	}

	numeroDoc := get("identificacion")
	nombresCompleto := get("nombres_completo")
	if numeroDoc == "" || nombresCompleto == "" {
		return nil
	}

	primerNombre, segundoNombre, primerApellido, segundoApellido := splitNombreCompleto(nombresCompleto)

	req := &dto.PersonaRequest{
		NumeroDocumento: numeroDoc,
		PrimerNombre:    primerNombre,
		SegundoNombre:   segundoNombre,
		PrimerApellido:  primerApellido,
		SegundoApellido: segundoApellido,
		Celular:         get("numero_telefono"),
		Email:           get("correo"),
		Status:          ptrBool(true),
	}

	if tipoStr := get("tipo_documento"); tipoStr != "" {
		key := strings.TrimSpace(strings.ToLower(tipoStr))
		if id, ok := tipoByKey[key]; ok {
			req.TipoDocumento = &id
		}
		// Intentar también por nombre completo en BD
		if req.TipoDocumento == nil {
			if id, ok := tipoByKey[tipoStr]; ok {
				req.TipoDocumento = &id
			}
		}
	}

	if genStr := get("genero"); genStr != "" {
		key := strings.TrimSpace(strings.ToLower(genStr))
		if id, ok := generoByKey[key]; ok {
			req.Genero = &id
		}
	}

	if fechaStr := get("fecha_nacimiento"); fechaStr != "" {
		if t := parseFechaNacimiento(fechaStr); t != nil {
			req.FechaNacimiento = dto.FromTime(t)
		}
	}

	return req
}

// splitNombreCompleto divide "NOMBRE1 NOMBRE2 APELLIDO1 APELLIDO2" en 4 campos.
// Heurística: 4 palabras -> pn, sn, pa, sa; 3 -> pn, "", pa, sa; 2 -> pn, "", pa, ""; 1 -> todo en pn.
func splitNombreCompleto(full string) (primerNombre, segundoNombre, primerApellido, segundoApellido string) {
	full = strings.TrimSpace(full)
	if full == "" {
		return "", "", "", ""
	}
	parts := strings.Fields(full)
	switch len(parts) {
	case 4:
		return parts[0], parts[1], parts[2], parts[3]
	case 3:
		return parts[0], "", parts[1], parts[2]
	case 2:
		return parts[0], "", parts[1], ""
	case 1:
		return parts[0], "", "", ""
	default:
		// 5 o más: primeros dos como nombres, últimas dos como apellidos, el resto se suma al segundo nombre
		primerNombre = parts[0]
		segundoApellido = parts[len(parts)-1]
		primerApellido = parts[len(parts)-2]
		segundoNombre = strings.Join(parts[1:len(parts)-2], " ")
		return primerNombre, segundoNombre, primerApellido, segundoApellido
	}
}

// parseFechaNacimiento intenta DD/MM/YYYY, DD-MM-YYYY o 2006-01-02.
func parseFechaNacimiento(s string) *time.Time {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	formats := []string{"02/01/2006", "02-01-2006", "2006-01-02", "02/01/06"}
	for _, layout := range formats {
		t, err := time.Parse(layout, s)
		if err == nil {
			return &t
		}
	}
	// Excel a veces guarda como número de serie; si es número intentar como días desde 1900
	if n, err := strconv.Atoi(s); err == nil && n > 0 {
		// Excel serial: 1 = 1900-01-01 (con bug 1900 bisiesto)
		base := time.Date(1899, 12, 30, 0, 0, 0, 0, time.UTC)
		t := base.AddDate(0, 0, n)
		return &t
	}
	return nil
}
