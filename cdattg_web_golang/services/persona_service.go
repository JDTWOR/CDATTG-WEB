package services

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/sena/cdattg-web-golang/utils"
	"gorm.io/gorm"
)

const rolVisitante = "VISITANTE"
const rolInstructor = "INSTRUCTOR"

type PersonaService interface {
	FindAll(page, pageSize int, search string) ([]dto.PersonaResponse, int64, error)
	FindByID(id uint) (*dto.PersonaResponse, error)
	FindByNumeroDocumento(numeroDocumento string) (*dto.PersonaResponse, error)
	Create(req dto.PersonaRequest) (*dto.PersonaResponse, error)
	CreateWithoutUser(req dto.PersonaRequest) (*dto.PersonaResponse, error)
	EnsureUsersForPersonas(personaIDs []uint) error
	Update(id uint, req dto.PersonaRequest) (*dto.PersonaResponse, error)
	Delete(id uint) error
	ResetPassword(personaID uint) error
}

type personaService struct {
	personaRepo repositories.PersonaRepository
	userRepo    repositories.UserRepository
}

func NewPersonaService() PersonaService {
	return &personaService{
		personaRepo: repositories.NewPersonaRepository(),
		userRepo:    repositories.NewUserRepository(),
	}
}

func (s *personaService) FindAll(page, pageSize int, search string) ([]dto.PersonaResponse, int64, error) {
	personas, total, err := s.personaRepo.FindAll(page, pageSize, search)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]dto.PersonaResponse, len(personas))
	for i, persona := range personas {
		responses[i] = s.toResponse(persona)
	}

	return responses, total, nil
}

func (s *personaService) FindByID(id uint) (*dto.PersonaResponse, error) {
	persona, err := s.personaRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("persona no encontrada")
	}

	response := s.toResponse(*persona)
	return &response, nil
}

func (s *personaService) FindByNumeroDocumento(numeroDocumento string) (*dto.PersonaResponse, error) {
	persona, err := s.personaRepo.FindByNumeroDocumento(numeroDocumento)
	if err != nil {
		return nil, errors.New("persona no encontrada")
	}

	response := s.toResponse(*persona)
	return &response, nil
}

func (s *personaService) Create(req dto.PersonaRequest) (*dto.PersonaResponse, error) {
	// Validaciones
	if s.personaRepo.ExistsByNumeroDocumento(req.NumeroDocumento) {
		return nil, errors.New("el número de documento ya está registrado")
	}

	if req.Email != "" && s.personaRepo.ExistsByEmail(req.Email) {
		return nil, errors.New("el email ya está registrado")
	}

	if req.Celular != "" && s.personaRepo.ExistsByCelular(req.Celular) {
		return nil, errors.New("el celular ya está registrado")
	}

	persona := s.toModel(req)
	// Asegurar que el ID sea 0 para que PostgreSQL genere uno nuevo
	persona.ID = 0
	status := true
	if req.Status != nil {
		status = *req.Status
	}
	persona.Status = status

	if err := s.personaRepo.Create(&persona); err != nil {
		return nil, fmt.Errorf("error al crear persona: %w", err)
	}

	// Crear usuario para que la persona pueda iniciar sesión con correo, celular o número de documento (rol VISITANTE por defecto)
	if err := s.crearUsuarioParaPersona(persona); err != nil {
		// No fallar la creación de persona; solo log o ignorar
		_ = err
	}

	response := s.toResponse(persona)
	return &response, nil
}

// CreateWithoutUser crea la persona sin crear usuario. Usado en importación masiva; luego se llama EnsureUsersForPersonas en lote.
func (s *personaService) CreateWithoutUser(req dto.PersonaRequest) (*dto.PersonaResponse, error) {
	if s.personaRepo.ExistsByNumeroDocumento(req.NumeroDocumento) {
		return nil, errors.New("el número de documento ya está registrado")
	}
	if req.Email != "" && s.personaRepo.ExistsByEmail(req.Email) {
		return nil, errors.New("el email ya está registrado")
	}
	if req.Celular != "" && s.personaRepo.ExistsByCelular(req.Celular) {
		return nil, errors.New("el celular ya está registrado")
	}
	persona := s.toModel(req)
	persona.ID = 0
	status := true
	if req.Status != nil {
		status = *req.Status
	}
	persona.Status = status
	if err := s.personaRepo.Create(&persona); err != nil {
		return nil, fmt.Errorf("error al crear persona: %w", err)
	}
	response := s.toResponse(persona)
	return &response, nil
}

