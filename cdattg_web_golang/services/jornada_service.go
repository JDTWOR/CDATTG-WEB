package services

import (
	"errors"
	"fmt"
	"strings"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"gorm.io/gorm"
)

type JornadaService struct {
	jornadaRepo   repositories.JornadaRepository
	bloqueRepo    repositories.JornadaBloqueRepository
	fichaDiasRepo repositories.FichaDiasRepository
}

func NewJornadaService() *JornadaService {
	return &JornadaService{
		jornadaRepo:   repositories.NewJornadaRepository(),
		bloqueRepo:    repositories.NewJornadaBloqueRepository(),
		fichaDiasRepo: repositories.NewFichaDiasRepository(),
	}
}

func (s *JornadaService) List() ([]dto.JornadaAdminItem, error) {
	list, err := s.jornadaRepo.List()
	if err != nil {
		return nil, err
	}
	out := make([]dto.JornadaAdminItem, len(list))
	for i := range list {
		item, err := s.toAdminItem(&list[i])
		if err != nil {
			return nil, err
		}
		out[i] = *item
	}
	return out, nil
}

func (s *JornadaService) Create(req dto.JornadaCreateRequest) (*dto.JornadaAdminItem, error) {
	nombre := strings.TrimSpace(req.Nombre)
	if nombre == "" {
		return nil, errors.New("el nombre es obligatorio")
	}
	if _, err := s.jornadaRepo.FindByNombre(nombre); err == nil {
		return nil, errors.New("ya existe una jornada con ese nombre")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	inputs, err := bloquesDTOToInput(req.Bloques)
	if err != nil {
		return nil, err
	}
	if err := ValidarHorariosSinSolape(inputs); err != nil {
		return nil, err
	}
	ext := extensionFromRequest(req.MinutosExtensionFin)
	j := &models.Jornada{
		Nombre:              nombre,
		MinutosExtensionFin: &ext,
	}
	if err := s.jornadaRepo.Create(j); err != nil {
		return nil, err
	}
	if err := s.bloqueRepo.ReplaceByJornadaID(j.ID, bloquesInputToModel(j.ID, req.Bloques)); err != nil {
		return nil, err
	}
	return s.toAdminItem(j)
}

func (s *JornadaService) Update(id uint, req dto.JornadaUpdateRequest) (*dto.JornadaUpdateResponse, error) {
	j, err := s.jornadaRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("jornada no encontrada")
	}
	oldPlantilla, err := s.bloqueRepo.FindByJornadaID(id)
	if err != nil {
		return nil, err
	}
	nombre := strings.TrimSpace(req.Nombre)
	if nombre == "" {
		return nil, errors.New("el nombre es obligatorio")
	}
	if other, err := s.jornadaRepo.FindByNombre(nombre); err == nil && other.ID != id {
		return nil, errors.New("ya existe otra jornada con ese nombre")
	} else if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	inputs, err := bloquesDTOToInput(req.Bloques)
	if err != nil {
		return nil, err
	}
	if err := ValidarHorariosSinSolape(inputs); err != nil {
		return nil, err
	}
	ext := extensionFromRequest(req.MinutosExtensionFin)
	j.Nombre = nombre
	j.MinutosExtensionFin = &ext
	if err := s.jornadaRepo.Update(j); err != nil {
		return nil, err
	}
	if err := s.bloqueRepo.ReplaceByJornadaID(id, bloquesInputToModel(id, req.Bloques)); err != nil {
		return nil, err
	}
	item, err := s.toAdminItem(j)
	if err != nil {
		return nil, err
	}
	resp := &dto.JornadaUpdateResponse{JornadaAdminItem: *item}
	if req.PropagarFichas == nil || *req.PropagarFichas {
		prop, propErr := s.propagarPlantilla(id, oldPlantilla)
		if propErr != nil {
			return nil, propErr
		}
		resp.Propagacion = &prop
	}
	return resp, nil
}

func (s *JornadaService) Propagar(id uint) (*dto.JornadaPropagateResult, error) {
	if _, err := s.jornadaRepo.FindByID(id); err != nil {
		return nil, errors.New("jornada no encontrada")
	}
	plantilla, err := s.bloqueRepo.FindByJornadaID(id)
	if err != nil {
		return nil, err
	}
	if len(plantilla) == 0 {
		return nil, errors.New("la jornada no tiene bloques definidos")
	}
	prop, err := s.propagarPlantilla(id, plantilla)
	if err != nil {
		return nil, err
	}
	return &prop, nil
}

