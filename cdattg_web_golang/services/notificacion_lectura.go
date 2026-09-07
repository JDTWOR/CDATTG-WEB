/**
 * Leo, marco leídas y borro las notificaciones del usuario autenticado.
 * Dejo aquí el servicio para la campana y el submódulo de notificaciones.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"github.com/sena/cdattg-web-golang/models/inventario"
	"github.com/sena/cdattg-web-golang/repositories"
)

// NotificacionLecturaService expone las notificaciones al usuario.
type NotificacionLecturaService interface {
	Listar(userID uint, limit, offset int) ([]inventario.Notificacion, int64, error)
	ContarNoLeidas(userID uint) (int64, error)
	MarcarLeida(userID, notificacionID uint) error
	// Eliminar borra una notificación puntual del usuario.
	Eliminar(userID, notificacionID uint) error
	// EliminarTodas vacía el buzón del usuario.
	EliminarTodas(userID uint) error
}

type notificacionLecturaService struct {
	repo repositories.NotificacionRepository
}

// NewNotificacionLecturaService crea el servicio de lectura.
func NewNotificacionLecturaService() NotificacionLecturaService {
	return &notificacionLecturaService{repo: repositories.NewNotificacionRepository()}
}

func (s *notificacionLecturaService) Listar(userID uint, limit, offset int) ([]inventario.Notificacion, int64, error) {
	return s.repo.FindByRecipientUserID(userID, limit, offset)
}

func (s *notificacionLecturaService) ContarNoLeidas(userID uint) (int64, error) {
	return s.repo.CountNoLeidas(userID)
}

func (s *notificacionLecturaService) MarcarLeida(userID, notificacionID uint) error {
	return s.repo.MarcarLeida(notificacionID, userID)
}

func (s *notificacionLecturaService) Eliminar(userID, notificacionID uint) error {
	return s.repo.Eliminar(notificacionID, userID)
}

func (s *notificacionLecturaService) EliminarTodas(userID uint) error {
	return s.repo.EliminarTodas(userID)
}
