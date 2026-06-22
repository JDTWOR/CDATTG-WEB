package services

import (
	"errors"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"gorm.io/gorm"
)

// EleccionService orquesta el módulo electoral (procesos, planchas, votos y representantes).
type EleccionService interface {
	ListProcesos(userID uint, roles []string) ([]dto.EleccionProcesoResponse, error)
	GetProceso(userID uint, roles []string, id uint) (*dto.EleccionProcesoResponse, error)
	CreateProceso(userID uint, roles []string, req dto.EleccionProcesoRequest) (*dto.EleccionProcesoResponse, error)
	UpdateProceso(userID uint, roles []string, id uint, req dto.EleccionProcesoRequest) (*dto.EleccionProcesoResponse, error)
	CambiarEstadoProceso(userID uint, roles []string, id uint, estado string) (*dto.EleccionProcesoResponse, error)
	CerrarInscripcion(userID uint, roles []string, id uint) (*dto.EleccionProcesoResponse, error)
	AbrirVotacion(userID uint, roles []string, id uint) (*dto.EleccionProcesoResponse, error)
	CalcularResultado(userID uint, roles []string, id uint) (*dto.EleccionResultadoResponse, error)
	RegistrarDesempate(userID uint, roles []string, id uint, req dto.EleccionDesempateRequest) (*dto.EleccionResultadoResponse, error)

	ListPlanchas(userID uint, roles []string, procesoID uint, soloConfirmadas bool) ([]dto.EleccionPlanchaResponse, error)
	ProponerPlancha(userID uint, personaID *uint, procesoID uint, req dto.EleccionPlanchaRequest) (*dto.EleccionPlanchaResponse, error)
	ConfirmarPlancha(userID uint, personaID *uint, planchaID uint) (*dto.EleccionPlanchaResponse, error)
	RechazarPlancha(userID uint, roles []string, planchaID uint, req dto.EleccionRechazarPlanchaRequest) error
	RetirarPlancha(userID uint, personaID *uint, planchaID uint) error

	RegistrarVoto(userID uint, personaID *uint, procesoID uint, req dto.EleccionVotoRequest) (*dto.EleccionVotoResponse, error)
	GetResultados(userID uint, roles []string, procesoID uint, incluirVotos bool) (*dto.EleccionResultadoResponse, error)
	ExportResultadosCSV(userID uint, roles []string, procesoID uint) ([]byte, error)

	GetMiRegional(userID uint, personaID *uint) (*dto.EleccionMiRegionalResponse, error)
	ListPlanchasConfirmadasAprendiz(personaID *uint, procesoID uint) ([]dto.EleccionPlanchaResponse, error)
	GetRepresentantesVigentes(regionalID uint) (*dto.RepresentanteAprendizResponse, error)
	GetHistorialRepresentantes(userID uint, roles []string, regionalID uint) ([]dto.RepresentanteAprendizResponse, error)
}

type eleccionService struct {
	repo         repositories.EleccionRepository
	aprendizRepo repositories.AprendizRepository
	scopeSvc     EleccionScopeService
}

func NewEleccionService() EleccionService {
	return &eleccionService{
		repo:         repositories.NewEleccionRepository(),
		aprendizRepo: repositories.NewAprendizRepository(),
		scopeSvc:     NewEleccionScopeService(),
	}
}

func (s *eleccionService) resolveScope(userID uint, roles []string) (*EleccionScope, error) {
	return s.scopeSvc.Resolve(userID, roles)
}

func (s *eleccionService) loadProcesoScoped(userID uint, roles []string, id uint) (*models.EleccionProceso, *EleccionScope, error) {
	scope, err := s.resolveScope(userID, roles)
	if err != nil {
		return nil, nil, err
	}
	p, err := s.repo.FindProcesoByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, scope, errEleccionProcesoNoEncontrado
		}
		return nil, scope, err
	}
	if err := assertEleccionScope(s.scopeSvc, scope, p.RegionalID); err != nil {
		return nil, scope, err
	}
	return p, scope, nil
}
