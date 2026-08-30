/**
 * Entrego a biblioteca el listado de carnets regulares ya validados.
 * Solo mira; no aprueba ni devuelve.
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ListarBiblioteca GET /carnets/biblioteca.
func (h *CarnetHandler) ListarBiblioteca(c *gin.Context) {
	out, err := h.svc.ListarBiblioteca(fichaIDQueryCarnet(c))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, out)
}

// VerFotoBiblioteca GET /carnets/biblioteca/:id/foto.
func (h *CarnetHandler) VerFotoBiblioteca(c *gin.Context) {
	id, ok := idDeRutaCarnet(c)
	if !ok {
		return
	}
	arch, err := h.svc.LeerFotoBiblioteca(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.Data(http.StatusOK, arch.ContentType, arch.Bytes)
}