// EnsureUsersForPersonas crea usuarios (con rol VISITANTE) para las personas que aún no tienen, en lote. Pensado para usarse tras una importación.
func (s *personaService) EnsureUsersForPersonas(personaIDs []uint) error {
	if len(personaIDs) == 0 {
		return nil
	}
	db := database.GetDB()
	var withUser []uint
	db.Model(&models.User{}).Where("persona_id IN ?", personaIDs).Pluck("persona_id", &withUser)
	hasUser := make(map[uint]bool)
	for _, id := range withUser {
		hasUser[id] = true
	}
	var idsWithoutUser []uint
	for _, id := range personaIDs {
		if !hasUser[id] {
			idsWithoutUser = append(idsWithoutUser, id)
		}
	}
	if len(idsWithoutUser) == 0 {
		return nil
	}
	var personas []models.Persona
	if err := db.Where("id IN ?", idsWithoutUser).Find(&personas).Error; err != nil {
		return err
	}
	var instructorPersonaIDs map[uint]bool
	{
		var ids []uint
		db.Model(&models.Instructor{}).Where("persona_id IN ?", idsWithoutUser).Pluck("persona_id", &ids)
		instructorPersonaIDs = make(map[uint]bool)
		for _, id := range ids {
			instructorPersonaIDs[id] = true
		}
	}
	e, err := authz.GetEnforcer(db)
	if err != nil {
		return err
	}
	// Emails ya usados (para no colisionar)
	existingEmails := make(map[string]bool)
	{
		var emails []string
		for _, p := range personas {
			if e := strings.TrimSpace(p.Email); e != "" {
				emails = append(emails, e)
			}
		}
		if len(emails) > 0 {
			var used []string
			db.Model(&models.User{}).Where("email IN ?", emails).Pluck("email", &used)
			for _, u := range used {
				existingEmails[u] = true
			}
		}
	}
	const chunkSize = 500
	const bcryptCostImport = 6
	for i := 0; i < len(personas); i += chunkSize {
		end := i + chunkSize
		if end > len(personas) {
			end = len(personas)
		}
		chunk := personas[i:end]
		users := make([]models.User, 0, len(chunk))
		for _, p := range chunk {
			email := strings.TrimSpace(p.Email)
			if email == "" || existingEmails[email] {
				doc := strings.TrimSpace(p.NumeroDocumento)
				if doc != "" {
					email = "doc_" + doc + "@sena.local"
				}
				if email == "" || existingEmails[email] {
					email = fmt.Sprintf("persona_%d@sena.local", p.ID)
				}
			}
			existingEmails[email] = true
			password := strings.TrimSpace(p.NumeroDocumento)
			if password == "" {
				password = fmt.Sprintf("Temp%d!", p.ID)
			}
			hash, err := utils.HashPasswordWithCost(password, bcryptCostImport)
			if err != nil {
				return err
			}
			pid := p.ID
			users = append(users, models.User{
				Email:     email,
				Password:  hash,
				Status:    true,
				PersonaID: &pid,
			})
		}
		if err := db.Create(&users).Error; err != nil {
			return err
		}
		for j := range users {
			p := chunk[j]
			roleName := rolVisitante
			if instructorPersonaIDs[p.ID] {
				roleName = rolInstructor
			}
			sub := strconv.FormatUint(uint64(users[j].ID), 10)
			_, _ = authz.AddRoleForUser(e, sub, roleName)
		}
	}
	_ = e.SavePolicy()
	return nil
}

// crearUsuarioParaPersona crea un usuario con rol VISITANTE para la persona, si aún no tiene.
// Permite iniciar sesión con correo, celular o número de documento. Email: se usa el de la persona si existe y es único; si no, se genera uno único (doc_XXX@sena.local o persona_ID@sena.local).
func (s *personaService) crearUsuarioParaPersona(persona models.Persona) error {
	// Si ya tiene usuario, no crear otro
	if existing, _ := s.userRepo.FindByPersonaID(persona.ID); existing != nil {
		return nil
	}

	email := strings.TrimSpace(persona.Email)
	if email != "" && !s.userRepo.ExistsByEmail(email) {
		// Usar correo de la persona
	} else {
		// Generar email único para que el usuario pueda al menos iniciar sesión por documento o celular
		doc := strings.TrimSpace(persona.NumeroDocumento)
		if doc != "" {
			email = "doc_" + doc + "@sena.local"
		}
		if email == "" || s.userRepo.ExistsByEmail(email) {
			email = fmt.Sprintf("persona_%d@sena.local", persona.ID)
		}
	}

	password := strings.TrimSpace(persona.NumeroDocumento)
	if password == "" {
		password = fmt.Sprintf("Temp%d!", persona.ID)
	}
	hash, err := utils.HashPassword(password)
	if err != nil {
		return err
	}

	personaID := persona.ID
	user := models.User{
		Email:     email,
		Password:  hash,
		Status:    true,
		PersonaID: &personaID,
	}
	if err := s.userRepo.Create(&user); err != nil {
		return err
	}

	db := database.GetDB()
	roleName := rolVisitante
	if isInstructor(db, persona.ID) {
		roleName = rolInstructor
	}
	e, err := authz.GetEnforcer(db)
	if err != nil {
		return err
	}
	sub := strconv.FormatUint(uint64(user.ID), 10)
	if _, err := authz.AddRoleForUser(e, sub, roleName); err != nil {
		_ = e.SavePolicy()
	}
	_ = e.SavePolicy()
	return nil
}

