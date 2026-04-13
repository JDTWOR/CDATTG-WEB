package middleware

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/casbin/casbin/v3"
	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/sena/cdattg-web-golang/utils"
)

const (
	msgUsuarioNoAutenticado       = "Usuario no autenticado"
	msgIdentidadUsuarioInvalida   = "Identidad de usuario inválida"
	msgErrorAutorizacion          = "Error de autorización"
	msgErrorVerificandoPermiso    = "Error verificando permiso"
	msgErrorVerificandoRol        = "Error verificando rol"
	actVerPersona                 = "VER PERSONA"
	actVerFicha                   = "VER FICHA"
	actVerAsistencia              = "VER ASISTENCIA"
	actTomarAsistencia            = "TOMAR ASISTENCIA"
	actVerFichas                  = "VER FICHAS"
	actGestionarInstructoresFicha = "GESTIONAR INSTRUCTORES FICHA"
	actGestionarAprendicesFicha   = "GESTIONAR APRENDICES FICHA"
)

// requireAuthenticatedUserID devuelve el userID o ya respondió 401/403 y abortó.
func requireAuthenticatedUserID(c *gin.Context) (uint, bool) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": msgUsuarioNoAutenticado})
		c.Abort()
		return 0, false
	}
	userID, ok := userIDVal.(uint)
	if !ok {
		c.JSON(http.StatusForbidden, gin.H{"error": msgIdentidadUsuarioInvalida})
		c.Abort()
		return 0, false
	}
	return userID, true
}

func getEnforcerOrAbort(c *gin.Context) (*casbin.Enforcer, bool) {
	e, err := authz.GetEnforcer(database.GetDB())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": msgErrorAutorizacion})
		c.Abort()
		return nil, false
	}
	return e, true
}

func tryFallbackVerPersonaPropia(c *gin.Context, obj, act string) bool {
	if obj != authz.ObjPersona || act != actVerPersona {
		return false
	}
	u, ok := c.Get("user")
	if !ok {
		return false
	}
	user, _ := u.(*models.User)
	if user == nil || user.PersonaID == nil {
		return false
	}
	idStr := c.Param("id")
	if idStr == "" {
		return false
	}
	id, errParse := strconv.ParseUint(idStr, 10, 32)
	return errParse == nil && uint(id) == *user.PersonaID
}

func tryFallbackAsistenciaInstructor(c *gin.Context, obj, act string) bool {
	if obj != authz.ObjAsistencia {
		return false
	}
	if act == actVerAsistencia && c.Request.Method != http.MethodGet {
		return false
	}
	if act != actVerAsistencia && act != actTomarAsistencia {
		return false
	}
	asistenciaID, ok := getAsistenciaIDFromRequest(c)
	if !ok || asistenciaID == 0 {
		return false
	}
	return allowInstructorAsistenciaByID(c, asistenciaID)
}

func handleRequirePermissionDenied(c *gin.Context, obj, act string, err error) {
	if err != nil && !(obj == authz.ObjAsistencia && (act == actVerAsistencia || act == actTomarAsistencia)) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": msgErrorVerificandoPermiso})
		c.Abort()
		return
	}
	c.JSON(http.StatusForbidden, gin.H{"error": fmt.Sprintf("No tiene permiso para %s en %s", act, obj)})
	c.Abort()
}

func tryEnforceAprendicesFichaList(e *casbin.Enforcer, sub string, c *gin.Context) bool {
	if allowed, errEnf := authz.Enforce(e, sub, authz.ObjFicha, actGestionarAprendicesFicha); errEnf == nil && allowed {
		return true
	}
	if c.Request.Method == http.MethodGet {
		if allowed, errEnf := authz.Enforce(e, sub, authz.ObjAsistencia, actVerAsistencia); errEnf == nil && allowed {
			return true
		}
	}
	return false
}

func tryEnforceVerFichaOCodigo(e *casbin.Enforcer, sub string) bool {
	if allowed, errEnf := authz.Enforce(e, sub, authz.ObjFicha, actVerFicha); errEnf == nil && allowed {
		return true
	}
	if allowed, errEnf := authz.Enforce(e, sub, authz.ObjAsistencia, actVerAsistencia); errEnf == nil && allowed {
		return true
	}
	return false
}

// instructorTieneFichaAsignada indica si el usuario autenticado es instructor asignado a la ficha.
func instructorTieneFichaAsignada(c *gin.Context, fichaID uint) bool {
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
	instFichaRepo := repositories.NewInstructorFichaRepository()
	_, errIF := instFichaRepo.FindByFichaIDAndInstructorID(fichaID, inst.ID)
	return errIF == nil
}

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
		userID, ok := requireAuthenticatedUserID(c)
		if !ok {
			return
		}
		e, ok := getEnforcerOrAbort(c)
		if !ok {
			return
		}
		sub := strconv.FormatUint(uint64(userID), 10)
		allowed, err := authz.Enforce(e, sub, obj, act)
		if err == nil && allowed {
			c.Next()
			return
		}
		if tryFallbackVerPersonaPropia(c, obj, act) {
			c.Next()
			return
		}
		if tryFallbackAsistenciaInstructor(c, obj, act) {
			c.Next()
			return
		}
		handleRequirePermissionDenied(c, obj, act, err)
	}
}

