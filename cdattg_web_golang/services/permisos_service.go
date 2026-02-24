package services

import (
	"errors"
	"strconv"

	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

type PermisosService interface {
	ListUsuarios(offset, limit int, search string) ([]dto.UsuarioListItem, int64, error)
	GetPermisosByUserID(userID uint) (*dto.UsuarioPermisosResponse, error)
	AsignarPermisoDirecto(userID uint, obj, act string) error
	QuitarPermisoDirecto(userID uint, obj, act string) error
	SetRoles(userID uint, roles []string) error
	ToggleEstado(userID uint) error
	Definiciones() dto.DefinicionesPermisosResponse
}

type permisosService struct {
	userRepo repositories.UserRepository
}

func NewPermisosService() PermisosService {
	return &permisosService{userRepo: repositories.NewUserRepository()}
}

func (s *permisosService) ListUsuarios(offset, limit int, search string) ([]dto.UsuarioListItem, int64, error) {
	list, total, err := s.userRepo.List(offset, limit, search)
	if err != nil {
		return nil, 0, err
	}
	db := database.GetDB()
	e, err := authz.GetEnforcer(db)
	if err != nil {
		return nil, 0, err
	}
	out := make([]dto.UsuarioListItem, 0, len(list))
	for _, u := range list {
		item := dto.UsuarioListItem{
			ID:     u.ID,
			Email:  u.Email,
			Status: u.Status,
		}
		if u.Persona != nil {
			item.FullName = u.Persona.GetFullName()
			item.Documento = u.Persona.NumeroDocumento
		}
		sub := strconv.FormatUint(uint64(u.ID), 10)
		item.Roles, _ = authz.GetRolesForUser(e, sub)
		out = append(out, item)
	}
	return out, total, nil
}

func (s *permisosService) GetPermisosByUserID(userID uint) (*dto.UsuarioPermisosResponse, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("usuario no encontrado")
	}
	db := database.GetDB()
	e, err := authz.GetEnforcer(db)
	if err != nil {
		return nil, err
	}
	sub := strconv.FormatUint(uint64(userID), 10)
	roles, _ := authz.GetRolesForUser(e, sub)
	permisos, _ := authz.GetAllPermissionsForUser(e, sub)
	directos := authz.GetDirectPermissionsForUser(e, sub)
	pairs := make([]dto.PermisoPair, 0, len(directos))
	for _, d := range directos {
		if len(d) >= 3 {
			pairs = append(pairs, dto.PermisoPair{Obj: d[1], Act: d[2]})
		}
	}
	resp := &dto.UsuarioPermisosResponse{
		UserID:   userID,
		Email:    user.Email,
		Status:   user.Status,
		Roles:    roles,
		Permisos: permisos,
		Directos: pairs,
	}
	if user.PersonaID != nil {
		var persona models.Persona
		if err := db.First(&persona, *user.PersonaID).Error; err == nil {
			resp.FullName = persona.GetFullName()
			resp.Documento = persona.NumeroDocumento
		}
	}
	return resp, nil
}

func (s *permisosService) AsignarPermisoDirecto(userID uint, obj, act string) error {
	if _, err := s.userRepo.FindByID(userID); err != nil {
		return errors.New("usuario no encontrado")
	}
	db := database.GetDB()
	e, err := authz.GetEnforcer(db)
	if err != nil {
		return err
	}
	sub := strconv.FormatUint(uint64(userID), 10)
	_, err = authz.AddPermissionForUser(e, sub, obj, act)
	if err != nil {
		return err
	}
	return e.SavePolicy()
}

func (s *permisosService) QuitarPermisoDirecto(userID uint, obj, act string) error {
	if _, err := s.userRepo.FindByID(userID); err != nil {
		return errors.New("usuario no encontrado")
	}
	db := database.GetDB()
	e, err := authz.GetEnforcer(db)
	if err != nil {
		return err
	}
	sub := strconv.FormatUint(uint64(userID), 10)
	_, err = authz.RemovePermissionForUser(e, sub, obj, act)
	if err != nil {
		return err
	}
	return e.SavePolicy()
}

func (s *permisosService) SetRoles(userID uint, roles []string) error {
	if _, err := s.userRepo.FindByID(userID); err != nil {
		return errors.New("usuario no encontrado")
	}
	db := database.GetDB()
	e, err := authz.GetEnforcer(db)
	if err != nil {
		return err
	}
	sub := strconv.FormatUint(uint64(userID), 10)
	_, _ = authz.DeleteRolesForUser(e, sub)
	for _, r := range roles {
		r = normRoleName(r)
		if r == "" {
			continue
		}
		_, _ = authz.AddRoleForUser(e, sub, r)
	}
	return e.SavePolicy()
}

func normRoleName(s string) string {
	// Mayúsculas para consistencia
	b := make([]byte, 0, len(s))
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c >= 'a' && c <= 'z' {
			c -= 32
		}
		b = append(b, c)
	}
	return string(b)
}

func (s *permisosService) ToggleEstado(userID uint) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("usuario no encontrado")
	}
	user.Status = !user.Status
	return s.userRepo.Update(user)
}

func (s *permisosService) Definiciones() dto.DefinicionesPermisosResponse {
	pairs := authz.AllPermissionPairs()
	perms := make([]dto.PermisoPair, len(pairs))
	for i := range pairs {
		perms[i] = dto.PermisoPair{Obj: pairs[i].Obj, Act: pairs[i].Act}
	}
	return dto.DefinicionesPermisosResponse{
		Roles:    authz.RoleNames,
		Permisos: perms,
	}
}

var _ PermisosService = (*permisosService)(nil)
