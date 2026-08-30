// @module personal_rol_import_log
// @description Consulta del historial de importaciones de Guardas/Personal Administrativo.
// @author JDTWOR
// @created 2026-08-14
package services

import "time"

// PersonalRolImportLogItem es un ítem del historial de importaciones de guardas/personal administrativo.
type PersonalRolImportLogItem struct {
	ID              uint      `json:"id"`
	Tipo            string    `json:"tipo"`
	Filename        string    `json:"filename"`
	ProcessedCount  int       `json:"processed_count"`
	DuplicatesCount int       `json:"duplicates_count"`
	ErrorCount      int       `json:"error_count"`
	Status          string    `json:"status"`
	UsuarioNombre   string    `json:"usuario_nombre"`
	CreatedAt       time.Time `json:"created_at"`
}

// ListImports devuelve los últimos `limit` registros de importación para el tipo indicado.
// Parámetros: tipo (guarda | personal_administrativo), limit (máximo de registros).
// Retorna la lista ordenada con el nombre del usuario que ejecutó la importación.
func (s *personalRolImportService) ListImports(tipo string, limit int) ([]PersonalRolImportLogItem, error) {
	logs, err := s.logRepo.FindAll(tipo, limit)
	if err != nil {
		return nil, err
	}
	items := make([]PersonalRolImportLogItem, len(logs))
	for i, l := range logs {
		items[i] = PersonalRolImportLogItem{
			ID:              l.ID,
			Tipo:            l.Tipo,
			Filename:        l.Filename,
			ProcessedCount:  l.ProcessedCount,
			DuplicatesCount: l.DuplicatesCount,
			ErrorCount:      l.ErrorCount,
			Status:          l.Status,
			CreatedAt:       l.CreatedAt,
		}
		if l.User != nil {
			items[i].UsuarioNombre = l.User.Email
		}
	}
	return items, nil
}