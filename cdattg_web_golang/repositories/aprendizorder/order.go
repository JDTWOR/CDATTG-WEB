package aprendizorder

import (
	"fmt"

	"gorm.io/gorm"
)

const gormPersonaJoinAlias = `"Persona"`

// PersonaNombreCompletoExpr devuelve la expresión SQL del nombre completo (equivalente a models.Persona.GetFullName).
// personaAlias debe coincidir con el alias del JOIN (GORM: "Persona"; JOIN explícito: personas).
func PersonaNombreCompletoExpr(personaAlias string) string {
	p := personaAlias + "."
	return fmt.Sprintf(
		`TRIM(CONCAT(%sprimer_nombre, CASE WHEN %ssegundo_nombre <> '' THEN ' ' || %ssegundo_nombre ELSE '' END, ' ', %sprimer_apellido, CASE WHEN %ssegundo_apellido <> '' THEN ' ' || %ssegundo_apellido ELSE '' END))`,
		p, p, p, p, p, p,
	)
}

// ScopeOrderByPersonaNombre aplica JOIN a Persona si hace falta y orden A–Z por nombre completo y documento.
func ScopeOrderByPersonaNombre(db *gorm.DB, personaJoinAlready bool) *gorm.DB {
	personaAlias := gormPersonaJoinAlias
	if personaJoinAlready {
		personaAlias = "personas"
	}
	if !personaJoinAlready {
		db = db.Joins("Persona")
	}
	nombreExpr := PersonaNombreCompletoExpr(personaAlias)
	return db.Order(nombreExpr + " ASC, " + personaAlias + ".numero_documento ASC")
}
