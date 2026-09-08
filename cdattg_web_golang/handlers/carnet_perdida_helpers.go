/**
 * Utilidades comunes de los handlers de reposición: el usuario autenticado y
 * la lectura de un comprobante subido por el formulario multipart.
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"errors"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/services"
)

var errArchivoFaltante = errors.New("adjunte los dos comprobantes (PDF, JPG, PNG o WEBP)")

// userIDDelContexto obtiene el id de usuario del token autenticado.
func userIDDelContexto(c *gin.Context) (uint, bool) {
	u, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return 0, false
	}
	user, _ := u.(*models.User)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return 0, false
	}
	return user.ID, true
}

func leerFormArchivo(c *gin.Context, campo string) ([]byte, error) {
	archivo, err := c.FormFile(campo)
	if err != nil {
		return nil, errArchivoFaltante
	}
	if archivo.Size > int64(services.CarnetPerdidaMaxBytes()) {
		return nil, services.ErrComprobanteGrande()
	}
	src, err := archivo.Open()
	if err != nil {
		return nil, errArchivoFaltante
	}
	defer src.Close()
	return io.ReadAll(src)
}