// RequirePermissionCatalogosFicha permite GET a catálogos del formulario de ficha (sedes, días, etc.)
// si el usuario tiene cualquier permiso relevante sobre fichas. Así quien solo tiene EDITAR/CREAR FICHA
// (sin VER FICHAS) puede cargar los días de formación y guardarlos.
func RequirePermissionCatalogosFicha() gin.HandlerFunc {
	acts := authz.PermisosFicha
	return func(c *gin.Context) {
		userID, ok := requireAuthenticatedUserID(c)
		if !ok {
			return
		}
		e, ok := getEnforcerOrAbort(c)
		if !ok {
			return
		}
		sub := strconv.FormatUint(uint64(userID), 10)
		for _, act := range acts {
			if allowed, errEnf := authz.Enforce(e, sub, authz.ObjFicha, act); errEnf == nil && allowed {
				c.Next()
				return
			}
		}
		c.JSON(http.StatusForbidden, gin.H{"error": "No tiene permiso para acceder a catálogos de fichas"})
		c.Abort()
	}
}

// RequirePermissionLeerFichaIndividual permite GET /fichas-caracterizacion/:id a quien pueda ver o editar fichas.
// Sin EDITAR FICHA aquí, quien solo edita no puede refrescar la ficha (p. ej. días de formación) y el modal queda vacío.
func RequirePermissionLeerFichaIndividual() gin.HandlerFunc {
	acts := []string{actVerFicha, actVerFichas, "EDITAR FICHA", "CREAR FICHA"}
	return func(c *gin.Context) {
		userID, ok := requireAuthenticatedUserID(c)
		if !ok {
			return
		}
		e, ok := getEnforcerOrAbort(c)
		if !ok {
			return
		}
		sub := strconv.FormatUint(uint64(userID), 10)
		for _, act := range acts {
			if allowed, errEnf := authz.Enforce(e, sub, authz.ObjFicha, act); errEnf == nil && allowed {
				c.Next()
				return
			}
		}
		c.JSON(http.StatusForbidden, gin.H{"error": "No tiene permiso para ver esta ficha"})
		c.Abort()
	}
}

func uintFromParam(c *gin.Context, name string) (uint, bool) {
	idStr := c.Param(name)
	if idStr == "" {
		return 0, false
	}
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		return 0, false
	}
	return uint(id), true
}

func asistenciaIDFromAprendizParam(c *gin.Context) (uint, bool) {
	id, ok := uintFromParam(c, "asistenciaAprendizId")
	if !ok {
		return 0, false
	}
	repo := repositories.NewAsistenciaAprendizRepository()
	aa, errAA := repo.FindByID(id)
	if errAA != nil || aa == nil {
		return 0, false
	}
	return aa.AsistenciaID, true
}

func asistenciaIDFromIngresoBody(c *gin.Context) (uint, bool) {
	if c.Request.Method != http.MethodPost {
		return 0, false
	}
	p := c.Request.URL.Path
	if p != "/api/asistencias/ingreso" && p != "/api/asistencias/ingreso-por-documento" {
		return 0, false
	}
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		return 0, false
	}
	c.Request.Body = io.NopCloser(bytes.NewReader(body))
	var parsed struct {
		AsistenciaID uint `json:"asistencia_id"`
	}
	if json.Unmarshal(body, &parsed) != nil || parsed.AsistenciaID == 0 {
		return 0, false
	}
	return parsed.AsistenciaID, true
}

