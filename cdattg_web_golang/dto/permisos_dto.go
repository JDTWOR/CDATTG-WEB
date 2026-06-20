package dto

// UsuarioListItem para listado de pantalla permisos
type UsuarioListItem struct {
	ID        uint   `json:"id"`
	Email     string `json:"email"`
	FullName  string `json:"full_name"`
	Documento string `json:"numero_documento"`
	Status    bool   `json:"status"`
	Roles     []string `json:"roles"`
}

// UsuarioPermisosResponse roles y permisos de un usuario (desde Casbin)
type UsuarioPermisosResponse struct {
	UserID      uint          `json:"user_id"`
	Email       string        `json:"email,omitempty"`
	FullName    string        `json:"full_name,omitempty"`
	Documento   string        `json:"numero_documento,omitempty"`
	Status      bool          `json:"status"`
	Roles       []string      `json:"roles"`
	Permisos    []string      `json:"permisos"`     // nombres de permiso (act) que tiene
	Directos    []PermisoPair `json:"directos"`     // permisos asignados directamente (p2)
}

// PermisoPair obj + act (permiso directo)
type PermisoPair struct {
	Obj string `json:"obj"`
	Act string `json:"act"`
}

// AsignarPermisoRequest body para asignar permiso directo
type AsignarPermisoRequest struct {
	Obj string `json:"obj" binding:"required"`
	Act string `json:"act" binding:"required"`
}

// SetRolesRequest body para reemplazar roles (solo SUPER ADMIN)
type SetRolesRequest struct {
	Roles []string `json:"roles" binding:"required"`
}

// UsuarioRegionalesResponse regionales asignadas a un usuario coordinador.
type UsuarioRegionalesResponse struct {
	UserID      uint                `json:"user_id"`
	RegionalIDs []uint              `json:"regional_ids"`
	Regionales  []RegionalListItem  `json:"regionales"`
}

// SetUsuarioRegionalesRequest body para reemplazar regionales de un usuario.
type SetUsuarioRegionalesRequest struct {
	RegionalIDs []uint `json:"regional_ids" binding:"required"`
}

// RegionalListItem ítem de catálogo regional.
type RegionalListItem struct {
	ID     uint   `json:"id"`
	Nombre string `json:"nombre"`
	Codigo string `json:"codigo,omitempty"`
}

// DefinicionesPermisosResponse lista de (obj, act) y roles válidos para la UI
type DefinicionesPermisosResponse struct {
	Roles      []string      `json:"roles"`
	Permisos   []PermisoPair `json:"permisos"`
}
