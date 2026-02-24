package middleware

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/sena/cdattg-web-golang/utils"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token de autorización requerido"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Formato de token inválido"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido o expirado"})
			c.Abort()
			return
		}

		// Cargar usuario completo
		userRepo := repositories.NewUserRepository()
		user, err := userRepo.FindByID(claims.UserID)
		if err != nil || !user.Status {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no encontrado o inactivo"})
			c.Abort()
			return
		}

		// Guardar usuario en contexto
		c.Set("user", user)
		c.Set("userID", claims.UserID)
		c.Set("email", claims.Email)

		c.Next()
	}
}

// RequirePermission verifica con Casbin que el usuario tenga el permiso (obj, act).
// obj = recurso (ej: "persona"), act = acción (ej: "CREAR PERSONA").
func RequirePermission(obj, act string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
			c.Abort()
			return
		}

		userID, ok := userIDVal.(uint)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": "Identidad de usuario inválida"})
			c.Abort()
			return
		}

		e, err := authz.GetEnforcer(database.GetDB())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error de autorización"})
			c.Abort()
			return
		}

		sub := strconv.FormatUint(uint64(userID), 10)
		allowed, err := authz.Enforce(e, sub, obj, act)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error verificando permiso"})
			c.Abort()
			return
		}

		if !allowed {
			c.JSON(http.StatusForbidden, gin.H{
				"error": fmt.Sprintf("No tiene permiso para %s en %s", act, obj),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequirePermissionFichasOrMisFichas permite GET lista de fichas si el usuario tiene VER FICHAS,
// o si tiene VER ASISTENCIA y pide mis_fichas=1 (instructor viendo solo sus fichas).
func RequirePermissionFichasOrMisFichas() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method != http.MethodGet {
			c.JSON(http.StatusForbidden, gin.H{"error": "No tiene permiso para esta acción"})
			c.Abort()
			return
		}
		userIDVal, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
			c.Abort()
			return
		}
		userID, ok := userIDVal.(uint)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": "Identidad de usuario inválida"})
			c.Abort()
			return
		}
		e, err := authz.GetEnforcer(database.GetDB())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error de autorización"})
			c.Abort()
			return
		}
		sub := strconv.FormatUint(uint64(userID), 10)
		// Quien tiene VER FICHAS puede listar (con o sin mis_fichas)
		allowed, _ := authz.Enforce(e, sub, "ficha", "VER FICHAS")
		if allowed {
			c.Next()
			return
		}
		// Instructor: solo si pide sus fichas (mis_fichas=1) y tiene VER ASISTENCIA
		if c.Query("mis_fichas") == "1" {
			allowed, _ = authz.Enforce(e, sub, "asistencia", "VER ASISTENCIA")
			if allowed {
				c.Next()
				return
			}
		}
		c.JSON(http.StatusForbidden, gin.H{
			"error": "No tiene permiso para VER FICHAS en ficha",
		})
		c.Abort()
	}
}

// RequirePermissionListInstructoresFicha permite GET (listar instructores de una ficha) con VER ASISTENCIA
// o cualquier método con GESTIONAR INSTRUCTORES FICHA. Así el instructor puede elegir su asignación para tomar asistencia.
func RequirePermissionListInstructoresFicha() gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
			c.Abort()
			return
		}
		userID, ok := userIDVal.(uint)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": "Identidad de usuario inválida"})
			c.Abort()
			return
		}
		e, err := authz.GetEnforcer(database.GetDB())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error de autorización"})
			c.Abort()
			return
		}
		sub := strconv.FormatUint(uint64(userID), 10)
		allowed, _ := authz.Enforce(e, sub, "ficha", "GESTIONAR INSTRUCTORES FICHA")
		if allowed {
			c.Next()
			return
		}
		// GET (solo listar): permitir a quien tenga VER ASISTENCIA para elegir instructor y crear sesión
		if c.Request.Method == http.MethodGet {
			allowed, _ = authz.Enforce(e, sub, "asistencia", "VER ASISTENCIA")
			if allowed {
				c.Next()
				return
			}
		}
		c.JSON(http.StatusForbidden, gin.H{
			"error": "No tiene permiso para GESTIONAR INSTRUCTORES FICHA en ficha",
		})
		c.Abort()
	}
}

// RequirePermissionListAprendicesFicha permite GET (listar aprendices de una ficha) con VER ASISTENCIA
// o cualquier método con GESTIONAR APRENDICES FICHA. Así el instructor puede ver aprendices al tomar asistencia.
func RequirePermissionListAprendicesFicha() gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
			c.Abort()
			return
		}
		userID, ok := userIDVal.(uint)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": "Identidad de usuario inválida"})
			c.Abort()
			return
		}
		e, err := authz.GetEnforcer(database.GetDB())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error de autorización"})
			c.Abort()
			return
		}
		sub := strconv.FormatUint(uint64(userID), 10)
		allowed, _ := authz.Enforce(e, sub, "ficha", "GESTIONAR APRENDICES FICHA")
		if allowed {
			c.Next()
			return
		}
		if c.Request.Method == http.MethodGet {
			allowed, _ = authz.Enforce(e, sub, "asistencia", "VER ASISTENCIA")
			if allowed {
				c.Next()
				return
			}
		}
		c.JSON(http.StatusForbidden, gin.H{
			"error": "No tiene permiso para GESTIONAR APRENDICES FICHA en ficha",
		})
		c.Abort()
	}
}

// RequireSuperAdmin exige que el usuario tenga el rol "SUPER ADMINISTRADOR" (solo para dashboard asistencia / WS).
func RequireSuperAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
			c.Abort()
			return
		}
		userID, ok := userIDVal.(uint)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": "Identidad de usuario inválida"})
			c.Abort()
			return
		}
		e, err := authz.GetEnforcer(database.GetDB())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error de autorización"})
			c.Abort()
			return
		}
		sub := strconv.FormatUint(uint64(userID), 10)
		roles, err := authz.GetRolesForUser(e, sub)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error verificando rol"})
			c.Abort()
			return
		}
		for _, r := range roles {
			if r == "SUPER ADMINISTRADOR" {
				c.Next()
				return
			}
		}
		c.JSON(http.StatusForbidden, gin.H{"error": "Solo el superadministrador puede acceder"})
		c.Abort()
	}
}
