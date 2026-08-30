/**
 * services: validación del formulario de registro público.
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"errors"
	"strings"
	"time"
	"unicode"

	"github.com/sena/cdattg-web-golang/dto"
)

const registroEdadMinima = 14

// ValidarRegisterRequest reglas de negocio (edad, contraseña, documento).
func ValidarRegisterRequest(req dto.RegisterRequest) error {
	if req.Password != req.PasswordConfirm {
		return errors.New("las contraseñas no coinciden")
	}
	if !passwordTieneLetraYNumero(req.Password) {
		return errors.New("la contraseña debe incluir letras y números")
	}
	nac, err := time.Parse("2006-01-02", strings.TrimSpace(req.FechaNacimiento))
	if err != nil {
		return errors.New("fecha de nacimiento inválida")
	}
	limite := time.Now().AddDate(-registroEdadMinima, 0, 0)
	if nac.After(limite) {
		return errors.New("debe tener al menos 14 años para registrarse")
	}
	doc := strings.TrimSpace(req.NumeroDocumento)
	if doc == "" {
		return errors.New("el número de documento es obligatorio")
	}
	return nil
}

func passwordTieneLetraYNumero(p string) bool {
	var letra, numero bool
	for _, r := range p {
		if unicode.IsLetter(r) {
			letra = true
		}
		if unicode.IsDigit(r) {
			numero = true
		}
	}
	return letra && numero
}

func upperOpcional(v string) string {
	t := strings.TrimSpace(v)
	if t == "" {
		return ""
	}
	return strings.ToUpper(t)
}
