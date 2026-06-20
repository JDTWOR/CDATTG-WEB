package services

import (
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

// DashboardScope define el alcance de datos del panel según rol del usuario.
type DashboardScope struct {
	Restricted    bool
	Empty         bool
	RegionalIDs   []uint
	RegionalNames []string
	SedeIDs       []uint
}

// DashboardScopeService resuelve alcance territorial del dashboard.
type DashboardScopeService interface {
	Resolve(userID uint, roles []string) (*DashboardScope, error)
	ResolveEffectiveSedes(scope *DashboardScope, queryRegionalID, querySedeID *uint) ([]uint, bool)
}

type dashboardScopeService struct {
	usuarioRegionalRepo repositories.UsuarioRegionalRepository
	catalogoRepo        repositories.CatalogoRepository
}

func NewDashboardScopeService() DashboardScopeService {
	return &dashboardScopeService{
		usuarioRegionalRepo: repositories.NewUsuarioRegionalRepository(),
		catalogoRepo:        repositories.NewCatalogoRepository(),
	}
}

func hasRole(roles []string, name string) bool {
	for _, r := range roles {
		if r == name {
			return true
		}
	}
	return false
}

func (s *dashboardScopeService) Resolve(userID uint, roles []string) (*DashboardScope, error) {
	if hasRole(roles, "SUPER ADMINISTRADOR") || hasRole(roles, "ADMINISTRADOR") || hasRole(roles, "BIENESTAR AL APRENDIZ") {
		return &DashboardScope{Restricted: false}, nil
	}
	if !hasRole(roles, "COORDINADOR") {
		return &DashboardScope{Restricted: false}, nil
	}
	regionales, err := s.usuarioRegionalRepo.FindRegionalesByUserID(userID)
	if err != nil {
		return nil, err
	}
	if len(regionales) == 0 {
		return &DashboardScope{Restricted: true, Empty: true}, nil
	}
	scope := &DashboardScope{
		Restricted:    true,
		RegionalIDs:   make([]uint, len(regionales)),
		RegionalNames: make([]string, len(regionales)),
	}
	for i := range regionales {
		scope.RegionalIDs[i] = regionales[i].ID
		scope.RegionalNames[i] = regionales[i].Nombre
	}
	sedes, err := s.catalogoRepo.FindSedes()
	if err != nil {
		return nil, err
	}
	regionalSet := make(map[uint]struct{}, len(scope.RegionalIDs))
	for _, rid := range scope.RegionalIDs {
		regionalSet[rid] = struct{}{}
	}
	for i := range sedes {
		if sedes[i].RegionalID == nil {
			continue
		}
		if _, ok := regionalSet[*sedes[i].RegionalID]; ok {
			scope.SedeIDs = append(scope.SedeIDs, sedes[i].ID)
		}
	}
	return scope, nil
}

// ResolveEffectiveSedes combina alcance del coordinador con filtros de query (solo admin/superadmin).
// Retorna sedeIDs efectivos y restrictedEmpty si el coordinador no tiene regional asignada.
func (s *dashboardScopeService) ResolveEffectiveSedes(scope *DashboardScope, queryRegionalID, querySedeID *uint) ([]uint, bool) {
	if scope != nil && scope.Empty {
		return nil, true
	}
	if scope != nil && scope.Restricted {
		return s.effectiveSedesRestricted(scope, querySedeID)
	}
	return s.effectiveSedesUnrestricted(queryRegionalID, querySedeID)
}

func (s *dashboardScopeService) effectiveSedesRestricted(scope *DashboardScope, querySedeID *uint) ([]uint, bool) {
	if querySedeID == nil || *querySedeID == 0 {
		return scope.SedeIDs, false
	}
	for _, id := range scope.SedeIDs {
		if id == *querySedeID {
			return []uint{id}, false
		}
	}
	return nil, false
}

func (s *dashboardScopeService) effectiveSedesUnrestricted(queryRegionalID, querySedeID *uint) ([]uint, bool) {
	if querySedeID != nil && *querySedeID > 0 {
		return []uint{*querySedeID}, false
	}
	if queryRegionalID == nil || *queryRegionalID == 0 {
		return nil, false
	}
	sedes, err := s.catalogoRepo.FindSedes()
	if err != nil {
		return nil, false
	}
	var ids []uint
	for i := range sedes {
		if sedes[i].RegionalID != nil && *sedes[i].RegionalID == *queryRegionalID {
			ids = append(ids, sedes[i].ID)
		}
	}
	return ids, false
}

// fichaEnSedes indica si la ficha pertenece a alguna sede del filtro.
func fichaEnSedes(fichaSedeID *uint, sedeIDs []uint) bool {
	if len(sedeIDs) == 0 {
		return true
	}
	if fichaSedeID == nil {
		return false
	}
	for _, id := range sedeIDs {
		if id == *fichaSedeID {
			return true
		}
	}
	return false
}

// filtrarFichasPorSedes filtra fichas por sede_ids efectivos.
func filtrarFichasPorSedes(fichas []models.FichaCaracterizacion, sedeIDs []uint) []models.FichaCaracterizacion {
	if len(sedeIDs) == 0 {
		return fichas
	}
	out := make([]models.FichaCaracterizacion, 0, len(fichas))
	for i := range fichas {
		if fichaEnSedes(fichas[i].SedeID, sedeIDs) {
			out = append(out, fichas[i])
		}
	}
	return out
}