func (s *JornadaService) propagarPlantilla(jornadaID uint, oldPlantilla []models.JornadaBloque) (dto.JornadaPropagateResult, error) {
	newPlantilla, err := s.bloqueRepo.FindByJornadaID(jornadaID)
	if err != nil {
		return dto.JornadaPropagateResult{}, err
	}
	fichaIDs, err := s.fichaDiasRepo.FindDistinctFichaIDsReferencingJornada(jornadaID)
	if err != nil {
		return dto.JornadaPropagateResult{}, err
	}
	if len(fichaIDs) == 0 {
		return dto.JornadaPropagateResult{}, nil
	}
	return PropagarPlantillaAFichas(s.fichaDiasRepo, fichaIDs, jornadaID, newPlantilla, oldPlantilla), nil
}

func (s *JornadaService) Delete(id uint) error {
	if _, err := s.jornadaRepo.FindByID(id); err != nil {
		return errors.New("jornada no encontrada")
	}
	nFichas, err := s.jornadaRepo.CountFichasByJornadaID(id)
	if err != nil {
		return err
	}
	nBloques, err := s.jornadaRepo.CountFichaDiasByJornadaID(id)
	if err != nil {
		return err
	}
	if nFichas > 0 || nBloques > 0 {
		return fmt.Errorf("no se puede eliminar: %d ficha(s) o bloque(s) la referencian", nFichas+nBloques)
	}
	if err := s.bloqueRepo.DeleteByJornadaID(id); err != nil {
		return err
	}
	return s.jornadaRepo.Delete(id)
}

func (s *JornadaService) toAdminItem(j *models.Jornada) (*dto.JornadaAdminItem, error) {
	bloques, err := s.bloqueRepo.FindByJornadaID(j.ID)
	if err != nil {
		return nil, err
	}
	ext := 60
	if j.MinutosExtensionFin != nil {
		ext = *j.MinutosExtensionFin
	}
	item := &dto.JornadaAdminItem{
		ID:                  j.ID,
		Nombre:              j.Nombre,
		MinutosExtensionFin: ext,
		Bloques:             make([]dto.JornadaBloqueItem, len(bloques)),
	}
	for i, b := range bloques {
		item.Bloques[i] = dto.JornadaBloqueItem{
			ID:             b.ID,
			DiaFormacionID: b.DiaFormacionID,
			HoraInicio:     normalizeHoraMM(b.HoraInicio),
			HoraFin:        normalizeHoraMM(b.HoraFin),
			Orden:          b.Orden,
		}
		if b.DiaFormacion != nil {
			item.Bloques[i].DiaNombre = b.DiaFormacion.Nombre
		}
	}
	return item, nil
}

func extensionFromRequest(v *int) int {
	if v != nil && *v >= 0 {
		return *v
	}
	return minutosExtensionDefaultRuntime()
}

func bloquesDTOToInput(bloques []dto.JornadaBloqueItem) ([]HorarioBloqueInput, error) {
	if len(bloques) == 0 {
		return nil, errors.New("la jornada debe tener al menos un bloque horario")
	}
	out := make([]HorarioBloqueInput, 0, len(bloques))
	for _, b := range bloques {
		if b.DiaFormacionID == 0 {
			return nil, errors.New("dia_formacion_id inválido en bloque")
		}
		out = append(out, HorarioBloqueInput{
			DiaFormacionID: b.DiaFormacionID,
			HoraInicio:     b.HoraInicio,
			HoraFin:        b.HoraFin,
			Orden:          b.Orden,
		})
	}
	return out, nil
}

func bloquesInputToModel(jornadaID uint, bloques []dto.JornadaBloqueItem) []models.JornadaBloque {
	out := make([]models.JornadaBloque, len(bloques))
	for i, b := range bloques {
		out[i] = models.JornadaBloque{
			JornadaID:      jornadaID,
			DiaFormacionID: b.DiaFormacionID,
			HoraInicio:     normalizeHoraMM(b.HoraInicio),
			HoraFin:        normalizeHoraMM(b.HoraFin),
			Orden:          b.Orden,
		}
	}
	return out
}

// JornadaCatalogItems para selects con bloques.
func (s *JornadaService) JornadaCatalogItems() ([]dto.JornadaItem, error) {
	admin, err := s.List()
	if err != nil {
		return nil, err
	}
	out := make([]dto.JornadaItem, len(admin))
	for i, a := range admin {
		out[i] = dto.JornadaItem{
			ID:                  a.ID,
			Nombre:              a.Nombre,
			MinutosExtensionFin: a.MinutosExtensionFin,
			Bloques:             a.Bloques,
		}
		if len(a.Bloques) > 0 {
			out[i].HoraInicio = a.Bloques[0].HoraInicio
			out[i].HoraFin = a.Bloques[0].HoraFin
		}
	}
	return out, nil
}
