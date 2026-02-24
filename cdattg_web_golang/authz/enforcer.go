package authz

import (
	"path/filepath"
	"runtime"
	"sync"

	"github.com/casbin/casbin/v3"
	"github.com/casbin/casbin/v3/model"
	gormadapter "github.com/casbin/gorm-adapter/v3"
	"gorm.io/gorm"
)

var (
	enforcer *casbin.Enforcer
	once     sync.Once
)

// GetEnforcer devuelve el enforcer de Casbin (singleton).
func GetEnforcer(db *gorm.DB) (*casbin.Enforcer, error) {
	var err error
	once.Do(func() {
		adapter, aErr := gormadapter.NewAdapterByDB(db)
		if aErr != nil {
			err = aErr
			return
		}

		modelPath := modelPath()
		enforcer, err = casbin.NewEnforcer(modelPath, adapter)
		if err != nil {
			return
		}

		if err = enforcer.LoadPolicy(); err != nil {
			return
		}
	})
	return enforcer, err
}

// MustGetEnforcer devuelve el enforcer o panic.
func MustGetEnforcer(db *gorm.DB) *casbin.Enforcer {
	e, err := GetEnforcer(db)
	if err != nil {
		panic(err)
	}
	return e
}

func modelPath() string {
	_, b, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(b), "model.conf")
}

// Enforce verifica si el sujeto (userID como string) tiene permiso para (obj, act).
func Enforce(e *casbin.Enforcer, sub string, obj, act string) (bool, error) {
	return e.Enforce(sub, obj, act)
}

// AddRoleForUser asigna un rol a un usuario (g, userID, roleName).
func AddRoleForUser(e *casbin.Enforcer, userID, roleName string) (bool, error) {
	return e.AddRoleForUser(userID, roleName)
}

// AddPermissionForRole añade permiso (obj, act) para el rol (p, roleName, obj, act).
func AddPermissionForRole(e *casbin.Enforcer, roleName, obj, act string) (bool, error) {
	return e.AddPolicy(roleName, obj, act)
}

// RemoveFilteredPolicyForRole elimina políticas donde (roleName, obj) coinciden (act cualquiera).
func RemoveFilteredPolicyForRole(e *casbin.Enforcer, roleName, obj string) (bool, error) {
	return e.RemoveFilteredPolicy(0, roleName, obj)
}

// AddPermissionForRoleWildcard añade permiso * * para el rol (super admin).
func AddPermissionForRoleWildcard(e *casbin.Enforcer, roleName string) (bool, error) {
	return e.AddPolicy(roleName, "*", "*")
}

// GetRolesForUser devuelve los roles del usuario.
func GetRolesForUser(e *casbin.Enforcer, userID string) ([]string, error) {
	return e.GetRolesForUser(userID)
}

const policyDirect = "p2"

// AddPermissionForUser asigna permiso directo al usuario (p2). Para que el admin dé permisos sin rol.
func AddPermissionForUser(e *casbin.Enforcer, userID, obj, act string) (bool, error) {
	return e.AddNamedPolicy(policyDirect, userID, obj, act)
}

// RemovePermissionForUser quita el permiso directo (p2) del usuario.
func RemovePermissionForUser(e *casbin.Enforcer, userID, obj, act string) (bool, error) {
	return e.RemoveNamedPolicy(policyDirect, userID, obj, act)
}

// GetDirectPermissionsForUser devuelve los (obj, act) asignados directamente al usuario (p2).
func GetDirectPermissionsForUser(e *casbin.Enforcer, userID string) [][]string {
	rules, _ := e.GetFilteredNamedPolicy(policyDirect, 0, userID)
	return rules
}

// GetAllPermissionsForUser devuelve todos los nombres de permiso (act) que tiene el usuario:
// por roles (p) y por asignación directa (p2). Sin duplicados, para login/respuesta API.
func GetAllPermissionsForUser(e *casbin.Enforcer, userID string) ([]string, error) {
	seen := make(map[string]bool)
	roles, err := e.GetRolesForUser(userID)
	if err != nil {
		return nil, err
	}
	for _, role := range roles {
		rules, _ := e.GetFilteredPolicy(0, role)
		for _, r := range rules {
			if len(r) >= 3 {
				seen[r[2]] = true // act
			}
		}
	}
	p2Rules, _ := e.GetFilteredNamedPolicy(policyDirect, 0, userID)
	for _, r := range p2Rules {
		if len(r) >= 3 {
			seen[r[2]] = true
		}
	}
	out := make([]string, 0, len(seen))
	for k := range seen {
		out = append(out, k)
	}
	return out, nil
}

// DeleteRolesForUser quita todos los roles del usuario (g). Útil antes de reasignar.
func DeleteRolesForUser(e *casbin.Enforcer, userID string) (bool, error) {
	return e.DeleteUser(userID)
}

// NewModelFromString crea un modelo Casbin desde string (por si se quiere cargar sin archivo).
func NewModelFromString() (model.Model, error) {
	text := `
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act
p2 = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = (g(r.sub, p.sub) && (r.obj == p.obj || p.obj == "*") && (r.act == p.act || p.act == "*")) || (r.sub == p2.sub && (r.obj == p2.obj || p2.obj == "*") && (r.act == p2.act || p2.act == "*"))
`
	return model.NewModelFromString(text)
}
