/**
 * services: alta pública de persona + usuario VISITANTE.
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"errors"
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

// RegisterService crea cuenta desde el formulario público.
type RegisterService struct {
	personas repositories.PersonaRepository
	users    repositories.UserRepository
}

// NewRegisterService constructor.
func NewRegisterService() *RegisterService {
	return &RegisterService{
		personas: repositories.NewPersonaRepository(),
		users:    repositories.NewUserRepository(),
	}
}

// Registrar persiste persona y usuario; error si documento o correo ya existen.
func (s *RegisterService) Registrar(req dto.RegisterRequest) error {
	if err := ValidarRegisterRequest(req); err != nil {
		return err
	}
	email := strings.ToLower(strings.TrimSpace(req.Email))
	doc := strings.TrimSpace(req.NumeroDocumento)
	if s.personas.ExistsByNumeroDocumento(doc) || s.personas.ExistsByEmail(email) || s.users.ExistsByEmail(email) {
		return errors.New("ya existe una persona registrada con este documento o correo. Inicie sesión")
	}
	persona := armarPersonaRegistro(req, email, doc)
	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		return err
	}
	return database.GetDB().Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&persona).Error; err != nil {
			return err
		}
		user := models.User{Email: email, Password: hash, Status: true, PersonaID: &persona.ID}
		if err := tx.Create(&user).Error; err != nil {
			return err
		}
		return asignarRolVisitante(user.ID)
	})
}

func armarPersonaRegistro(req dto.RegisterRequest, email, doc string) models.Persona {
	nac, _ := time.Parse("2006-01-02", strings.TrimSpace(req.FechaNacimiento))
	tipo, gen, pais := req.TipoDocumento, req.Genero, req.PaisID
	depto, mun, param := req.DepartamentoID, req.MunicipioID, req.ParametroID
	return models.Persona{
		TipoDocumentoID: &tipo, NumeroDocumento: doc,
		PrimerNombre: upperOpcional(req.PrimerNombre), SegundoNombre: upperOpcional(req.SegundoNombre),
		PrimerApellido: upperOpcional(req.PrimerApellido), SegundoApellido: upperOpcional(req.SegundoApellido),
		FechaNacimiento: &nac, GeneroID: &gen, Telefono: strings.TrimSpace(req.Telefono),
		Celular: strings.TrimSpace(req.Celular), Email: email, PaisID: &pais,
		DepartamentoID: &depto, MunicipioID: &mun, Direccion: strings.TrimSpace(req.Direccion),
		Status: true, PersonaCaracterizacionID: &param,
	}
}

func asignarRolVisitante(userID uint) error {
	e, err := authz.GetEnforcer(database.GetDB())
	if err != nil {
		return err
	}
	sub := strconv.FormatUint(uint64(userID), 10)
	if _, err := authz.AddRoleForUser(e, sub, rolVisitantePersona); err != nil {
		return err
	}
	return e.SavePolicy()
}
