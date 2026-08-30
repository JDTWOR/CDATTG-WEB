// @module personal_rol_dto
// @description DTOs de Personal Operativo y de Apoyo, Personal Administrativo y Contratistas.
// @author JDTWOR
// @created 2026-08-14
package dto

// RolPersonalItem respuesta de un rol de personal (operativo, administrativo o contratista) para listados.
// Documento y nombre se obtienen de Persona (la fila solo tiene persona_id).
type RolPersonalItem struct {
	ID              uint   `json:"id"`
	Nombre          string `json:"nombre"`
	NumeroDocumento string `json:"numero_documento"`
	Estado          bool   `json:"estado"`
}

// CreatePersonalOperativoApoyoRequest crea personal operativo y de apoyo a partir de una persona
type CreatePersonalOperativoApoyoRequest struct {
	PersonaID uint `json:"persona_id" binding:"required"`
}

// UpdatePersonalOperativoApoyoRequest actualiza el estado de personal operativo y de apoyo
type UpdatePersonalOperativoApoyoRequest struct {
	Estado *bool `json:"estado"`
}

// CreatePersonalAdministrativoRequest crea personal administrativo a partir de una persona
type CreatePersonalAdministrativoRequest struct {
	PersonaID uint `json:"persona_id" binding:"required"`
}

// UpdatePersonalAdministrativoRequest actualiza el estado de personal administrativo
type UpdatePersonalAdministrativoRequest struct {
	Estado *bool `json:"estado"`
}

// CreateContratistaRequest crea un contratista a partir de una persona
type CreateContratistaRequest struct {
	PersonaID uint `json:"persona_id" binding:"required"`
}

// UpdateContratistaRequest actualiza el estado de un contratista
type UpdateContratistaRequest struct {
	Estado *bool `json:"estado"`
}