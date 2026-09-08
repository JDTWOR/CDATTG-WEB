/**
 * Atiendo /carnets/perdida: el aprendiz sube sus comprobantes y el bibliotecario
 * revisa y decide. La descarga de archivos vive en carnet_perdida_descarga.go.
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/services"
)

// CarnetPerdidaHandler atiende el submódulo de reposición física.
type CarnetPerdidaHandler struct {
	svc services.CarnetPerdidaService
}

// NewCarnetPerdidaHandler crea el handler.
func NewCarnetPerdidaHandler() *CarnetPerdidaHandler {
	return &CarnetPerdidaHandler{svc: services.NewCarnetPerdidaService()}
}

// Crear POST /carnets/perdida (multipart con los dos comprobantes).
func (h *CarnetPerdidaHandler) Crear(c *gin.Context) {
	personaID, ok := personaIDDelContexto(c)
	if !ok {
		return
	}
	fichaID, _ := strconv.ParseUint(c.PostForm("ficha_id"), 10, 32)
	pago, err := leerFormArchivo(c, "comprobante_pago")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	demanda, err := leerFormArchivo(c, "comprobante_demanda")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item, err := h.svc.Crear(personaID, uint(fichaID), pago, demanda)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, item)
}

// MiHistorial GET /carnets/perdida/mi-historial.
func (h *CarnetPerdidaHandler) MiHistorial(c *gin.Context) {
	personaID, ok := personaIDDelContexto(c)
	if !ok {
		return
	}
	items, err := h.svc.MiHistorial(personaID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

// Revisiones GET /carnets/perdida/revisiones?estado=...
func (h *CarnetPerdidaHandler) Revisiones(c *gin.Context) {
	estado := c.DefaultQuery("estado", "pendiente")
	pagina, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPagina, _ := strconv.Atoi(c.DefaultQuery("per_page", "50"))
	if pagina < 1 {
		pagina = 1
	}
	if perPagina < 1 || perPagina > 100 {
		perPagina = 50
	}
	list, total, err := h.svc.Revisiones(estado, perPagina, (pagina-1)*perPagina)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": list, "total": total})
}

// Decidir POST /carnets/perdida/:id/decidir.
func (h *CarnetPerdidaHandler) Decidir(c *gin.Context) {
	userID, ok := userIDDelContexto(c)
	if !ok {
		return
	}
	solID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	var req struct {
		Aprobar bool   `json:"aprobar"`
		Motivo  string `json:"motivo"`
	}
	_ = c.ShouldBindJSON(&req)
	item, err := h.svc.Decidir(userID, uint(solID), req.Aprobar, req.Motivo)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, item)
}

// Renovar POST /carnets/perdida/:id/renovar — cierra la reposición al entregar
// el carnet renovado y la mueve al historial.
func (h *CarnetPerdidaHandler) Renovar(c *gin.Context) {
	userID, ok := userIDDelContexto(c)
	if !ok {
		return
	}
	solID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	item, err := h.svc.Renovar(userID, uint(solID))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, item)
}
