package dto

// LoginRequest representa la solicitud de login (Email puede ser correo, documento o celular)
type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse representa la respuesta de login
type LoginResponse struct {
	Token       string       `json:"token"`
	Type        string       `json:"type"`
	User        UserResponse `json:"user"`
	Roles       []string     `json:"roles"`
	Permissions []string     `json:"permissions"`
}

// UserResponse representa la información del usuario
type UserResponse struct {
	ID        uint   `json:"id"`
	Email     string `json:"email"`
	FullName  string `json:"full_name"`
	Status    bool   `json:"status"`
	PersonaID *uint  `json:"persona_id"`
}

// ChangePasswordRequest solicitud para cambiar contraseña (usuario autenticado)
type ChangePasswordRequest struct {
	PasswordActual string `json:"password_actual" binding:"required"`
	PasswordNueva  string `json:"password_nueva" binding:"required,min=6"`
}
