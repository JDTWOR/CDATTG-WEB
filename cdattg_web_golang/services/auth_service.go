package services

import (
	"errors"
	"strconv"
	"strings"
	"unicode"

	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/sena/cdattg-web-golang/utils"
)

const errMsgUsuarioNoEncontradoLogin = "Usuario no encontrado"

type AuthService interface {
	Login(req dto.LoginRequest) (*dto.LoginResponse, error)
	GetCurrentUser(userID uint) (*dto.UserResponse, error)
	ChangePassword(userID uint, req dto.ChangePasswordRequest) error
}

type authService struct {
	userRepo    repositories.UserRepository
	personaRepo repositories.PersonaRepository
}

func NewAuthService() AuthService {
	return &authService{
		userRepo:    repositories.NewUserRepository(),
		personaRepo: repositories.NewPersonaRepository(),
	}
}

// normalizeLogin deja solo dígitos para documento/celular (quita espacios, guiones, puntos)
func normalizeLogin(s string) string {
	var b strings.Builder
	for _, r := range strings.TrimSpace(s) {
		if unicode.IsDigit(r) {
			b.WriteRune(r)
		}
	}
	return b.String()
}

// resolveUserFromLogin obtiene el usuario por correo, número de documento o celular
func (s *authService) resolveUserFromLogin(login string) (*models.User, error) {
	login = strings.TrimSpace(login)
	if login == "" {
		return nil, errors.New(errMsgUsuarioNoEncontradoLogin)
	}
	if strings.Contains(login, "@") {
		return s.userByEmailForLogin(login)
	}
	normalized := normalizeLogin(login)
	if normalized == "" {
		return nil, errors.New(errMsgUsuarioNoEncontradoLogin)
	}
	if u := s.tryUserByDocumentoOCelular(normalized, login); u != nil {
		return u, nil
	}
	return nil, errors.New(errMsgUsuarioNoEncontradoLogin)
}

func (s *authService) userByEmailForLogin(login string) (*models.User, error) {
	user, err := s.userRepo.FindActiveByEmail(login)
	if err != nil || user == nil {
		return nil, errors.New(errMsgUsuarioNoEncontradoLogin)
	}
	return user, nil
}

func (s *authService) userFromPersonaActiva(persona *models.Persona, err error) *models.User {
	if err != nil || persona == nil {
		return nil
	}
	user, errU := s.userRepo.FindByPersonaID(persona.ID)
	if errU != nil || user == nil || !user.Status {
		return nil
	}
	return user
}

func (s *authService) tryUserByDocumentoOCelular(normalized, login string) *models.User {
	candidates := []string{normalized, login}
	for _, doc := range candidates {
		if doc == "" {
			continue
		}
		persona, err := s.personaRepo.FindByNumeroDocumento(doc)
		if u := s.userFromPersonaActiva(persona, err); u != nil {
			return u
		}
	}
	for _, cel := range candidates {
		if cel == "" {
			continue
		}
		persona, err := s.personaRepo.FindByCelular(cel)
		if u := s.userFromPersonaActiva(persona, err); u != nil {
			return u
		}
	}
	return nil
}

func (s *authService) Login(req dto.LoginRequest) (*dto.LoginResponse, error) {
	// req.Email puede ser correo, documento o celular
	user, err := s.resolveUserFromLogin(req.Email)
	if err != nil {
		return nil, err
	}

	if !utils.CheckPasswordHash(req.Password, user.Password) {
		return nil, errors.New("Contraseña incorrecta")
	}

	token, err := utils.GenerateToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	db := database.GetDB()
	sub := strconv.FormatUint(uint64(user.ID), 10)
	var roles []string
	var permissions []string
	if e, err := authz.GetEnforcer(db); err == nil {
		roles, _ = authz.GetRolesForUser(e, sub)
		permissions, _ = authz.GetAllPermissionsForUser(e, sub)
	}

	fullName := ""
	if user.PersonaID != nil {
		// Cargar persona si existe
		var persona models.Persona
		if err := database.GetDB().First(&persona, *user.PersonaID).Error; err == nil {
			fullName = persona.GetFullName()
		}
	}

	return &dto.LoginResponse{
		Token: token,
		Type:  "Bearer",
		User: dto.UserResponse{
			ID:        user.ID,
			Email:     user.Email,
			FullName:  fullName,
			Status:    user.Status,
			PersonaID: user.PersonaID,
		},
		Roles:       roles,
		Permissions: permissions,
	}, nil
}

func (s *authService) GetCurrentUser(userID uint) (*dto.UserResponse, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("usuario no encontrado")
	}

	fullName := ""
	if user.PersonaID != nil {
		var persona models.Persona
		if err := database.GetDB().First(&persona, *user.PersonaID).Error; err == nil {
			fullName = persona.GetFullName()
		}
	}

	return &dto.UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		FullName:  fullName,
		Status:    user.Status,
		PersonaID: user.PersonaID,
	}, nil
}

func (s *authService) ChangePassword(userID uint, req dto.ChangePasswordRequest) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("usuario no encontrado")
	}
	if !utils.CheckPasswordHash(req.PasswordActual, user.Password) {
		return errors.New("contraseña actual incorrecta")
	}
	hash, err := utils.HashPassword(req.PasswordNueva)
	if err != nil {
		return errors.New("error al generar la nueva contraseña")
	}
	user.Password = hash
	return s.userRepo.Update(user)
}