func isInstructor(db *gorm.DB, personaID uint) bool {
	var n int64
	db.Model(&models.Instructor{}).Where("persona_id = ?", personaID).Limit(1).Count(&n)
	return n > 0
}

func (s *personaService) Update(id uint, req dto.PersonaRequest) (*dto.PersonaResponse, error) {
	persona, err := s.personaRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("persona no encontrada")
	}

	// Validaciones
	if existing, _ := s.personaRepo.FindByNumeroDocumento(req.NumeroDocumento); existing != nil && existing.ID != id {
		return nil, errors.New("el número de documento ya está registrado")
	}

	if req.Email != "" {
		if existing, _ := s.personaRepo.FindByEmailExcludingID(req.Email, id); existing != nil {
			return nil, errors.New("el email ya está registrado")
		}
	}

	if req.Celular != "" {
		if existing, _ := s.personaRepo.FindByCelularExcludingID(req.Celular, id); existing != nil {
			return nil, errors.New("el celular ya está registrado")
		}
	}

	// Actualizar campos
	s.updateModel(persona, req)
	if req.Status != nil {
		persona.Status = *req.Status
	}

	if err := s.personaRepo.Update(persona); err != nil {
		return nil, fmt.Errorf("error al actualizar persona: %w", err)
	}

	response := s.toResponse(*persona)
	return &response, nil
}

func (s *personaService) Delete(id uint) error {
	return s.personaRepo.Delete(id)
}

// ResetPassword restablece la contraseña del usuario asociado a la persona al número de documento.
func (s *personaService) ResetPassword(personaID uint) error {
	persona, err := s.personaRepo.FindByID(personaID)
	if err != nil {
		return errors.New("persona no encontrada")
	}
	user, err := s.userRepo.FindByPersonaID(personaID)
	if err != nil || user == nil {
		return errors.New("esta persona no tiene usuario asociado para restablecer contraseña")
	}
	if persona.NumeroDocumento == "" {
		return errors.New("la persona no tiene número de documento")
	}
	hash, err := utils.HashPassword(persona.NumeroDocumento)
	if err != nil {
		return fmt.Errorf("error al hashear contraseña: %w", err)
	}
	user.Password = hash
	return s.userRepo.Update(user)
}

func (s *personaService) toResponse(persona models.Persona) dto.PersonaResponse {
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

func (s *personaService) toModel(req dto.PersonaRequest) models.Persona {
	return models.Persona{
		TipoDocumentoID:        req.TipoDocumento,
		NumeroDocumento:        req.NumeroDocumento,
		PrimerNombre:           req.PrimerNombre,
		SegundoNombre:          req.SegundoNombre,
		PrimerApellido:         req.PrimerApellido,
		SegundoApellido:        req.SegundoApellido,
		FechaNacimiento:        nilToTime(req.FechaNacimiento),
		GeneroID:               req.Genero,
		Telefono:               req.Telefono,
		Celular:                req.Celular,
		Email:                  req.Email,
		PaisID:                 req.PaisID,
		DepartamentoID:         req.DepartamentoID,
		MunicipioID:            req.MunicipioID,
		Direccion:              req.Direccion,
		PersonaCaracterizacionID: req.ParametroID,
		NivelEscolaridadID:     req.NivelEscolaridadID,
	}
}

func (s *personaService) updateModel(persona *models.Persona, req dto.PersonaRequest) {
	persona.TipoDocumentoID = req.TipoDocumento
	persona.NumeroDocumento = req.NumeroDocumento
	persona.PrimerNombre = req.PrimerNombre
	persona.SegundoNombre = req.SegundoNombre
	persona.PrimerApellido = req.PrimerApellido
	persona.SegundoApellido = req.SegundoApellido
	persona.FechaNacimiento = nilToTime(req.FechaNacimiento)
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

func nilToTime(f *dto.FlexDate) *time.Time {
	if f == nil {
		return nil
	}
	return f.ToTime()
}
