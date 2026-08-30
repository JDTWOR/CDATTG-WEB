/**
 * Dejo pasar a la impresora si trae la clave de máquina.
 * Lo hice porque el equipo no puede entrar con correo y contraseña.
 * Acepto cabecera X-API-Key o ?api_key= (algunas impresoras solo saben URL).
 *
 * @author Cristian Deysdayr Jiménez
 */
package middleware

import (
	"crypto/sha256"
	"crypto/subtle"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/config"
)

const msgClaveImpresora = "clave de impresora inválida o ausente"

// RequireClaveImpresora cierra las rutas si la clave no coincide o no está puesta.
func RequireClaveImpresora() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !claveImpresoraCoincide(claveOfrecidaImpresora(c)) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": msgClaveImpresora})
			c.Abort()
			return
		}
		c.Next()
	}
}

// claveOfrecidaImpresora mira primero la cabecera y luego la URL.
func claveOfrecidaImpresora(c *gin.Context) string {
	if v := c.GetHeader("X-API-Key"); v != "" {
		return v
	}
	return c.Query("api_key")
}

// claveImpresoraCoincide compara sin filtrar el largo de la clave.
func claveImpresoraCoincide(ofrecida string) bool {
	esperada := config.ClaveImpresora()
	if esperada == "" || ofrecida == "" {
		return false
	}
	a := sha256.Sum256([]byte(esperada))
	b := sha256.Sum256([]byte(ofrecida))
	return subtle.ConstantTimeCompare(a[:], b[:]) == 1
}
