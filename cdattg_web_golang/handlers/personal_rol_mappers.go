// @module personal_rol_mappers
// @description Conversión de modelos de roles de personal (operativo, administrativo, contratista) a DTO.
// @author JDTWOR
// @created 2026-08-14
package handlers

import (
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

// personalOperativoApoyoToRolItem convierte el modelo en RolPersonalItem usando la Persona vinculada.
// Documento y nombre provienen de Persona; si no hay Persona, usa los cachés del modelo.
func personalOperativoApoyoToRolItem(m models.PersonalOperativoApoyo) dto.RolPersonalItem {
	nombre, doc := nombreDocDesdePersona(m.Persona, m.NombreCompletoCache, m.NumeroDocumentoCache)
	return dto.RolPersonalItem{ID: m.ID, Nombre: nombre, NumeroDocumento: doc, Estado: m.Status}
}

// personalAdministrativoToRolItem convierte el modelo en RolPersonalItem usando la Persona vinculada.
// Documento y nombre provienen de Persona; si no hay Persona, usa los cachés del modelo.
func personalAdministrativoToRolItem(m models.PersonalAdministrativo) dto.RolPersonalItem {
	nombre, doc := nombreDocDesdePersona(m.Persona, m.NombreCompletoCache, m.NumeroDocumentoCache)
	return dto.RolPersonalItem{ID: m.ID, Nombre: nombre, NumeroDocumento: doc, Estado: m.Status}
}

// contratistaToRolItem convierte el modelo en RolPersonalItem usando la Persona vinculada.
// Documento y nombre provienen de Persona; si no hay Persona, usa los cachés del modelo.
func contratistaToRolItem(m models.Contratista) dto.RolPersonalItem {
	nombre, doc := nombreDocDesdePersona(m.Persona, m.NombreCompletoCache, m.NumeroDocumentoCache)
	return dto.RolPersonalItem{ID: m.ID, Nombre: nombre, NumeroDocumento: doc, Estado: m.Status}
}

// nombreDocDesdePersona resuelve nombre y documento desde Persona, con fallback a los cachés.
func nombreDocDesdePersona(p *models.Persona, nombreCache, docCache string) (string, string) {
	nombre, doc := nombreCache, docCache
	if p != nil {
		if n := p.GetFullName(); n != "" {
			nombre = n
		}
		if p.NumeroDocumento != "" {
			doc = p.NumeroDocumento
		}
	}
	return nombre, doc
}