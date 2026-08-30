// @module personal_rol_common
// @description Helpers compartidos de CRUD para los handlers de Personal Operativo, Administrativo y Contratistas.
// @author JDTWOR
// @created 2026-08-14
package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
)

// readPaginationParams lee page/page_size/search de la query y sane los valores.
// Retorna (page, pageSize, search) con defaults page=1, page_size=20 (máx 100).
func readPaginationParams(c *gin.Context) (int, int, string) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	pageSize, err := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if err != nil || pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	return page, pageSize, c.Query("search")
}

// getRolPersonalByID resuelve el id del param y devuelve el ítem o responde 400/404.
// Parámetros: c (contexto Gin), get (función que obtiene el ítem por id).
// Retorna el ítem y ok=false cuando ya se escribió la respuesta de error.
func getRolPersonalByID(c *gin.Context, get func(id uint) (*dto.RolPersonalItem, error)) (*dto.RolPersonalItem, bool) {
	idNum, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errMsgIDInvalido})
		return nil, false
	}
	item, err := get(uint(idNum))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return nil, false
	}
	return item, true
}

// updateRolPersonal valida id y body {"estado": bool} y ejecuta el update.
// Parámetros: c (contexto Gin), update (función de negocio). Retorna true si se respondió 200.
func updateRolPersonal(c *gin.Context, update func(id uint, estado *bool) (*dto.RolPersonalItem, error)) bool {
	idNum, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errMsgIDInvalido})
		return false
	}
	var req struct {
		Estado *bool `json:"estado"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errMsgDatosInvalidos, "details": err.Error()})
		return false
	}
	item, err := update(uint(idNum), req.Estado)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return false
	}
	c.JSON(http.StatusOK, item)
	return true
}

// deleteRolPersonal valida el id y ejecuta el borrado, respondiendo 204 o 400.
// Parámetros: c (contexto Gin), del (función de negocio de borrado por id).
func deleteRolPersonal(c *gin.Context, del func(id uint) error) {
	idNum, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errMsgIDInvalido})
		return
	}
	if err := del(uint(idNum)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}