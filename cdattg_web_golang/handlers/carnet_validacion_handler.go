/**
 * El instructor líder lista y decide solicitudes de carnet.
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/repositories"
)

// ListarPendientes GET /carnets/pendientes.
func (h *CarnetHandler) ListarPendientes(c *gin.Context) {
	instructorID, ok := instructorIDDelContexto(c)
	if !ok {
		return
	}
	list, err := h.svc.ListarPendientes(instructorID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, list)
}

// VerSolicitud GET /carnets/:id.
func (h *CarnetHandler) VerSolicitud(c *gin.Context) {
	instructorID, ok := instructorIDDelContexto(c)
	if !ok {
		return
	}
	id, ok := idDeRutaCarnet(c)
	if !ok {
		return
	}
	vista, err := h.svc.VerSolicitud(instructorID, id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, vista)
}

// DecidirSolicitud POST /carnets/:id/decidir?aprobar=1
func (h *CarnetHandler) DecidirSolicitud(c *gin.Context) {
	instructorID, ok := instructorIDDelContexto(c)
	if !ok {
		return
	}
	id, ok := idDeRutaCarnet(c)
	if !ok {
		return
	}
	var req dto.CarnetDecisionRequest
	_ = c.ShouldBindJSON(&req)
	aprobar := c.DefaultQuery("aprobar", "1") == "1"
	if err := h.svc.Decidir(instructorID, id, aprobar, req.Motivo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// VerFotoSolicitud GET /carnets/:id/foto.
func (h *CarnetHandler) VerFotoSolicitud(c *gin.Context) {
	instructorID, ok := instructorIDDelContexto(c)
	if !ok {
		return
	}
	id, ok := idDeRutaCarnet(c)
	if !ok {
		return
	}
	arch, err := h.svc.LeerFotoSolicitud(instructorID, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.Data(http.StatusOK, arch.ContentType, arch.Bytes)
}

func idDeRutaCarnet(c *gin.Context) (uint, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return 0, false
	}
	return uint(id), true
}

func instructorIDDelContexto(c *gin.Context) (uint, bool) {
	personaID, ok := personaIDDelContexto(c)
	if !ok {
		return 0, false
	}
	inst, err := repositories.NewInstructorRepository().FindByPersonaID(personaID)
	if err != nil || inst == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "No es instructor"})
		return 0, false
	}
	return inst.ID, true
}
