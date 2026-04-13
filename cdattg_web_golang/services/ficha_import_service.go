package services

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"strings"

	"github.com/extrame/xls"
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
	personaRepo  repositories.PersonaRepository
	programaRepo repositories.ProgramaFormacionRepository
	fichaRepo    repositories.FichaRepository
	aprendizRepo repositories.AprendizRepository
	catalogoRepo repositories.CatalogoRepository
	personaSvc   PersonaService
}

func NewFichaImportService() FichaImportService {
	return &fichaImportService{
		personaRepo:  repositories.NewPersonaRepository(),
		programaRepo: repositories.NewProgramaFormacionRepository(),
		fichaRepo:    repositories.NewFichaRepository(),
		aprendizRepo: repositories.NewAprendizRepository(),
		catalogoRepo: repositories.NewCatalogoRepository(),
		personaSvc:   NewPersonaService(),
	}
}

type FichaImportResult struct {
	ProcessedCount       int    `json:"processed_count"`
	UpdatedCount         int    `json:"updated_count"`
	CreatedCount         int    `json:"created_count"`
	DuplicatesCount      int    `json:"duplicates_count"`
	ErrorCount           int    `json:"error_count"`
	FichaCreated         bool   `json:"ficha_created"`
	Status               string `json:"status"`
	IncidentReportBase64 string `json:"incident_report_base64,omitempty"`
}

// readExcelRows devuelve todas las filas de la primera hoja. Soporta .xlsx (excelize) y .xls (extrame/xls).
func (s *fichaImportService) readExcelRows(fileBytes []byte, filename string) ([][]string, error) {
	lower := strings.ToLower(filename)
	isXLS := strings.HasSuffix(lower, ".xls") && !strings.HasSuffix(lower, ".xlsx")

	if isXLS {
		return s.readXLSRows(fileBytes)
	}
	return s.readXLSXRows(fileBytes)
}

func (s *fichaImportService) readXLSRows(fileBytes []byte) ([][]string, error) {
	reader := bytes.NewReader(fileBytes)
	wb, err := xls.OpenReader(reader, "utf-8")
	if err != nil {
		return nil, fmt.Errorf("archivo XLS inválido: %w", err)
	}
	if wb.NumSheets() == 0 {
		return nil, fmt.Errorf("el archivo no contiene hojas")
	}
	sheet := wb.GetSheet(0)
	if sheet == nil {
		return nil, fmt.Errorf("no se pudo leer la primera hoja")
	}
	maxRows := int(sheet.MaxRow) + 2
	if maxRows <= 0 {
		maxRows = 10000
	}
	rows := wb.ReadAllCells(maxRows)
	return rows, nil
}

func (s *fichaImportService) readXLSXRows(fileBytes []byte) ([][]string, error) {
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
	if err != nil {
		return nil, fmt.Errorf("error leyendo la hoja: %w", err)
	}
	return rows, nil
}

func extractFichaYProgramaDesdeRows(rows [][]string) (fichaCode, programName string, err error) {
	for _, row := range rows {
		if len(row) <= 2 {
			continue
		}
		cell0 := strings.TrimSpace(strings.ToLower(row[0]))
		if strings.Contains(cell0, "ficha") && strings.Contains(cell0, "caracterización") {
			val := strings.TrimSpace(row[2])
			if val == "" {
				break
			}
			idx := strings.Index(val, " - ")
			if idx > 0 {
				fichaCode = strings.TrimSpace(val[:idx])
				programName = strings.TrimSpace(val[idx+3:])
			} else {
				fichaCode = val
			}
			break
		}
	}
	if fichaCode == "" {
		return "", "", fmt.Errorf("no se encontró la línea 'Ficha de Caracterización' con código y nombre de programa")
	}
	return fichaCode, programName, nil
}

func findFilaCabeceraAprendices(rows [][]string) (dataStartRow int, err error) {
	for i, row := range rows {
		if len(row) <= 5 {
			continue
		}
		c0 := strings.TrimSpace(strings.ToLower(row[0]))
		c1 := strings.TrimSpace(strings.ToLower(row[1]))
		if (strings.Contains(c0, "tipo") && strings.Contains(c0, "documento")) &&
			(strings.Contains(c1, "número") || strings.Contains(c1, "numero")) {
			return i + 1, nil
		}
	}
	return -1, fmt.Errorf("no se encontró la fila de cabecera (Tipo de Documento, Número de Documento, Nombre, Apellidos...)")
}

