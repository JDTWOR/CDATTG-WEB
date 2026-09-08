/**
 * Valido el tipo de sangre (RH) de una persona.
 * Lo hice para que el perfil y el carnet solo acepten los grupos reales.
 * Lo uso en el alta y en la edición de persona.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"errors"
	"strings"
)

var errPersonaRHInvalido = errors.New("el tipo de sangre no es válido")

var tiposRHPermitidos = map[string]struct{}{
	"O+": {}, "O-": {}, "A+": {}, "A-": {},
	"B+": {}, "B-": {}, "AB+": {}, "AB-": {},
}

// validarPersonaRH acepta vacío o un grupo de la lista. Lo pongo vacío porque
// a veces falta el primer día.
func validarPersonaRH(rh string) error {
	valor := strings.ToUpper(strings.TrimSpace(rh))
	if valor == "" {
		return nil
	}
	if _, ok := tiposRHPermitidos[valor]; !ok {
		return errPersonaRHInvalido
	}
	return nil
}

// normalizarPersonaRH deja el grupo en mayúsculas o vacío.
func normalizarPersonaRH(rh string) string {
	return strings.ToUpper(strings.TrimSpace(rh))
}
