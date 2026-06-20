package models

// UsuarioRegional vincula un usuario (coordinador) con una o más regionales (N:M).
type UsuarioRegional struct {
	UserID     uint `gorm:"primaryKey;column:user_id" json:"user_id"`
	RegionalID uint `gorm:"primaryKey;column:regional_id" json:"regional_id"`

	User     *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Regional *Regional `gorm:"foreignKey:RegionalID" json:"regional,omitempty"`
}

func (UsuarioRegional) TableName() string {
	return "usuario_regionales"
}