func (s *fichaImportService) buildTipoDocumentoCodeMap() map[string]uint {
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
	return tipoByCode
}

func (s *fichaImportService) getOrCreateFicha(fichaCode string, programa *models.ProgramaFormacion) (*models.FichaCaracterizacion, bool, error) {
	ficha, err := s.fichaRepo.FindByFicha(fichaCode)
	if err != nil {
		ficha = &models.FichaCaracterizacion{
			ProgramaFormacionID: programa.ID,
			Ficha:               fichaCode,
			Status:              true,
		}
		if err := s.fichaRepo.Create(ficha); err != nil {
			return nil, false, fmt.Errorf("error al crear ficha %s: %w", fichaCode, err)
		}
		return ficha, true, nil
	}
	return ficha, false, nil
}

// fichaImportIncident una fila del reporte de incidencias (evita funciones con demasiados parámetros).
type fichaImportIncident struct {
	Tipo            string
	NumeroDocumento string
	Nombre          string
	Apellidos       string
	CorreoOriginal  string
	CelularOriginal string
	FichaOrigen     string
	FichaDestino    string
	Detalle         string
}

type fichaImportIncidentWriter struct {
	file    *excelize.File
	sheet   string
	nextRow int
	has     bool
}

func newFichaImportIncidentWriter() *fichaImportIncidentWriter {
	f := excelize.NewFile()
	sheet := "Incidencias"
	defaultSheet := f.GetSheetName(0)
	if defaultSheet != "" {
		_ = f.SetSheetName(defaultSheet, sheet)
	}
	headers := []string{"tipo_incidente", "numero_documento", "nombre", "apellidos", "correo_original", "celular_original", "ficha_origen", "ficha_destino", "detalle"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue(sheet, cell, h)
	}
	return &fichaImportIncidentWriter{file: f, sheet: sheet, nextRow: 2}
}

func (w *fichaImportIncidentWriter) add(inc fichaImportIncident) {
	w.has = true
	values := []string{
		inc.Tipo, inc.NumeroDocumento, inc.Nombre, inc.Apellidos,
		inc.CorreoOriginal, inc.CelularOriginal, inc.FichaOrigen, inc.FichaDestino, inc.Detalle,
	}
	for i, v := range values {
		cell, _ := excelize.CoordinatesToCellName(i+1, w.nextRow)
		_ = w.file.SetCellValue(w.sheet, cell, v)
	}
	w.nextRow++
}

func (w *fichaImportIncidentWriter) toBase64() string {
	if !w.has {
		return ""
	}
	var buf bytes.Buffer
	if err := w.file.Write(&buf); err != nil {
		return ""
	}
	return base64.StdEncoding.EncodeToString(buf.Bytes())
}

type fichaImportCounters struct {
	processed, updated, created, duplicates, errCount int
}

type fichaImportRunner struct {
	s           *fichaImportService
	ficha       *models.FichaCaracterizacion
	fichaCode   string
	tipoByCode  map[string]uint
	seenEmail   map[string]uint
	seenCelular map[string]uint
	incidents   *fichaImportIncidentWriter
	c           *fichaImportCounters
}

type parsedFichaRow struct {
	tipoDocStr, numeroDoc, nombreStr, apellidosStr string
	celular, correo, correoOriginal, celularOriginal string
	primerNombre, segundoNombre, primerApellido, segundoApellido string
	tipoID                                                       uint
}

func (r *fichaImportRunner) parseFichaRow(row []string) (parsedFichaRow, bool) {
	var p parsedFichaRow
	if len(row) <= fichaColNumDoc {
		return p, false
	}
	p.numeroDoc = strings.TrimSpace(row[fichaColNumDoc])
	if p.numeroDoc == "" {
		return p, false
	}
	p.tipoDocStr = strings.TrimSpace(strings.ToUpper(row[fichaColTipoDoc]))
	p.nombreStr = strings.TrimSpace(row[fichaColNombre])
	p.apellidosStr = strings.TrimSpace(row[fichaColApellidos])
	if len(row) > fichaColCelular {
		p.celular = strings.TrimSpace(row[fichaColCelular])
	}
	if len(row) > fichaColCorreo {
		p.correo = strings.TrimSpace(row[fichaColCorreo])
	}
	p.correoOriginal = p.correo
	p.celularOriginal = p.celular

	p.primerNombre, p.segundoNombre = splitNombre(p.nombreStr)
	p.primerApellido, p.segundoApellido = splitNombre(p.apellidosStr)
	if p.primerNombre == "" && p.primerApellido == "" {
		p.primerNombre = p.nombreStr
		p.primerApellido = p.apellidosStr
	}
	p.tipoID = r.tipoByCode[p.tipoDocStr]
	return p, true
}

