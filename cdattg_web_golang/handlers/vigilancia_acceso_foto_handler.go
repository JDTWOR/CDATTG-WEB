/**
 * Entrego a portería la foto que debe ver: la del carnet validado o la de perfil.
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// VerFotoAcceso GET /vigilancia/acceso/foto?documento=
func (h *VigilanciaAccesoHandler) VerFotoAcceso(c *gin.Context) {
	arch, err := h.svc.LeerFotoAcceso(c.Query("documento"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.Data(http.StatusOK, arch.ContentType, arch.Bytes)
}
