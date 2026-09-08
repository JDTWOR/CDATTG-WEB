/**
 * Atiendo POST /carnets/perdida/:id/notificar-disponible: el bibliotecario avisa
 * al aprendiz (vía notificación) que su carnet renovado ya puede recogerse.
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// NotificarDisponible POST /carnets/perdida/:id/notificar-disponible.
func (h *CarnetPerdidaHandler) NotificarDisponible(c *gin.Context) {
	solID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	if err := h.svc.NotificarDisponible(uint(solID)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