func (r *fichaImportRunner) applyEmailDuplicateRules(p *parsedFichaRow) {
	var firstPersonaEmailID uint
	var emailSeen bool
	if p.correo != "" {
		firstPersonaEmailID, emailSeen = r.seenEmail[strings.ToLower(p.correo)]
	}
	emailDuplicadoBD := p.correo != "" && r.s.personaRepo.ExistsByEmail(p.correo)
	emailDuplicadoEnImport := p.correo != "" && emailSeen

	if p.correo == "" || (!emailDuplicadoBD && !emailDuplicadoEnImport) {
		return
	}
	r.incidents.add(fichaImportIncident{
		Tipo: "EMAIL_DUPLICADO", NumeroDocumento: p.numeroDoc, Nombre: p.nombreStr, Apellidos: p.apellidosStr,
		CorreoOriginal: p.correoOriginal, CelularOriginal: p.celularOriginal, FichaOrigen: "", FichaDestino: r.fichaCode,
		Detalle: "Correo ya registrado en otra persona",
	})
	if emailDuplicadoEnImport && firstPersonaEmailID != 0 {
		if persona, err := r.s.personaRepo.FindByID(firstPersonaEmailID); err == nil && persona != nil && persona.Email != "" {
			persona.Email = ""
			_ = r.s.personaRepo.Update(persona)
		}
	}
	p.correo = ""
}

func (r *fichaImportRunner) applyCelularDuplicateRules(p *parsedFichaRow) {
	var firstPersonaCelID uint
	var celSeen bool
	if p.celular != "" {
		firstPersonaCelID, celSeen = r.seenCelular[p.celular]
	}
	celDuplicadoBD := p.celular != "" && r.s.personaRepo.ExistsByCelular(p.celular)
	celDuplicadoEnImport := p.celular != "" && celSeen

	if p.celular == "" || (!celDuplicadoBD && !celDuplicadoEnImport) {
		return
	}
	r.incidents.add(fichaImportIncident{
		Tipo: "CELULAR_DUPLICADO", NumeroDocumento: p.numeroDoc, Nombre: p.nombreStr, Apellidos: p.apellidosStr,
		CorreoOriginal: p.correoOriginal, CelularOriginal: p.celularOriginal, FichaOrigen: "", FichaDestino: r.fichaCode,
		Detalle: "Celular ya registrado en otra persona",
	})
	if celDuplicadoEnImport && firstPersonaCelID != 0 {
		if persona, err := r.s.personaRepo.FindByID(firstPersonaCelID); err == nil && persona != nil && persona.Celular != "" {
			persona.Celular = ""
			_ = r.s.personaRepo.Update(persona)
		}
	}
	p.celular = ""
}

func (r *fichaImportRunner) upsertPersona(p *parsedFichaRow) (personaID uint, isNew bool, ok bool) {
	req := dto.PersonaRequest{
		NumeroDocumento: p.numeroDoc,
		PrimerNombre:    p.primerNombre,
		SegundoNombre:   p.segundoNombre,
		PrimerApellido:  p.primerApellido,
		SegundoApellido: p.segundoApellido,
		Celular:         p.celular,
		Email:           p.correo,
		Status:          ptrBool(true),
	}
	if p.tipoID != 0 {
		req.TipoDocumento = &p.tipoID
	}

	persona, errFind := r.s.personaRepo.FindByNumeroDocumento(p.numeroDoc)
	if errFind != nil || persona == nil {
		createdResp, errCreate := r.s.personaSvc.Create(req)
		if errCreate != nil {
			r.c.errCount++
			return 0, false, false
		}
		r.c.created++
		return createdResp.ID, true, true
	}
	if _, errUpdate := r.s.personaSvc.Update(persona.ID, req); errUpdate != nil {
		r.c.errCount++
		return 0, false, false
	}
	r.c.updated++
	return persona.ID, false, true
}

