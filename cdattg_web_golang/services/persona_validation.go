package services

import (
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/repositories"
)

func validatePersonaCreate(repo repositories.PersonaRepository, req dto.PersonaRequest) error {
	if repo.ExistsByNumeroDocumento(req.NumeroDocumento) {
		return errPersonaDocumentoDuplicado
	}
	if req.Email != "" && repo.ExistsByEmail(req.Email) {
		return errPersonaEmailDuplicado
	}
	if req.Celular != "" && repo.ExistsByCelular(req.Celular) {
		return errPersonaCelularDuplicado
	}
	return nil
}

func validatePersonaUpdate(repo repositories.PersonaRepository, id uint, req dto.PersonaRequest) error {
	if existing, _ := repo.FindByNumeroDocumento(req.NumeroDocumento); existing != nil && existing.ID != id {
		return errPersonaDocumentoDuplicado
	}
	if req.Email != "" {
		if existing, _ := repo.FindByEmailExcludingID(req.Email, id); existing != nil {
			return errPersonaEmailDuplicado
		}
	}
	if req.Celular != "" {
		if existing, _ := repo.FindByCelularExcludingID(req.Celular, id); existing != nil {
			return errPersonaCelularDuplicado
		}
	}
	return nil
}

func validatePersonaSelfUpdate(repo repositories.PersonaRepository, id uint, req dto.PersonaSelfUpdateRequest) error {
	if req.Email != "" {
		if existing, _ := repo.FindByEmailExcludingID(req.Email, id); existing != nil {
			return errPersonaEmailDuplicado
		}
	}
	if req.Celular != "" {
		if existing, _ := repo.FindByCelularExcludingID(req.Celular, id); existing != nil {
			return errPersonaCelularDuplicado
		}
	}
	return nil
}
