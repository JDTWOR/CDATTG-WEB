package services

import (
	"bytes"
	"fmt"
	"sort"
	"strconv"
	"strings"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/xuri/excelize/v2"
)

// Nombres de columnas del Excel catálogo (hoja "Programas en Ejecución")
const (
	colCodigo    = 0  // PRF_CODIGO
	colVersion   = 1  // PRF_VERSION
	colTipoForm  = 3  // TIPO DE FORMACION
	colNombre    = 4  // PRF_DENOMINACION
	colNivel     = 5  // NIVEL DE FORMACION
	colHorasTot  = 6  // PRF_DURACION_MAXIMA
	colHorasLect = 7  // PRF_DUR_ETAPA_LECTIVA
	colHorasProd = 8  // PRF_DUR_ETAPA_PROD
	colRedConoc  = 21 // Red de Conocimiento
)

type ProgramaFormacionImportService interface {
	ImportFromCatalogoExcel(fileBytes []byte, filename string) (*ProgramaImportResult, error)
}

type programaFormacionImportService struct {
	programaRepo   repositories.ProgramaFormacionRepository
	redRepo        repositories.RedConocimientoRepository
	catalogoRepo   repositories.CatalogoRepository
}

func NewProgramaFormacionImportService() ProgramaFormacionImportService {
	return &programaFormacionImportService{
		programaRepo: repositories.NewProgramaFormacionRepository(),
		redRepo:      repositories.NewRedConocimientoRepository(),
		catalogoRepo: repositories.NewCatalogoRepository(),
	}
}

type ProgramaImportResult struct {
	ProcessedCount  int `json:"processed_count"`
	DuplicatesCount int `json:"duplicates_count"`
	ErrorCount      int `json:"error_count"`
	RedesCreated    int `json:"redes_created"`
	Status          string `json:"status"`
}

func (s *programaFormacionImportService) ImportFromCatalogoExcel(fileBytes []byte, filename string) (*ProgramaImportResult, error) {
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

	// Filtrar solo TÉCNICO y TECNÓLOGO
	var candidatos [][]string
	for i := 1; i < len(rows); i++ {
		row := rows[i]
		if colNivel >= len(row) { continue }
		nivel := strings.TrimSpace(strings.ToUpper(normalizeAccents(row[colNivel])))
		if nivel != "TECNICO" && nivel != "TECNOLOGO" { continue }
		candidatos = append(candidatos, row)
	}

	// Agrupar por código y quedarse con la fila de versión máxima
	type item struct {
		version int
		row     []string
	}
	byCodigo := make(map[string]item)
	for _, row := range candidatos {
		if colCodigo >= len(row) || colVersion >= len(row) { continue }
		codigo := strings.TrimSpace(strings.ToUpper(row[colCodigo]))
		if codigo == "" { continue }
		ver, _ := strconv.Atoi(strings.TrimSpace(row[colVersion]))
		if cur, ok := byCodigo[codigo]; !ok || ver > cur.version {
			byCodigo[codigo] = item{version: ver, row: row}
		}
	}

	// Cargar catálogos: nivel -> id, tipo "TITULADA" -> id, red por nombre
	niveles, _ := s.catalogoRepo.FindNivelesFormacion()
	nivelByName := make(map[string]uint)
	for _, n := range niveles {
		key := strings.TrimSpace(strings.ToUpper(normalizeAccents(n.Nombre)))
		nivelByName[key] = n.ID
	}
	tipos, _ := s.catalogoRepo.FindTiposPrograma()
	var tipoTituladaID *uint
	for _, t := range tipos {
		if strings.TrimSpace(strings.ToUpper(normalizeAccents(t.Nombre))) == "TITULADA" {
			id := t.ID
			tipoTituladaID = &id
			break
		}
	}
	redByName := make(map[string]uint)
	redesList, _ := s.redRepo.FindAll()
	for _, r := range redesList {
		key := strings.TrimSpace(strings.ToUpper(normalizeAccents(r.Nombre)))
		redByName[key] = r.ID
	}

	var processed, duplicates, errors, redesCreated int
	codigosOrdenados := make([]string, 0, len(byCodigo))
	for c := range byCodigo { codigosOrdenados = append(codigosOrdenados, c) }
	sort.Strings(codigosOrdenados)

	for _, codigo := range codigosOrdenados {
		it := byCodigo[codigo]
		row := it.row
		req, errReq := s.rowToProgramaRequest(row, nivelByName, tipoTituladaID, redByName, &redesCreated, s.redRepo)
		if errReq != nil {
			errors++
			continue
		}
		if req == nil {
			continue
		}
		req.Codigo = codigo
		if s.programaRepo.ExistsByCodigo(codigo) {
			duplicates++
			continue
		}
		p := s.toModel(*req)
		p.Codigo = codigo
		if err := s.programaRepo.Create(&p); err != nil {
			errors++
			continue
		}
		processed++
	}

	return &ProgramaImportResult{
		ProcessedCount:  processed,
		DuplicatesCount: duplicates,
		ErrorCount:      errors,
		RedesCreated:    redesCreated,
		Status:          "completado",
	}, nil
}

