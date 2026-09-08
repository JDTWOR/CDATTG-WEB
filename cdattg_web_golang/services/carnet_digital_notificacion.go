/**
 * Creo la notificación que avisa al instructor líder de la ficha cuando llega
 * una solicitud de carnet digital por revisar.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/models/inventario"
	"github.com/sena/cdattg-web-golang/repositories"
)

// CarnetDigitalNotificacion escribe los avisos del carnet digital.
type CarnetDigitalNotificacion struct {
	notifRepo repositories.NotificacionRepository
	userRepo  repositories.UserRepository
}

// NewCarnetDigitalNotificacion crea el notificador del carnet digital.
func NewCarnetDigitalNotificacion() *CarnetDigitalNotificacion {
	return &CarnetDigitalNotificacion{
		notifRepo: repositories.NewNotificacionRepository(),
		userRepo:  repositories.NewUserRepository(),
	}
}

// PresionaID pasa de persona a user id, o 0 si el instructor no tiene usuario.
func (n *CarnetDigitalNotificacion) userIDDePersona(personaID uint) uint {
	user, err := n.userRepo.FindByPersonaID(personaID)
	if err != nil || user == nil {
		return 0
	}
	return user.ID
}

// SolicitudPendiente avisa al instructor líder que hay un carnet por revisar.
// Recibe la persona del líder porque la ficha guarda su instructor, no su user.
func (n *CarnetDigitalNotificacion) SolicitudPendiente(sol *models.CarnetSolicitud, liderPersonaID uint) {
	uid := n.userIDDePersona(liderPersonaID)
	if uid == 0 {
		return
	}
	_ = n.notifRepo.Create(&inventario.Notificacion{
		NotificableType: "CarnetDigital",
		NotificableID:   sol.ID,
		RecipientUserID: &uid,
		Tipo:            "SOLICITUD_CARNET_DIGITAL",
		Titulo:          "Carnet digital por revisar",
		Mensaje:         sol.Nombres + " " + sol.Apellidos + " solicitó el carnet digital de la ficha " + sol.FichaNumero + ". Revíselo.",
		Data:            "{}",
	})
}
