package aprendizorder

import (
	"fmt"

	"gorm.io/gorm"
)

// PersonaNombreCompletoExpr devuelve la expresión SQL del nombre completo (equivalente a models.Persona.GetFullName).
func PersonaNombreCompletoExpr(alias string) string {
	p := alias + "."
	return fmt.Sprintf(
		`TRIM(CONCAT(%sprimer_nombre, CASE WHEN %ssegundo_nombre <> '' THEN ' ' || %ssegundo_nombre ELSE '' END, ' ', %sprimer_apellido, CASE WHEN %ssegundo_apellido <> '' THEN ' ' || %ssegundo_apellido ELSE '' END))`,
		p, p, p, p, p, p,
	)
}

// ScopeOrderByPersonaNombre aplica JOIN a Persona si hace falta y orden A–Z por nombre completo y documento.
func ScopeOrderByPersonaNombre(db *gorm.DB, personaJoinAlready bool) *gorm.DB {
	if !personaJoinAlready {
		db = db.Joins("Persona")
	}
	nombreExpr := PersonaNombreCompletoExpr("personas")
	return db.Order(nombreExpr + " ASC, personas.numero_documento ASC")
}
