package middleware

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
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
		if err == nil && allowed {
			c.Next()
			return
		}

		// Fallback especial para asistencia: permitir al instructor de la ficha ver la sesión (VER ASISTENCIA)
		if obj == authz.ObjAsistencia && act == "VER ASISTENCIA" && c.Request.Method == http.MethodGet {
			if asistenciaID, ok := getAsistenciaIDFromRequest(c); ok && asistenciaID > 0 {
				if allowInstructorAsistenciaByID(c, asistenciaID) {
					c.Next()
					return
				}
			}
		}

		// Fallback para TOMAR ASISTENCIA: instructor asignado a la ficha de la sesión puede registrar ingreso/salida/observaciones/finalizar
		if obj == authz.ObjAsistencia && act == "TOMAR ASISTENCIA" {
			if asistenciaID, ok := getAsistenciaIDFromRequest(c); ok && asistenciaID > 0 {
				if allowInstructorAsistenciaByID(c, asistenciaID) {
					c.Next()
					return
				}
			}
		}

		// Si hubo error de Casbin y no pudimos aplicar fallback específico, tratar como error interno
		if err != nil && !(obj == authz.ObjAsistencia && (act == "VER ASISTENCIA" || act == "TOMAR ASISTENCIA")) {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error verificando permiso"})
			c.Abort()
			return
		}

		// Caso general: permiso denegado
		c.JSON(http.StatusForbidden, gin.H{
			"error": fmt.Sprintf("No tiene permiso para %s en %s", act, obj),
		})
		c.Abort()
	}
}

// getAsistenciaIDFromRequest obtiene el ID de la sesión de asistencia desde la URL o el body (sin consumir el body).
func getAsistenciaIDFromRequest(c *gin.Context) (uint, bool) {
	if idStr := c.Param("id"); idStr != "" {
		if id, err := strconv.ParseUint(idStr, 10, 32); err == nil {
			return uint(id), true
		}
	}
	if idStr := c.Param("asistenciaAprendizId"); idStr != "" {
		if id, err := strconv.ParseUint(idStr, 10, 32); err == nil {
			repo := repositories.NewAsistenciaAprendizRepository()
			if aa, errAA := repo.FindByID(uint(id)); errAA == nil && aa != nil {
				return aa.AsistenciaID, true
			}
		}
	}
	if c.Request.Method == http.MethodPost && (c.Request.URL.Path == "/api/asistencias/ingreso" || c.Request.URL.Path == "/api/asistencias/ingreso-por-documento") {
		body, err := io.ReadAll(c.Request.Body)
		if err != nil {
			return 0, false
		}
		c.Request.Body = io.NopCloser(bytes.NewReader(body))
		var parsed struct {
			AsistenciaID uint `json:"asistencia_id"`
		}
		if json.Unmarshal(body, &parsed) == nil && parsed.AsistenciaID > 0 {
			return parsed.AsistenciaID, true
		}
	}
	return 0, false
}

// allowInstructorAsistenciaByID devuelve true si el usuario actual es un instructor asignado a la ficha de la sesión de asistencia.
func allowInstructorAsistenciaByID(c *gin.Context, asistenciaID uint) bool {
	u, ok := c.Get("user")
	if !ok {
		return false
	}
	user, _ := u.(*models.User)
	if user == nil || user.PersonaID == nil {
		return false
	}
	instRepo := repositories.NewInstructorRepository()
	inst, errInst := instRepo.FindByPersonaID(*user.PersonaID)
	if errInst != nil || inst == nil {
		return false
	}
	asistenciaRepo := repositories.NewAsistenciaRepository()
	a, errAsis := asistenciaRepo.FindByID(asistenciaID)
	if errAsis != nil || a == nil || a.InstructorFicha == nil {
		return false
	}
	instFichaRepo := repositories.NewInstructorFichaRepository()
	_, errIF := instFichaRepo.FindByFichaIDAndInstructorID(a.InstructorFicha.FichaID, inst.ID)
	return errIF == nil
}

// RequirePermissionFichasOrMisFichas permite GET lista de fichas si el usuario tiene VER FICHAS,
// o, cuando pide mis_fichas=1, siempre que esté autenticado (el handler ya filtra por instructor vinculado).
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
		// mis_fichas=1: permitir listar siempre; el handler limita los resultados a fichas
		// donde el usuario esté vinculado como instructor (usando persona_id → instructor).
		if c.Query("mis_fichas") == "1" {
			c.Next()
			return
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
		var sub string
		if err == nil {
			sub = strconv.FormatUint(uint64(userID), 10)
			// 1) Permiso completo de gestión de aprendices en ficha
			if allowed, errEnf := authz.Enforce(e, sub, authz.ObjFicha, "GESTIONAR APRENDICES FICHA"); errEnf == nil && allowed {
				c.Next()
				return
			}
			// 2) Permiso de ver asistencia
			if c.Request.Method == http.MethodGet {
				if allowed, errEnf := authz.Enforce(e, sub, authz.ObjAsistencia, "VER ASISTENCIA"); errEnf == nil && allowed {
					c.Next()
					return
				}
			}
		}

		// 3) Fallback: instructor asignado a la ficha (permite ver aprendices solo para GET)
		if c.Request.Method == http.MethodGet {
			if u, ok := c.Get("user"); ok {
				if user, _ := u.(*models.User); user != nil && user.PersonaID != nil {
					instRepo := repositories.NewInstructorRepository()
					if inst, errInst := instRepo.FindByPersonaID(*user.PersonaID); errInst == nil && inst != nil {
						if idStr := c.Param("id"); idStr != "" {
							if id, errParse := strconv.ParseUint(idStr, 10, 32); errParse == nil {
								instFichaRepo := repositories.NewInstructorFichaRepository()
								if _, errIF := instFichaRepo.FindByFichaIDAndInstructorID(uint(id), inst.ID); errIF == nil {
									c.Next()
									return
								}
							}
						}
					}
				}
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
