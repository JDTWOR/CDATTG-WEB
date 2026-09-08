package services

import (
	"encoding/json"
	"fmt"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

type PersonaCambioPendienteService interface {
	CrearCambioPendiente(personaID uint, req dto.PersonaSelfUpdateRequest, fotoPath string) (*models.PersonaCambioPendiente, error)
	ListarPendientes() ([]models.PersonaCambioPendiente, error)
	LeerFoto(id uint) (*PersonaFotoArchivo, error)
	Aprobar(id uint, validadorID uint) error
	Rechazar(id uint, validadorID uint, motivo string) error
	TieneCambioPendiente(personaID uint) bool
}

type personaCambioPendienteService struct {
	repo       repositories.PersonaCambioPendienteRepository
	personaRepo repositories.PersonaRepository
}

func NewPersonaCambioPendienteService() PersonaCambioPendienteService {
	return &personaCambioPendienteService{
		repo:       repositories.NewPersonaCambioPendienteRepository(),
		personaRepo: repositories.NewPersonaRepository(),
	}
}

// CrearCambioPendiente guarda solo los campos que requieren aprobación del vigilante:
// nombres, apellidos, RH y (opcionalmente) la foto. Compara contra la persona
// actual para no pedir confirmación de valores que no cambiaron.
func (s *personaCambioPendienteService) CrearCambioPendiente(personaID uint, req dto.PersonaSelfUpdateRequest, fotoPath string) (*models.PersonaCambioPendiente, error) {
	persona, err := s.personaRepo.FindByID(personaID)
	if err != nil {
		return nil, errPersonaNoEncontrada
	}

	campos := make(map[string]interface{})

	if req.PrimerNombre != "" && req.PrimerNombre != persona.PrimerNombre {
		campos["primer_nombre"] = req.PrimerNombre
	}
	if req.SegundoNombre != "" && req.SegundoNombre != persona.SegundoNombre {
		campos["segundo_nombre"] = req.SegundoNombre
	}
	if req.PrimerApellido != "" && req.PrimerApellido != persona.PrimerApellido {
		campos["primer_apellido"] = req.PrimerApellido
	}
	if req.SegundoApellido != "" && req.SegundoApellido != persona.SegundoApellido {
		campos["segundo_apellido"] = req.SegundoApellido
	}
	if req.Rh != "" && req.Rh != persona.Rh {
		campos["rh"] = req.Rh
	}

	if len(campos) == 0 && fotoPath == "" {
		return nil, fmt.Errorf("no hay cambios para registrar")
	}

	camposJSON, err := json.Marshal(campos)
	if err != nil {
		return nil, fmt.Errorf("error al serializar campos: %w", err)
	}

	cambio := &models.PersonaCambioPendiente{
		PersonaID: personaID,
		Campos:    string(camposJSON),
		Estado:    "pendiente",
		FotoPath:  fotoPath,
	}

	if err := s.repo.Create(cambio); err != nil {
		return nil, fmt.Errorf("error al crear cambio pendiente: %w", err)
	}

	return cambio, nil
}

func (s *personaCambioPendienteService) ListarPendientes() ([]models.PersonaCambioPendiente, error) {
	return s.repo.ListarPendientes()
}

// LeerFoto devuelve la foto propuesta en un cambio pendiente para que el
// vigilante la compare con la vigente antes de decidir.
func (s *personaCambioPendienteService) LeerFoto(id uint) (*PersonaFotoArchivo, error) {
	cambio, err := s.repo.FindByID(id)
	if err != nil {
		return nil, fmt.Errorf("cambio pendiente no encontrado")
	}
	if cambio.FotoPath == "" {
		return nil, errPersonaFotoAusente
	}
	return leerFotoPersona(cambio.FotoPath)
}

func (s *personaCambioPendienteService) Aprobar(id uint, validadorID uint) error {
	cambio, err := s.repo.FindByID(id)
	if err != nil {
		return fmt.Errorf("cambio pendiente no encontrado")
	}

	var campos map[string]interface{}
	if err := json.Unmarshal([]byte(cambio.Campos), &campos); err != nil {
		return fmt.Errorf("error al deserialize campos: %w", err)
	}

	persona, err := s.personaRepo.FindByID(cambio.PersonaID)
	if err != nil {
		return fmt.Errorf("persona no encontrada")
	}

	for key, value := range campos {
		switch key {
		case "tipo_documento":
			if v, ok := value.(float64); ok {
				uid := uint(v)
				persona.TipoDocumentoID = &uid
			}
		case "primer_nombre":
			persona.PrimerNombre = value.(string)
		case "segundo_nombre":
			persona.SegundoNombre = value.(string)
		case "primer_apellido":
			persona.PrimerApellido = value.(string)
		case "segundo_apellido":
			persona.SegundoApellido = value.(string)
		case "telefono":
			persona.Telefono = value.(string)
		case "celular":
			persona.Celular = value.(string)
		case "email":
			persona.Email = value.(string)
		case "rh":
			persona.Rh = value.(string)
		}
	}

	if cambio.FotoPath != "" {
		persona.FotoPath = cambio.FotoPath
	}

	if err := s.personaRepo.Update(persona); err != nil {
		return fmt.Errorf("error al actualizar persona: %w", err)
	}

	return s.repo.Aprobar(id, validadorID)
}

func (s *personaCambioPendienteService) Rechazar(id uint, validadorID uint, motivo string) error {
	return s.repo.Rechazar(id, validadorID, motivo)
}

func (s *personaCambioPendienteService) TieneCambioPendiente(personaID uint) bool {
	_, err := s.repo.FindByPersonaID(personaID)
	return err == nil
}
