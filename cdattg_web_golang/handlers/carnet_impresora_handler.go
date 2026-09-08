/**
 * Entrego a la impresora la foto del carnet por cédula.
 * El listado y el Excel reutilizan los de biblioteca.
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// VerFotoImpresora GET /impresora/carnets/foto?documento=
func (h *CarnetHandler) VerFotoImpresora(c *gin.Context) {
	arch, err := h.svc.LeerFotoBibliotecaPorDocumento(c.Query("documento"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.Data(http.StatusOK, arch.ContentType, arch.Bytes)
}
