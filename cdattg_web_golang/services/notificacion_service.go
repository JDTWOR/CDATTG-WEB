package services

import (
	"strconv"

	"github.com/sena/cdattg-web-golang/config"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models/inventario"
	"github.com/sena/cdattg-web-golang/repositories"
)

// NotificacionService crea notificaciones (nueva orden, aprobación/rechazo, stock bajo).
type NotificacionService interface {
	NotificarNuevaOrden(ordenID uint, numeroOrden string)
	NotificarOrdenAprobadaRechazada(ordenID uint, aprobada bool, motivo string, recipientUserID uint)
	NotificarStockBajo(productoID uint, productoNombre string, cantidad int)
}

type notificacionService struct {
	notifRepo repositories.NotificacionRepository
}

func NewNotificacionService() NotificacionService {
	return &notificacionService{notifRepo: repositories.NewNotificacionRepository()}
}

func (s *notificacionService) NotificarNuevaOrden(ordenID uint, numeroOrden string) {
	n := inventario.Notificacion{
		NotificableType: "Orden",
		NotificableID:   ordenID,
		RecipientUserID: nil,
		Tipo:            "NUEVA_ORDEN",
		Titulo:          "Nueva orden de inventario",
		Mensaje:         "Se ha creado la orden " + numeroOrden + ". Pendiente de aprobación.",
	}
	_ = s.notifRepo.Create(&n)
}

func (s *notificacionService) NotificarOrdenAprobadaRechazada(ordenID uint, aprobada bool, motivo string, recipientUserID uint) {
	tipo := "ORDEN_APROBADA"
	titulo := "Orden aprobada"
	mensaje := "Su orden ha sido aprobada."
	if !aprobada {
		tipo = "ORDEN_RECHAZADA"
		titulo = "Orden rechazada"
		mensaje = "Su orden ha sido rechazada."
		if motivo != "" {
			mensaje += " Motivo: " + motivo
		}
	}
	n := inventario.Notificacion{
		NotificableType: "Orden",
		NotificableID:   ordenID,
		RecipientUserID: &recipientUserID,
		Tipo:            tipo,
		Titulo:          titulo,
		Mensaje:         mensaje,
	}
	_ = s.notifRepo.Create(&n)
}

func (s *notificacionService) NotificarStockBajo(productoID uint, productoNombre string, cantidad int) {
	if config.AppConfig == nil || !config.AppConfig.Inventario.NotificarStockBajo {
		return
	}
	db := database.GetDB()
	// Usuarios con rol ADMINISTRADOR o SUPER ADMINISTRADOR (Casbin: ptype=g, v0=userID, v1=role)
	var v0Strings []string
	if err := db.Raw("SELECT DISTINCT v0 FROM casbin_rule WHERE ptype = ? AND v1 IN ?", "g", []string{"ADMINISTRADOR", "SUPER ADMINISTRADOR"}).Pluck("v0", &v0Strings).Error; err != nil {
		return
	}
	for _, sID := range v0Strings {
		uid64, err := strconv.ParseUint(sID, 10, 64)
		if err != nil {
			continue
		}
		uid := uint(uid64)
		n := inventario.Notificacion{
			NotificableType: "Producto",
			NotificableID:   productoID,
			RecipientUserID: &uid,
			Tipo:             "STOCK_BAJO",
			Titulo:           "Stock bajo",
			Mensaje:          "El producto " + productoNombre + " tiene stock bajo (cantidad: " + strconv.Itoa(cantidad) + ").",
		}
		_ = s.notifRepo.Create(&n)
	}
}
