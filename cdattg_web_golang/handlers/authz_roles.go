/**
 * Ayuda a saber si el usuario autenticado debe pasar por la aprobación de
 * portería al editar su perfil o subir su foto.
 * Lo hice para reutilizar esa consulta en el bloqueo de edición de perfil
 * y en la subida de foto, sin duplicar la lógica de roles.
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"github.com/gin-gonic/gin"
)

const (
	rolVisitante = "VISITANTE"
	rolAprendiz  = "APRENDIZ"
)

// esVisitante consulta los roles reales del usuario y devuelve true solo si su
// ÚNICO rol es VISITANTE. Quien además tiene cualquier rol funcional (APRENDIZ,
// INSTRUCTOR, PERSONAL OPERATIVO Y DE APOYO, PERSONAL ADMINISTRATIVO,
// CONTRATISTA PRESTACIÓN DE SERVICIOS, etc.) edita su perfil y su foto directo:
// la validación final la hace el instructor líder cuando crea su carnet.
// Los roles se ven del contexto o se obtienen del enforcer.
func esVisitante(c *gin.Context) bool {
	roles := rolesFromContext(c)
	return len(roles) == 1 && roles[0] == rolVisitante
}