// getAsistenciaIDFromRequest obtiene el ID de la sesión de asistencia desde la URL o el body (sin consumir el body).
func getAsistenciaIDFromRequest(c *gin.Context) (uint, bool) {
	if id, ok := uintFromParam(c, "id"); ok {
		return id, true
	}
	if id, ok := asistenciaIDFromAprendizParam(c); ok {
		return id, true
	}
	return asistenciaIDFromIngresoBody(c)
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
		userID, ok := requireAuthenticatedUserID(c)
		if !ok {
			return
		}
		e, ok := getEnforcerOrAbort(c)
		if !ok {
			return
		}
		sub := strconv.FormatUint(uint64(userID), 10)
		// Quien tiene VER FICHAS puede listar (con o sin mis_fichas)
		allowed, _ := authz.Enforce(e, sub, authz.ObjFicha, actVerFichas)
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
		userID, ok := requireAuthenticatedUserID(c)
		if !ok {
			return
		}
		e, ok := getEnforcerOrAbort(c)
		if !ok {
			return
		}
		sub := strconv.FormatUint(uint64(userID), 10)
		allowed, _ := authz.Enforce(e, sub, authz.ObjFicha, actGestionarInstructoresFicha)
		if allowed {
			c.Next()
			return
		}
		// GET (solo listar): permitir a quien tenga VER ASISTENCIA para elegir instructor y crear sesión
		if c.Request.Method == http.MethodGet {
			allowed, _ = authz.Enforce(e, sub, authz.ObjAsistencia, actVerAsistencia)
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
		userID, ok := requireAuthenticatedUserID(c)
		if !ok {
			return
		}
		e, errEnf := authz.GetEnforcer(database.GetDB())
		if errEnf == nil {
			sub := strconv.FormatUint(uint64(userID), 10)
			if tryEnforceAprendicesFichaList(e, sub, c) {
				c.Next()
				return
			}
		}
		if c.Request.Method == http.MethodGet {
			if fichaID, ok := uintFromParam(c, "id"); ok && instructorTieneFichaAsignada(c, fichaID) {
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

// RequirePermissionListAsistenciasPorFicha permite GET (listar sesiones por ficha y fechas) con VER ASISTENCIA (Casbin)
// o si el usuario es instructor asignado a esa ficha. Así el instructor puede ver el historial de asistencias de sus fichas.
func RequirePermissionListAsistenciasPorFicha() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method != http.MethodGet {
			c.JSON(http.StatusForbidden, gin.H{"error": "Método no permitido"})
			c.Abort()
			return
		}
		userID, ok := requireAuthenticatedUserID(c)
		if !ok {
			return
		}
		e, err := authz.GetEnforcer(database.GetDB())
		if err == nil {
			sub := strconv.FormatUint(uint64(userID), 10)
			if allowed, errEnf := authz.Enforce(e, sub, authz.ObjAsistencia, actVerAsistencia); errEnf == nil && allowed {
				c.Next()
				return
			}
		}
		if fichaID, ok := uintFromParam(c, "fichaId"); ok && instructorTieneFichaAsignada(c, fichaID) {
			c.Next()
			return
		}
		c.JSON(http.StatusForbidden, gin.H{
			"error": "No tiene permiso para VER ASISTENCIA en asistencia",
		})
		c.Abort()
	}
}

// RequirePermissionVerFichaOrInstructorDeFicha permite GET al código de una ficha si el usuario tiene
// VER FICHA, o VER ASISTENCIA, o es instructor asignado a esa ficha (param "id").
func RequirePermissionVerFichaOrInstructorDeFicha() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method != http.MethodGet {
			c.JSON(http.StatusForbidden, gin.H{"error": "Método no permitido"})
			c.Abort()
			return
		}
		userID, ok := requireAuthenticatedUserID(c)
		if !ok {
			return
		}
		e, err := authz.GetEnforcer(database.GetDB())
		if err == nil {
			sub := strconv.FormatUint(uint64(userID), 10)
			if tryEnforceVerFichaOCodigo(e, sub) {
				c.Next()
				return
			}
		}
		if fichaID, ok := uintFromParam(c, "id"); ok && instructorTieneFichaAsignada(c, fichaID) {
			c.Next()
			return
		}
		c.JSON(http.StatusForbidden, gin.H{"error": "No tiene permiso para ver el código de esta ficha"})
		c.Abort()
	}
}

// RequireSuperAdmin exige que el usuario tenga el rol "SUPER ADMINISTRADOR".
func RequireSuperAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := requireAuthenticatedUserID(c)
		if !ok {
			return
		}
		e, ok := getEnforcerOrAbort(c)
		if !ok {
			return
		}
		sub := strconv.FormatUint(uint64(userID), 10)
		roles, err := authz.GetRolesForUser(e, sub)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": msgErrorVerificandoRol})
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

// RequireSuperAdminOrBienestar permite acceso a dashboard de asistencia y módulo de bienestar
// a usuarios con rol "SUPER ADMINISTRADOR" o "BIENESTAR AL APRENDIZ".
func RequireSuperAdminOrBienestar() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, ok := requireAuthenticatedUserID(c)
		if !ok {
			return
		}
		e, ok := getEnforcerOrAbort(c)
		if !ok {
			return
		}
		sub := strconv.FormatUint(uint64(userID), 10)
		roles, err := authz.GetRolesForUser(e, sub)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": msgErrorVerificandoRol})
			c.Abort()
			return
		}
		for _, r := range roles {
			if r == "SUPER ADMINISTRADOR" || r == "BIENESTAR AL APRENDIZ" {
				c.Next()
				return
			}
		}
		c.JSON(http.StatusForbidden, gin.H{"error": "No tiene rol suficiente para acceder a esta sección"})
		c.Abort()
	}
}