func (s *programaFormacionImportService) rowToProgramaRequest(
	row []string,
	nivelByName map[string]uint,
	tipoTituladaID *uint,
	redByName map[string]uint,
	redesCreated *int,
	redRepo repositories.RedConocimientoRepository,
) (*dto.ProgramaFormacionRequest, error) {
	get := func(i int) string {
		if i < len(row) { return strings.TrimSpace(row[i]) }
		return ""
	}
	codigo := get(colCodigo)
	nombre := get(colNombre)
	if codigo == "" || nombre == "" {
		return nil, nil
	}
	req := &dto.ProgramaFormacionRequest{
		Codigo: codigo,
		Nombre: nombre,
		Status: ptrBool(true),
	}
	// Nivel de formación (TÉCNICO / TECNÓLOGO)
	nivelStr := strings.ToUpper(normalizeAccents(get(colNivel)))
	if id, ok := nivelByName[nivelStr]; ok {
		req.NivelFormacionID = &id
	}
	req.TipoProgramaID = tipoTituladaID
	// Horas
	if h := parseInt(get(colHorasTot)); h != nil { req.HorasTotales = h }
	if h := parseInt(get(colHorasLect)); h != nil { req.HorasEtapaLectiva = h }
	if h := parseInt(get(colHorasProd)); h != nil { req.HorasEtapaProductiva = h }
	// Red de conocimiento: obtener o crear
	redNombre := get(colRedConoc)
	if redNombre != "" {
		key := strings.ToUpper(normalizeAccents(redNombre))
		if id, ok := redByName[key]; ok {
			req.RedConocimientoID = &id
		} else {
			red := &models.RedConocimiento{Nombre: strings.TrimSpace(redNombre)}
			if err := redRepo.Create(red); err != nil {
				return nil, err
			}
			redByName[key] = red.ID
			*redesCreated++
			req.RedConocimientoID = &red.ID
		}
	}
	return req, nil
}

func (s *programaFormacionImportService) toModel(req dto.ProgramaFormacionRequest) models.ProgramaFormacion {
	p := models.ProgramaFormacion{
		Codigo:               req.Codigo,
		Nombre:               strings.TrimSpace(strings.ToUpper(req.Nombre)),
		RedConocimientoID:    req.RedConocimientoID,
		NivelFormacionID:     req.NivelFormacionID,
		TipoProgramaID:       req.TipoProgramaID,
		HorasTotales:         req.HorasTotales,
		HorasEtapaLectiva:    req.HorasEtapaLectiva,
		HorasEtapaProductiva: req.HorasEtapaProductiva,
		Status:               true,
	}
	if req.Status != nil {
		p.Status = *req.Status
	}
	return p
}

func normalizeAccents(s string) string {
	var b strings.Builder
	for _, r := range s {
		switch r {
		case 'Á', 'À', 'Â', 'Ã': b.WriteRune('A')
		case 'É', 'È', 'Ê': b.WriteRune('E')
		case 'Í', 'Ì', 'Î': b.WriteRune('I')
		case 'Ó', 'Ò', 'Ô', 'Õ': b.WriteRune('O')
		case 'Ú', 'Ù', 'Û': b.WriteRune('U')
		case 'Ñ': b.WriteRune('N')
		default: b.WriteRune(r)
		}
	}
	return b.String()
}

func parseInt(s string) *int {
	if s == "" { return nil }
	n, err := strconv.Atoi(s)
	if err != nil { return nil }
	return &n
}
