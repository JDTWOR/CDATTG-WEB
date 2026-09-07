/**
 * Entrego el Excel de carnets regulares por la API.
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

const excelCarnetMIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

// DescargarExcelBiblioteca GET /carnets/biblioteca/excel?ficha_id=
func (h *CarnetHandler) DescargarExcelBiblioteca(c *gin.Context) {
	data, err := h.svc.ExcelBiblioteca(fichaIDQueryCarnet(c))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Header("Content-Disposition", `attachment; filename="carnets-regulares.xlsx"`)
	c.Data(http.StatusOK, excelCarnetMIME, data)
}

func fichaIDQueryCarnet(c *gin.Context) uint {
	id, _ := strconv.ParseUint(c.Query("ficha_id"), 10, 32)
	return uint(id)
}
