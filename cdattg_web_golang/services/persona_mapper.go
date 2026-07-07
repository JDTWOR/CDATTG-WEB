package services

import (
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func mapPersonaToResponse(persona models.Persona) dto.PersonaResponse {
	return dto.PersonaResponse{
		ID:              persona.ID,
		TipoDocumento:   persona.TipoDocumentoID,
		NumeroDocumento: persona.NumeroDocumento,
		PrimerNombre:    persona.PrimerNombre,
		SegundoNombre:   persona.SegundoNombre,
		PrimerApellido:  persona.PrimerApellido,
		SegundoApellido: persona.SegundoApellido,
		FullName:        persona.GetFullName(),
		FechaNacimiento: persona.FechaNacimiento,
		Genero:          persona.GeneroID,
		Telefono:        persona.Telefono,
		Celular:         persona.Celular,
		Email:           persona.Email,
		PaisID:          persona.PaisID,
		DepartamentoID:  persona.DepartamentoID,
		MunicipioID:     persona.MunicipioID,
		Direccion:       persona.Direccion,
		Status:          persona.Status,
		ParametroID:     persona.PersonaCaracterizacionID,
	}
}

func mapPersonaRequestToModel(req dto.PersonaRequest) models.Persona {
	return models.Persona{
		TipoDocumentoID:          req.TipoDocumento,
		NumeroDocumento:          req.NumeroDocumento,
		PrimerNombre:             req.PrimerNombre,
		SegundoNombre:            req.SegundoNombre,
		PrimerApellido:           req.PrimerApellido,
		SegundoApellido:          req.SegundoApellido,
		FechaNacimiento:          flexDateToTime(req.FechaNacimiento),
		GeneroID:                 req.Genero,
		Telefono:                 req.Telefono,
		Celular:                  req.Celular,
		Email:                    req.Email,
		PaisID:                   req.PaisID,
		DepartamentoID:           req.DepartamentoID,
		MunicipioID:              req.MunicipioID,
		Direccion:                req.Direccion,
		PersonaCaracterizacionID: req.ParametroID,
		NivelEscolaridadID:       req.NivelEscolaridadID,
	}
}

func applyPersonaRequest(persona *models.Persona, req dto.PersonaRequest) {
	persona.TipoDocumentoID = req.TipoDocumento
	persona.NumeroDocumento = req.NumeroDocumento
	persona.PrimerNombre = req.PrimerNombre
	persona.SegundoNombre = req.SegundoNombre
	persona.PrimerApellido = req.PrimerApellido
	persona.SegundoApellido = req.SegundoApellido
	persona.FechaNacimiento = flexDateToTime(req.FechaNacimiento)
	persona.GeneroID = req.Genero
	persona.Telefono = req.Telefono
	persona.Celular = req.Celular
	persona.Email = req.Email
	persona.PaisID = req.PaisID
	persona.DepartamentoID = req.DepartamentoID
	persona.MunicipioID = req.MunicipioID
	persona.Direccion = req.Direccion
	persona.PersonaCaracterizacionID = req.ParametroID
	persona.NivelEscolaridadID = req.NivelEscolaridadID
}

func applyPersonaSelfUpdate(persona *models.Persona, req dto.PersonaSelfUpdateRequest) {
	persona.TipoDocumentoID = req.TipoDocumento
	persona.PrimerNombre = req.PrimerNombre
	persona.SegundoNombre = req.SegundoNombre
	persona.PrimerApellido = req.PrimerApellido
	persona.SegundoApellido = req.SegundoApellido
	persona.FechaNacimiento = flexDateToTime(req.FechaNacimiento)
	persona.GeneroID = req.Genero
	persona.Telefono = req.Telefono
	persona.Celular = req.Celular
	persona.Email = req.Email
	persona.PaisID = req.PaisID
	persona.DepartamentoID = req.DepartamentoID
	persona.MunicipioID = req.MunicipioID
	persona.Direccion = req.Direccion
	persona.PersonaCaracterizacionID = req.ParametroID
	persona.NivelEscolaridadID = req.NivelEscolaridadID
}

func personaStatusFromRequest(req dto.PersonaRequest) bool {
	if req.Status != nil {
		return *req.Status
	}
	return true
}

func flexDateToTime(f *dto.FlexDate) *time.Time {
	if f == nil {
		return nil
	}
	return f.ToTime()
}
