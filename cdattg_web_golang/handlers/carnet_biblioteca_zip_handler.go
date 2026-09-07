/**
 * Entrego el zip de fotos de los carnets regulares por la API.
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

const zipCarnetMIME = "application/zip"

// DescargarFotosBibliotecaZip GET /carnets/biblioteca/fotos/zip?ficha_id=
func (h *CarnetHandler) DescargarFotosBibliotecaZip(c *gin.Context) {
	data, err := h.svc.FotosBibliotecaZip(fichaIDQueryCarnet(c))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Header("Content-Disposition", `attachment; filename="fotos-carnets-regulares.zip"`)
	c.Data(http.StatusOK, zipCarnetMIME, data)
}
