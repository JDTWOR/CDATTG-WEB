package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models/inventario"
	"gorm.io/gorm"
)

type NotificacionRepository interface {
	Create(n *inventario.Notificacion) error
	FindByID(id uint) (*inventario.Notificacion, error)
	FindByRecipientUserID(userID uint, limit, offset int) ([]inventario.Notificacion, int64, error)
	MarcarLeida(id uint, userID uint) error
	CountNoLeidas(userID uint) (int64, error)
}

type notificacionRepository struct {
	db *gorm.DB
}

func NewNotificacionRepository() NotificacionRepository {
	return &notificacionRepository{db: database.GetDB()}
}

func (r *notificacionRepository) Create(n *inventario.Notificacion) error {
	return r.db.Create(n).Error
}

func (r *notificacionRepository) FindByID(id uint) (*inventario.Notificacion, error) {
	var m inventario.Notificacion
	if err := r.db.First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *notificacionRepository) FindByRecipientUserID(userID uint, limit, offset int) ([]inventario.Notificacion, int64, error) {
	q := r.db.Model(&inventario.Notificacion{}).Where("recipient_user_id = ?", userID)
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var list []inventario.Notificacion
	if err := r.db.Where("recipient_user_id = ?", userID).Order("created_at DESC").Limit(limit).Offset(offset).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *notificacionRepository) MarcarLeida(id uint, userID uint) error {
	return r.db.Model(&inventario.Notificacion{}).Where("id = ? AND recipient_user_id = ?", id, userID).Update("leida_en", gorm.Expr("NOW()")).Error
}

func (r *notificacionRepository) CountNoLeidas(userID uint) (int64, error) {
	var n int64
	err := r.db.Model(&inventario.Notificacion{}).Where("recipient_user_id = ? AND leida_en IS NULL", userID).Count(&n).Error
	return n, err
}
