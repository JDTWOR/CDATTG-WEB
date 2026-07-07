package services

import (
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/casbin/casbin/v3"
	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/sena/cdattg-web-golang/utils"
	"gorm.io/gorm"
)

const (
	rolVisitantePersona   = "VISITANTE"
	rolInstructorPersona  = "INSTRUCTOR"
	personaUserChunkSize  = 500
	personaUserBcryptCost = 6
)

// PersonaUserAccountService gestiona usuarios y roles Casbin vinculados a personas.
type PersonaUserAccountService interface {
	CreateForPersona(persona models.Persona) error
	EnsureForPersonas(personaIDs []uint) error
	SyncEmail(personaID uint, email string) error
	ResetPassword(personaID uint, numeroDocumento string) error
}

type personaUserAccountService struct {
	userRepo repositories.UserRepository
}

func NewPersonaUserAccountService(userRepo repositories.UserRepository) PersonaUserAccountService {
	return &personaUserAccountService{userRepo: userRepo}
}

func (s *personaUserAccountService) CreateForPersona(persona models.Persona) error {
	if existing, _ := s.userRepo.FindByPersonaID(persona.ID); existing != nil {
		return nil
	}

	email := resolveUniqueLoginEmail(s.userRepo, persona)
	password := defaultPasswordForPersona(persona)
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

	return assignDefaultRoleForPersona(user.ID, persona.ID)
}

func (s *personaUserAccountService) EnsureForPersonas(personaIDs []uint) error {
	if len(personaIDs) == 0 {
		return nil
	}

	db := database.GetDB()
	idsWithoutUser, err := personaIDsWithoutUser(db, personaIDs)
	if err != nil || len(idsWithoutUser) == 0 {
		return err
	}

	var personas []models.Persona
	if err := db.Where("id IN ?", idsWithoutUser).Find(&personas).Error; err != nil {
		return err
	}

	instructorPersonaIDs, err := instructorPersonaIDSet(db, idsWithoutUser)
	if err != nil {
		return err
	}

	e, err := authz.GetEnforcer(db)
	if err != nil {
		return err
	}

	existingEmails, err := usedEmailsForPersonas(db, personas)
	if err != nil {
		return err
	}

	if err := ensureUsersForPersonaChunks(db, e, personas, instructorPersonaIDs, existingEmails); err != nil {
		return err
	}
	return e.SavePolicy()
}

func ensureUsersForPersonaChunks(
	db *gorm.DB,
	e *casbin.Enforcer,
	personas []models.Persona,
	instructorPersonaIDs map[uint]bool,
	existingEmails map[string]bool,
) error {
	for i := 0; i < len(personas); i += personaUserChunkSize {
		end := min(i+personaUserChunkSize, len(personas))
		chunk := personas[i:end]
		if err := createUsersChunkWithRoles(db, e, chunk, instructorPersonaIDs, existingEmails); err != nil {
			return err
		}
	}
	return nil
}

func createUsersChunkWithRoles(
	db *gorm.DB,
	e *casbin.Enforcer,
	chunk []models.Persona,
	instructorPersonaIDs map[uint]bool,
	existingEmails map[string]bool,
) error {
	users, err := buildUsersForPersonaChunk(chunk, existingEmails, personaUserBcryptCost)
	if err != nil {
		return err
	}
	if err := db.Create(&users).Error; err != nil {
		return err
	}
	assignBatchRolesForPersonas(e, chunk, users, instructorPersonaIDs)
	return nil
}

func assignBatchRolesForPersonas(
	e *casbin.Enforcer,
	personas []models.Persona,
	users []models.User,
	instructorPersonaIDs map[uint]bool,
) {
	for j := range users {
		roleName := rolVisitantePersona
		if instructorPersonaIDs[personas[j].ID] {
			roleName = rolInstructorPersona
		}
		sub := strconv.FormatUint(uint64(users[j].ID), 10)
		_, _ = authz.AddRoleForUser(e, sub, roleName)
	}
}

func (s *personaUserAccountService) SyncEmail(personaID uint, email string) error {
	user, err := s.userRepo.FindByPersonaID(personaID)
	if err != nil || user == nil {
		return nil
	}
	email = strings.TrimSpace(email)
	if email == "" || user.Email == email {
		return nil
	}
	existing, err := s.userRepo.FindByEmail(email)
	if err == nil && existing != nil && existing.ID != user.ID {
		return errors.New("el email ya está registrado en otro usuario")
	}
	user.Email = email
	return s.userRepo.Update(user)
}

