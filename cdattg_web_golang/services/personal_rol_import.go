// @module personal_rol_import
// @description Procesamiento de importación masiva de Personal Operativo, Administrativo y Contratistas.
// @author JDTWOR
// @created 2026-08-14
package services

import (
	"bytes"
	"fmt"
	"time"

	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/xuri/excelize/v2"
)

// Tipos de rol del módulo Personal soportados por la importación masiva.
const (
	TipoRolPersonalOperativoApoyo   = "personal_operativo_apoyo"
	TipoRolPersonalAdministrativo   = "personal_administrativo"
	TipoRolContratista              = "contratista"
)

// PersonalRolImportService define la importación masiva de roles de personal desde Excel.
// El formato de plantilla es el mismo de instructores (BASE DE DATOS CONTRATISTAS REGULAR.xlsx).
type PersonalRolImportService interface {
	ImportFromExcel(tipo string, fileBytes []byte, filename string, userID uint) (*ImportResult, error)
	ListImports(tipo string, limit int) ([]PersonalRolImportLogItem, error)
	GenerarPlantilla(tipo string) ([]byte, string, error)
}

// personalRolImportService implementa PersonalRolImportService reutilizando el helper de instructores.
type personalRolImportService struct {
	helper     *instructorImportService
	rolRepo    repositories.PersonalOperativoApoyoRepository
	rolSvc     PersonalOperativoApoyoService
	paRepo     repositories.PersonalAdministrativoRepository
	paSvc      PersonalAdministrativoService
	contRepo   repositories.ContratistaRepository
	contSvc    ContratistaService
	logRepo    repositories.PersonalRolImportLogRepository
}

// NewPersonalRolImportService crea el servicio de importación de roles de personal reutilizando
// el parser de instructores (rowToPersonaRequest, mapa de tipos, etc.) sin duplicarlo.
func NewPersonalRolImportService() PersonalRolImportService {
	return &personalRolImportService{
		helper:   NewInstructorImportService().(*instructorImportService),
		rolRepo:  repositories.NewPersonalOperativoApoyoRepository(),
		rolSvc:   NewPersonalOperativoApoyoService(),
		paRepo:   repositories.NewPersonalAdministrativoRepository(),
		paSvc:    NewPersonalAdministrativoService(),
		contRepo: repositories.NewContratistaRepository(),
		contSvc:  NewContratistaService(),
		logRepo:  repositories.NewPersonalRolImportLogRepository(),
	}
}

// rolCasbinByTipo devuelve el rol Casbin correspondiente al tipo de rol del módulo Personal.
func rolCasbinByTipo(tipo string) string {
	switch tipo {
	case TipoRolPersonalOperativoApoyo:
		return authz.RolPersonalOperativoYDeApoyo
	case TipoRolContratista:
		return authz.RolContratistaPrestacionServicios
	default:
		return authz.RolPersonalAdministrativo
	}
}

// ImportFromExcel procesa un archivo Excel y crea o vincula personas y roles de personal.
// Parámetros: tipo (TipoRolPersonalOperativoApoyo | TipoRolPersonalAdministrativo |
// TipoRolContratista), fileBytes (contenido XLSX), filename (nombre original),
// userID (usuario que ejecuta la importación). Devuelve ImportResult con conteos de
// procesados, duplicados y errores. Ejemplo: ImportFromExcel("contratista", buf, "a.xlsx", 1).
func (s *personalRolImportService) ImportFromExcel(tipo string, fileBytes []byte, filename string, userID uint) (*ImportResult, error) {
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

	colIndex, err := s.helper.buildColumnIndex(rows[0])
	if err != nil {
		return nil, err
	}
	tipoByKey, err := s.helper.buildTipoDocumentoMap()
	if err != nil {
		return nil, err
	}
	generoByKey, err := s.helper.buildGeneroMap()
	if err != nil {
		return nil, err
	}

	var processed, duplicates, errorsCount int
	var createdPersonaIDs []uint

	for i := 1; i < len(rows); i++ {
		res := s.tryImportRolRow(tipo, rows[i], colIndex, tipoByKey, generoByKey)
		switch {
		case res.err:
			errorsCount++
		case res.duplicate:
			duplicates++
		case res.processed:
			processed++
		}
		if res.newPersonaID != 0 {
			createdPersonaIDs = append(createdPersonaIDs, res.newPersonaID)
		}
	}

	if len(createdPersonaIDs) > 0 {
		_ = s.helper.personaService.EnsureUsersForPersonas(createdPersonaIDs)
	}

	logEntry := &models.PersonalRolImportLog{
		Tipo:            tipo,
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