func (r *fichaImportRunner) recordSeenForNewPersona(p *parsedFichaRow, personaID uint, isNew bool) {
	if !isNew {
		return
	}
	if p.correoOriginal != "" {
		r.seenEmail[strings.ToLower(p.correoOriginal)] = personaID
	}
	if p.celularOriginal != "" {
		r.seenCelular[p.celularOriginal] = personaID
	}
}

func (r *fichaImportRunner) tryEnrollAprendiz(p *parsedFichaRow, personaID uint) {
	if existingAprendiz, errAprendiz := r.s.aprendizRepo.FindByPersonaID(personaID); errAprendiz == nil && existingAprendiz != nil {
		if existingAprendiz.FichaCaracterizacionID == r.ficha.ID {
			r.c.duplicates++
			return
		}
		r.c.duplicates++
		fichaOrigenCodigo := ""
		if fichaOrigen, errFicha := r.s.fichaRepo.FindByID(existingAprendiz.FichaCaracterizacionID); errFicha == nil && fichaOrigen != nil {
			fichaOrigenCodigo = fichaOrigen.Ficha
		}
		r.incidents.add(fichaImportIncident{
			Tipo: "YA_EN_OTRA_FICHA", NumeroDocumento: p.numeroDoc, Nombre: p.nombreStr, Apellidos: p.apellidosStr,
			CorreoOriginal: p.correoOriginal, CelularOriginal: p.celularOriginal, FichaOrigen: fichaOrigenCodigo, FichaDestino: r.fichaCode,
			Detalle: "Persona ya inscrita en otra ficha de formación",
		})
		return
	}

	if _, errAprendiz := r.s.aprendizRepo.FindByPersonaIDAndFichaID(personaID, r.ficha.ID); errAprendiz == nil {
		r.c.duplicates++
		return
	}
	aprendiz := models.Aprendiz{
		PersonaID:              personaID,
		FichaCaracterizacionID: r.ficha.ID,
		Estado:                 true,
	}
	if err := r.s.aprendizRepo.Create(&aprendiz); err != nil {
		r.c.errCount++
		return
	}
	r.c.processed++
}

func (r *fichaImportRunner) processRow(row []string) {
	p, ok := r.parseFichaRow(row)
	if !ok {
		return
	}
	r.applyEmailDuplicateRules(&p)
	r.applyCelularDuplicateRules(&p)
	personaID, isNew, ok := r.upsertPersona(&p)
	if !ok {
		return
	}
	r.recordSeenForNewPersona(&p, personaID, isNew)
	r.tryEnrollAprendiz(&p, personaID)
}

func (s *fichaImportService) ImportFromExcel(fileBytes []byte, filename string) (*FichaImportResult, error) {
	rows, err := s.readExcelRows(fileBytes, filename)
	if err != nil {
		return nil, err
	}
	if len(rows) < 6 {
		return nil, fmt.Errorf("el archivo debe tener al menos cabecera y una fila de datos")
	}

	fichaCode, programName, err := extractFichaYProgramaDesdeRows(rows)
	if err != nil {
		return nil, err
	}

	dataStartRow, err := findFilaCabeceraAprendices(rows)
	if err != nil {
		return nil, err
	}

	programa, err := s.programaRepo.FindFirstByNombreContaining(programName)
	if err != nil {
		return nil, fmt.Errorf("programa de formación no encontrado por nombre: %q", programName)
	}

	ficha, fichaCreated, err := s.getOrCreateFicha(fichaCode, programa)
	if err != nil {
		return nil, err
	}

	tipoByCode := s.buildTipoDocumentoCodeMap()
	incidentW := newFichaImportIncidentWriter()

	counters := &fichaImportCounters{}
	runner := &fichaImportRunner{
		s:           s,
		ficha:       ficha,
		fichaCode:   fichaCode,
		tipoByCode:  tipoByCode,
		seenEmail:   make(map[string]uint),
		seenCelular: make(map[string]uint),
		incidents:   incidentW,
		c:           counters,
	}

	for i := dataStartRow; i < len(rows); i++ {
		runner.processRow(rows[i])
	}

	return &FichaImportResult{
		ProcessedCount:       counters.processed,
		UpdatedCount:         counters.updated,
		CreatedCount:         counters.created,
		DuplicatesCount:      counters.duplicates,
		ErrorCount:           counters.errCount,
		FichaCreated:         fichaCreated,
		Status:               "completado",
		IncidentReportBase64: incidentW.toBase64(),
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