func (s *personaUserAccountService) ResetPassword(personaID uint, numeroDocumento string) error {
	if numeroDocumento == "" {
		return errors.New("la persona no tiene número de documento")
	}
	user, err := s.userRepo.FindByPersonaID(personaID)
	if err != nil || user == nil {
		return errors.New("esta persona no tiene usuario asociado para restablecer contraseña")
	}
	hash, err := utils.HashPassword(numeroDocumento)
	if err != nil {
		return fmt.Errorf("error al hashear contraseña: %w", err)
	}
	user.Password = hash
	return s.userRepo.Update(user)
}

func personaIDsWithoutUser(db *gorm.DB, personaIDs []uint) ([]uint, error) {
	var withUser []uint
	if err := db.Model(&models.User{}).Where("persona_id IN ?", personaIDs).Pluck("persona_id", &withUser).Error; err != nil {
		return nil, err
	}
	hasUser := make(map[uint]bool, len(withUser))
	for _, id := range withUser {
		hasUser[id] = true
	}
	var idsWithoutUser []uint
	for _, id := range personaIDs {
		if !hasUser[id] {
			idsWithoutUser = append(idsWithoutUser, id)
		}
	}
	return idsWithoutUser, nil
}

func instructorPersonaIDSet(db *gorm.DB, personaIDs []uint) (map[uint]bool, error) {
	var ids []uint
	if err := db.Model(&models.Instructor{}).Where("persona_id IN ?", personaIDs).Pluck("persona_id", &ids).Error; err != nil {
		return nil, err
	}
	out := make(map[uint]bool, len(ids))
	for _, id := range ids {
		out[id] = true
	}
	return out, nil
}

func usedEmailsForPersonas(db *gorm.DB, personas []models.Persona) (map[string]bool, error) {
	existingEmails := make(map[string]bool)
	var emails []string
	for _, p := range personas {
		if e := strings.TrimSpace(p.Email); e != "" {
			emails = append(emails, e)
		}
	}
	if len(emails) == 0 {
		return existingEmails, nil
	}
	var used []string
	if err := db.Model(&models.User{}).Where("email IN ?", emails).Pluck("email", &used).Error; err != nil {
		return nil, err
	}
	for _, u := range used {
		existingEmails[u] = true
	}
	return existingEmails, nil
}

func buildUsersForPersonaChunk(personas []models.Persona, existingEmails map[string]bool, bcryptCost int) ([]models.User, error) {
	users := make([]models.User, 0, len(personas))
	for _, p := range personas {
		email := resolveUniqueLoginEmailFromSet(p, existingEmails)
		password := defaultPasswordForPersona(p)
		hash, err := utils.HashPasswordWithCost(password, bcryptCost)
		if err != nil {
			return nil, err
		}
		pid := p.ID
		users = append(users, models.User{
			Email:     email,
			Password:  hash,
			Status:    true,
			PersonaID: &pid,
		})
	}
	return users, nil
}

func resolveUniqueLoginEmail(userRepo repositories.UserRepository, persona models.Persona) string {
	taken := make(map[string]bool)
	email := strings.TrimSpace(persona.Email)
	if email != "" && !userRepo.ExistsByEmail(email) {
		return email
	}
	if email != "" {
		taken[email] = true
	}
	return resolveUniqueLoginEmailFromSet(persona, taken)
}

func resolveUniqueLoginEmailFromSet(persona models.Persona, taken map[string]bool) string {
	email := strings.TrimSpace(persona.Email)
	if email != "" && !taken[email] {
		taken[email] = true
		return email
	}
	doc := strings.TrimSpace(persona.NumeroDocumento)
	if doc != "" {
		email = "doc_" + doc + "@sena.local"
	}
	if email == "" || taken[email] {
		email = fmt.Sprintf("persona_%d@sena.local", persona.ID)
	}
	taken[email] = true
	return email
}

func defaultPasswordForPersona(persona models.Persona) string {
	password := strings.TrimSpace(persona.NumeroDocumento)
	if password == "" {
		return fmt.Sprintf("Temp%d!", persona.ID)
	}
	return password
}

func assignDefaultRoleForPersona(userID, personaID uint) error {
	db := database.GetDB()
	roleName := rolVisitantePersona
	if isInstructorPersona(db, personaID) {
		roleName = rolInstructorPersona
	}
	e, err := authz.GetEnforcer(db)
	if err != nil {
		return err
	}
	sub := strconv.FormatUint(uint64(userID), 10)
	if _, err := authz.AddRoleForUser(e, sub, roleName); err != nil {
		_ = e.SavePolicy()
	}
	return e.SavePolicy()
}

func isInstructorPersona(db *gorm.DB, personaID uint) bool {
	var n int64
	db.Model(&models.Instructor{}).Where("persona_id = ?", personaID).Limit(1).Count(&n)
	return n > 0
}
