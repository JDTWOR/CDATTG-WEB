package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/services"
)

type PermisosHandler struct {
	svc services.PermisosService
}

func NewPermisosHandler() *PermisosHandler {
	return &PermisosHandler{svc: services.NewPermisosService()}
}

// ListUsuarios GET /api/usuarios (listado para pantalla permisos)
func (h *PermisosHandler) ListUsuarios(c *gin.Context) {
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit > 100 {
		limit = 100
	}
	search := c.Query("search")
	list, total, err := h.svc.ListUsuarios(offset, limit, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list, "total": total, "offset": offset, "limit": limit})
}

// GetPermisos GET /api/usuarios/:id/permisos
func (h *PermisosHandler) GetPermisos(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	resp, err := h.svc.GetPermisosByUserID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// AsignarPermiso POST /api/usuarios/:id/permisos
func (h *PermisosHandler) AsignarPermiso(c *gin.Context) {
	currentID, _ := c.Get("userID")
	if currentID.(uint) == getParamID(c, "id") {
		c.JSON(http.StatusForbidden, gin.H{"error": "No puedes modificar tus propios permisos"})
		return
	}
	var req dto.AsignarPermisoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "obj y act requeridos"})
		return
	}
	if !authz.IsValidPermiso(req.Obj, req.Act) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "permiso no válido"})
		return
	}
	userID := getParamID(c, "id")
	if err := h.svc.AsignarPermisoDirecto(userID, req.Obj, req.Act); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Permiso asignado"})
}

// QuitarPermiso DELETE /api/usuarios/:id/permisos/:obj/:act
func (h *PermisosHandler) QuitarPermiso(c *gin.Context) {
	currentID, _ := c.Get("userID")
	if currentID.(uint) == getParamID(c, "id") {
		c.JSON(http.StatusForbidden, gin.H{"error": "No puedes modificar tus propios permisos"})
		return
	}
	obj := c.Param("obj")
	act := c.Param("act")
	userID := getParamID(c, "id")
	if err := h.svc.QuitarPermisoDirecto(userID, obj, act); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Permiso quitado"})
}

// SetRoles PATCH /api/usuarios/:id/roles (solo SUPER ADMIN)
func (h *PermisosHandler) SetRoles(c *gin.Context) {
	currentID, _ := c.Get("userID")
	if currentID.(uint) == getParamID(c, "id") {
		c.JSON(http.StatusForbidden, gin.H{"error": "No puedes modificar tus propios roles"})
		return
	}
	var req dto.SetRolesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "roles requerido (array)"})
		return
	}
	userID := getParamID(c, "id")
	if err := h.svc.SetRoles(userID, req.Roles); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Roles actualizados"})
}

// ToggleEstado PATCH /api/usuarios/:id/estado
func (h *PermisosHandler) ToggleEstado(c *gin.Context) {
	currentID, _ := c.Get("userID")
	if currentID.(uint) == getParamID(c, "id") {
		c.JSON(http.StatusForbidden, gin.H{"error": "No puedes cambiar tu propio estado"})
		return
	}
	userID := getParamID(c, "id")
	if err := h.svc.ToggleEstado(userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Estado actualizado"})
}

// Definiciones GET /api/permisos/definiciones (roles y permisos válidos para la UI)
func (h *PermisosHandler) Definiciones(c *gin.Context) {
	c.JSON(http.StatusOK, h.svc.Definiciones())
}

func getParamID(c *gin.Context, param string) uint {
	id, _ := strconv.ParseUint(c.Param(param), 10, 64)
	return uint(id)
}
