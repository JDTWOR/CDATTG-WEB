package services

import "errors"

// EleccionScope alcance territorial para gestión electoral (coordinador).
type EleccionScope struct {
	Unrestricted bool
	RegionalIDs  []uint
	Empty        bool
}

type EleccionScopeService interface {
	Resolve(userID uint, roles []string) (*EleccionScope, error)
	CanAccessRegional(scope *EleccionScope, regionalID uint) bool
}

type eleccionScopeService struct {
	dashboardScope DashboardScopeService
}

func NewEleccionScopeService() EleccionScopeService {
	return &eleccionScopeService{dashboardScope: NewDashboardScopeService()}
}

func (s *eleccionScopeService) Resolve(userID uint, roles []string) (*EleccionScope, error) {
	ds, err := s.dashboardScope.Resolve(userID, roles)
	if err != nil {
		return nil, err
	}
	if ds == nil || !ds.Restricted {
		return &EleccionScope{Unrestricted: true}, nil
	}
	if ds.Empty {
		return &EleccionScope{Empty: true}, nil
	}
	return &EleccionScope{RegionalIDs: ds.RegionalIDs}, nil
}

func (s *eleccionScopeService) CanAccessRegional(scope *EleccionScope, regionalID uint) bool {
	if scope == nil || scope.Unrestricted {
		return true
	}
	if scope.Empty {
		return false
	}
	for _, id := range scope.RegionalIDs {
		if id == regionalID {
			return true
		}
	}
	return false
}

func assertEleccionScope(svc EleccionScopeService, scope *EleccionScope, regionalID uint) error {
	if svc.CanAccessRegional(scope, regionalID) {
		return nil
	}
	if scope != nil && scope.Empty {
		return errors.New("no tiene regionales asignadas para gestionar elecciones")
	}
	return errors.New("no autorizado para esta regional")
}
