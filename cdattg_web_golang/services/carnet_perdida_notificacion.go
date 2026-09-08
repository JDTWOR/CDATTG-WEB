/**
 * Creo las notificaciones del submódulo de pérdida de carnet.
 * Reutilizo el modelo Notificacion de inventario y su repositorio; la tabla
 * notificaciones la garantiza el patch schema_patch_notificaciones.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"strconv"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/models/inventario"
	"github.com/sena/cdattg-web-golang/repositories"
)

// CarnetPerdidaNotificacion escribe los avisos del flujo.
type CarnetPerdidaNotificacion struct {
	notifRepo repositories.NotificacionRepository
	userRepo  repositories.UserRepository
}

// NewCarnetPerdidaNotificacion crea el notificador.
func NewCarnetPerdidaNotificacion() *CarnetPerdidaNotificacion {
	return &CarnetPerdidaNotificacion{
		notifRepo: repositories.NewNotificacionRepository(),
		userRepo:  repositories.NewUserRepository(),
	}
}

// NuevaSolicitud avisa a bibliotecario y super administradores.
func (n *CarnetPerdidaNotificacion) NuevaSolicitud(sol *models.CarnetPerdidaSolicitud) {
	for _, id := range usuariosDeRoles("BIBLIOTECARIO", "SUPER ADMINISTRADOR") {
		uid := id
		notif := inventario.Notificacion{
			NotificableType: "CarnetPerdida",
			NotificableID:   sol.ID,
			RecipientUserID: &uid,
			Tipo:            "NUEVA_REPOSICION_CARNET",
			Titulo:          "Solicitud de carnet por pérdida",
			Mensaje:         sol.Nombres + " " + sol.Apellidos + " solicita la reposición del carnet físico.",
			// La columna data es json y no acepta vacío; guardo un objeto mínimo.
			Data: "{}",
		}
		_ = n.notifRepo.Create(&notif)
	}
}

// ResultadoAprendiz avisa al aprendiz cuando el bibliotecario decide.
func (n *CarnetPerdidaNotificacion) ResultadoAprendiz(sol *models.CarnetPerdidaSolicitud, aprobada bool) {
	user, err := n.userRepo.FindByPersonaID(sol.PersonaID)
	if err != nil || user == nil {
		return
	}
	tipo := "REPOSICION_CARNET_ACEPTADA"
	titulo := "Solicitud aceptada"
	mensaje := "Su solicitud de reposición pasó a espera de renovación física."
	if !aprobada {
		tipo = "REPOSICION_CARNET_DEVUELTA"
		titulo = "Solicitud devuelta"
		mensaje = "Su solicitud de reposición fue devuelta."
		if sol.MotivoRechazo != "" {
			mensaje += " Motivo: " + sol.MotivoRechazo
		}
	}
	uid := user.ID
	_ = n.notifRepo.Create(&inventario.Notificacion{
		NotificableType: "CarnetPerdida",
		NotificableID:   sol.ID,
		RecipientUserID: &uid,
		Tipo:            tipo,
		Titulo:          titulo,
		Mensaje:         mensaje,
		Data:            "{}",
	})
}

// Renovada avisa al aprendiz que su carnet físico ya fue renovado y está listo.
func (n *CarnetPerdidaNotificacion) Renovada(sol *models.CarnetPerdidaSolicitud) {
	user, err := n.userRepo.FindByPersonaID(sol.PersonaID)
	if err != nil || user == nil {
		return
	}
	uid := user.ID
	_ = n.notifRepo.Create(&inventario.Notificacion{
		NotificableType: "CarnetPerdida",
		NotificableID:   sol.ID,
		RecipientUserID: &uid,
		Tipo:            "REPOSICION_CARNET_RENOVADA",
		Titulo:          "Carnet renovado",
		Mensaje:         "Su reposición fue renovada: el carnet físico quedó listo para recoger.",
		Data:            "{}",
	})
}

// Disponible avisa al aprendiz que ya puede pasar por la biblioteca a recoger
// su carnet renovado. No cambia el estado de la solicitud.
func (n *CarnetPerdidaNotificacion) Disponible(sol *models.CarnetPerdidaSolicitud) {
	user, err := n.userRepo.FindByPersonaID(sol.PersonaID)
	if err != nil || user == nil {
		return
	}
	uid := user.ID
	_ = n.notifRepo.Create(&inventario.Notificacion{
		NotificableType: "CarnetPerdida",
		NotificableID:   sol.ID,
		RecipientUserID: &uid,
		Tipo:            "REPOSICION_CARNET_DISPONIBLE",
		Titulo:          "Carnet listo para recoger",
		Mensaje:         "Su carnet renovado está listo: puede pasar por la biblioteca a recogerlo.",
		Data:            "{}",
	})
}

// usuariosDeRoles lista los user ids con algún rol dado (Casbin ptype=g).
func usuariosDeRoles(roles ...string) []uint {
	db := database.GetDB()
	var subjects []string
	if err := db.Raw(
		"SELECT DISTINCT v0 FROM casbin_rule WHERE ptype = ? AND v1 IN ?",
		"g", roles,
	).Pluck("v0", &subjects).Error; err != nil {
		return nil
	}
	out := make([]uint, 0, len(subjects))
	for _, s := range subjects {
		id64, err := strconv.ParseUint(s, 10, 64)
		if err != nil {
			continue
		}
		out = append(out, uint(id64))
	}
	return out
}
