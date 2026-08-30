/**
 * handlers: utilidades de handlers del portal (userID y errores).
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// portalUserID extrae el ID del JWT; false si no hay sesión.
func portalUserID(c *gin.Context) (uint, bool) {
	v, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return 0, false
	}
	id, ok := v.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return 0, false
	}
	return id, true
}

// portalIDParam parsea un :id de ruta.
func portalIDParam(c *gin.Context, name string) (uint, bool) {
	n, err := strconv.ParseUint(c.Param(name), 10, 64)
	if err != nil || n == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Identificador inválido"})
		return 0, false
	}
	return uint(n), true
}

// portalJSONError respuesta {error} uniforme.
func portalJSONError(c *gin.Context, status int, msg string) {
	c.JSON(status, gin.H{"error": msg})
}
