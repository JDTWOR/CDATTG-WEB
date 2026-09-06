/**
 * Entrego los archivos de la reposición de carnet: comprobante, zip y la foto
 * del solicitante. El dueño (aprendiz) y quien valida (bibliotecario/super)
 * pueden descargarlos; por eso el permiso lo reviso aquí y no en el router.
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/database"
)

// Comprobante GET /carnets/perdida/:id/comprobante?tipo=pago|demanda.
func (h *CarnetPerdidaHandler) Comprobante(c *gin.Context) {
	userID, ok := userIDDelContexto(c)
	if !ok {
		return
	}
	personaID, ok := personaIDDelContexto(c)
	if !ok {
		return
	}
	solID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	if !h.descargaPermitida(userID, uint(solID), personaID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tiene permiso para ver el comprobante"})
		return
	}
	arch, err := h.svc.LeerComprobante(uint(solID), c.DefaultQuery("tipo", "pago"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.Header("Content-Disposition", "inline; filename="+arch.Nombre)
	c.Data(http.StatusOK, arch.ContentType, arch.Bytes)
}

// ComprobantesZip GET /carnets/perdida/:id/comprobantes/zip con los dos archivos.
func (h *CarnetPerdidaHandler) ComprobantesZip(c *gin.Context) {
	userID, ok := userIDDelContexto(c)
	if !ok {
		return
	}
	personaID, ok := personaIDDelContexto(c)
	if !ok {
		return
	}
	solID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	if !h.descargaPermitida(userID, uint(solID), personaID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tiene permiso para ver los comprobantes"})
		return
	}
	data, err := h.svc.LeerComprobantesZip(uint(solID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.Header("Content-Disposition", `attachment; filename="comprobantes_carnet.zip"`)
	c.Data(http.StatusOK, "application/zip", data)
}

// FotoZip GET /carnets/perdida/:id/foto/zip descarga la foto en un zip aparte.
func (h *CarnetPerdidaHandler) FotoZip(c *gin.Context) {
	userID, ok := userIDDelContexto(c)
	if !ok {
		return
	}
	personaID, ok := personaIDDelContexto(c)
	if !ok {
		return
	}
	solID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	if !h.descargaPermitida(userID, uint(solID), personaID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tiene permiso para descargar la foto"})
		return
	}
	data, err := h.svc.LeerFotoZip(uint(solID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.Header("Content-Disposition", `attachment; filename="foto_carnet.zip"`)
	c.Data(http.StatusOK, "application/zip", data)
}

// VerFoto GET /carnets/perdida/:id/foto, la foto del solicitante.
func (h *CarnetPerdidaHandler) VerFoto(c *gin.Context) {
	userID, ok := userIDDelContexto(c)
	if !ok {
		return
	}
	personaID, ok := personaIDDelContexto(c)
	if !ok {
		return
	}
	solID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	if !h.descargaPermitida(userID, uint(solID), personaID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tiene permiso para ver la foto"})
		return
	}
	foto, err := h.svc.LeerFoto(uint(solID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.Data(http.StatusOK, foto.ContentType, foto.Bytes)
}

// descargaPermitida deja pasar al dueño o a quien valida reposiciones.
func (h *CarnetPerdidaHandler) descargaPermitida(userID, solID, personaID uint) bool {
	esDuena := false
	if hist, err := h.svc.MiHistorial(personaID); err == nil {
		for i := range hist {
			if hist[i].ID == solID {
				esDuena = true
				break
			}
		}
	}
	if esDuena {
		return true
	}
	return puedeValidarPerdida(userID)
}

// puedeValidarPerdida pregunta a Casbin si el usuario valida reposiciones.
func puedeValidarPerdida(userID uint) bool {
	e, err := authz.GetEnforcer(database.GetDB())
	if err != nil {
		return false
	}
	sub := strconv.FormatUint(uint64(userID), 10)
	ok, _ := authz.Enforce(e, sub, authz.ObjCarnet, authz.ActValidarCarnetPerdida)
	return ok
}
