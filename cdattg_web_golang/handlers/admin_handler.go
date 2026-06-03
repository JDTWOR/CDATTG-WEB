package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/database/seeders"
)

type AdminHandler struct{}

func NewAdminHandler() *AdminHandler {
	return &AdminHandler{}
}

// SyncInstructorRoles ejecuta el seeder que asigna rol INSTRUCTOR en BD y Casbin
// a todos los usuarios cuya persona está en la tabla instructors.
// Útil cuando se asigna una ficha a un instructor y su usuario no tenía el rol en Casbin.
func (h *AdminHandler) SyncInstructorRoles(c *gin.Context) {
	db := database.GetDB()
	if err := seeders.RunSyncInstructorRolesSeeder(db); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al sincronizar roles: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Roles de instructor sincronizados correctamente"})
}

// SyncInventarioPermissions asigna los permisos del módulo inventario a los roles ADMINISTRADOR y COORDINADOR
// sin quitar los que ya tengan. Útil cuando el módulo inventario se añadió después del primer seed.
func (h *AdminHandler) SyncInventarioPermissions(c *gin.Context) {
	db := database.GetDB()
	if err := seeders.SyncInventarioPermissionsToRoles(db); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al sincronizar permisos de inventario: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Permisos de inventario sincronizados. Los coordinadores y administradores deben cerrar sesión y volver a entrar para ver el menú Inventario."})
}

// SyncAgendaPermissions asigna PROGRAMAR INSTRUCTORES (admin/coordinador) y VER MI AGENDA (instructor)
// en Casbin sin quitar permisos existentes. Útil tras desplegar el módulo de programación.
func (h *AdminHandler) SyncAgendaPermissions(c *gin.Context) {
	db := database.GetDB()
	if err := seeders.SyncAgendaPermissionsToRoles(db); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al sincronizar permisos de agenda: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "Permisos de agenda sincronizados. Los usuarios deben cerrar sesión y volver a entrar para aplicar PROGRAMAR INSTRUCTORES y VER MI AGENDA.",
	})
}
