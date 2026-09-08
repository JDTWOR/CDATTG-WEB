/**
 * Atiendo las notificaciones del usuario: sin estas rutas la campana del
 * frontend no tendría qué mostrar. Leo del repositorio ya existente.
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

// NotificacionHandler expone las notificaciones al usuario autenticado.
type NotificacionHandler struct {
	svc services.NotificacionLecturaService
}

// NewNotificacionHandler crea el handler de la campana.
func NewNotificacionHandler() *NotificacionHandler {
	return &NotificacionHandler{svc: services.NewNotificacionLecturaService()}
}

// Listar GET /notificaciones?page=&per_page=.
func (h *NotificacionHandler) Listar(c *gin.Context) {
	userID, ok := userIDDelContexto(c)
	if !ok {
		return
	}
	pagina, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPagina, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	if pagina < 1 {
		pagina = 1
	}
	if perPagina < 1 || perPagina > 50 {
		perPagina = 20
	}
	list, total, err := h.svc.Listar(userID, perPagina, (pagina-1)*perPagina)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": list, "total": total})
}

// ContarNoLeidas GET /notificaciones/no-leidas.
func (h *NotificacionHandler) ContarNoLeidas(c *gin.Context) {
	userID, ok := userIDDelContexto(c)
	if !ok {
		return
	}
	n, err := h.svc.ContarNoLeidas(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"no_leidas": n})
}

// MarcarLeida PUT /notificaciones/:id/leida.
func (h *NotificacionHandler) MarcarLeida(c *gin.Context) {
	userID, ok := userIDDelContexto(c)
	if !ok {
		return
	}
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	if err := h.svc.MarcarLeida(userID, uint(id)); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No pude marcar la notificación"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// Eliminar DELETE /notificaciones/:id — borra una notificación del dueño.
func (h *NotificacionHandler) Eliminar(c *gin.Context) {
	userID, ok := userIDDelContexto(c)
	if !ok {
		return
	}
	id, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	if err := h.svc.Eliminar(userID, uint(id)); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No pude eliminar la notificación"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// EliminarTodas DELETE /notificaciones — vacía el buzón del dueño.
func (h *NotificacionHandler) EliminarTodas(c *gin.Context) {
	userID, ok := userIDDelContexto(c)
	if !ok {
		return
	}
	if err := h.svc.EliminarTodas(userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No pude vaciar las notificaciones"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
