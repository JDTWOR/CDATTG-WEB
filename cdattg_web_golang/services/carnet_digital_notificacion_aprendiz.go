/**
 * Aviso al aprendiz cuando el instructor aprueba o devuelve su solicitud de
 * carnet digital, con el motivo que dio al devolverla.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/models/inventario"
)

// ResultadoAprendiz avisa al aprendiz cuando su carnet se aprobó o devolvió.
func (n *CarnetDigitalNotificacion) ResultadoAprendiz(sol *models.CarnetSolicitud, aprobada bool) {
	uid := n.userIDDePersona(sol.PersonaID)
	if uid == 0 {
		return
	}
	tipo := "CARNET_DIGITAL_APROBADO"
	titulo := "Carnet digital aprobado"
	mensaje := "Su carnet digital de la ficha " + sol.FichaNumero + " fue aprobado por el instructor."
	if !aprobada {
		tipo = "CARNET_DIGITAL_DEVUELTO"
		titulo = "Carnet digital devuelto"
		mensaje = "Su solicitud de carnet digital de la ficha " + sol.FichaNumero + " fue devuelta por el instructor."
		if sol.MotivoRechazo != "" {
			mensaje += " Motivo: " + sol.MotivoRechazo
		}
	}
	_ = n.notifRepo.Create(&inventario.Notificacion{
		NotificableType: "CarnetDigital",
		NotificableID:   sol.ID,
		RecipientUserID: &uid,
		Tipo:            tipo,
		Titulo:          titulo,
		Mensaje:         mensaje,
		Data:            "{}",
	})
}
