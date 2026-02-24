package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models/inventario"
	"github.com/sena/cdattg-web-golang/repositories"
	"gorm.io/gorm"
)

type AprobacionService interface {
	AprobarRechazar(req dto.AprobarRechazarRequest, userID uint) error
}

type aprobacionService struct {
	ordenRepo    repositories.OrdenRepository
	detalleRepo  repositories.DetalleOrdenRepository
	productoRepo repositories.ProductoRepository
	aprobRepo    repositories.AprobacionRepository
	notifSvc     NotificacionService
}

func NewAprobacionService() AprobacionService {
	return &aprobacionService{
		ordenRepo:    repositories.NewOrdenRepository(),
		detalleRepo:  repositories.NewDetalleOrdenRepository(),
		productoRepo: repositories.NewProductoRepository(),
		aprobRepo:    repositories.NewAprobacionRepository(),
		notifSvc:     NewNotificacionService(),
	}
}

func (s *aprobacionService) AprobarRechazar(req dto.AprobarRechazarRequest, userID uint) error {
	orden, err := s.ordenRepo.FindByID(req.OrdenID)
	if err != nil || orden == nil {
		return errors.New("orden no encontrada")
	}
	estadoAprobacion := "RECHAZADA"
	if req.Aprobar {
		estadoAprobacion = "APROBADA"
	}

	db := database.GetDB()
	txErr := db.Transaction(func(tx *gorm.DB) error {
		if req.DetalleOrdenID != nil {
			return s.aprobarRechazarDetalle(tx, *req.DetalleOrdenID, req.OrdenID, req.Aprobar, req.Observaciones, userID, estadoAprobacion)
		}
		detalles, err := s.detalleRepo.FindEnEsperaByOrdenID(req.OrdenID)
		if err != nil {
			return err
		}
		if len(detalles) == 0 {
			return errors.New("no hay detalles en espera para esta orden")
		}
		if req.Aprobar {
			for i := range detalles {
				prod, _ := s.productoRepo.FindByID(detalles[i].ProductoID)
				disp := 0
				if prod != nil && prod.Cantidad != nil {
					disp = *prod.Cantidad
				}
				if detalles[i].Cantidad > disp {
					return fmt.Errorf("stock insuficiente para producto del detalle %d", detalles[i].ID)
				}
			}
		}
		for i := range detalles {
			if err := s.aprobarRechazarDetalleTx(tx, detalles[i].ID, req.OrdenID, req.Aprobar, req.Observaciones, userID, estadoAprobacion); err != nil {
				return err
			}
		}
		return nil
	})
	if txErr != nil {
		return txErr
	}
	if orden.UserCreateID != nil {
		s.notifSvc.NotificarOrdenAprobadaRechazada(req.OrdenID, req.Aprobar, req.Observaciones, *orden.UserCreateID)
	}
	return nil
}

func (s *aprobacionService) aprobarRechazarDetalle(tx *gorm.DB, detalleOrdenID, ordenID uint, aprobar bool, observaciones string, userID uint, estadoAprobacion string) error {
	return s.aprobarRechazarDetalleTx(tx, detalleOrdenID, ordenID, aprobar, observaciones, userID, estadoAprobacion)
}

func (s *aprobacionService) aprobarRechazarDetalleTx(tx *gorm.DB, detalleOrdenID, ordenID uint, aprobar bool, observaciones string, userID uint, estadoAprobacion string) error {
	var d inventario.DetalleOrden
	if err := tx.First(&d, detalleOrdenID).Error; err != nil {
		return errors.New("detalle de orden no encontrado")
	}
	if d.OrdenID != ordenID {
		return errors.New("el detalle no pertenece a la orden")
	}
	if d.Estado != inventario.DetalleEstadoEnEspera {
		return errors.New("el detalle no está en espera de aprobación")
	}
	existe, _ := s.aprobRepo.ExisteAprobacionParaDetalle(detalleOrdenID)
	if existe {
		return errors.New("el detalle ya tiene un registro de aprobación")
	}
	if aprobar {
		var prod inventario.Producto
		if err := tx.First(&prod, d.ProductoID).Error; err != nil {
			return err
		}
		disp := 0
		if prod.Cantidad != nil {
			disp = *prod.Cantidad
		}
		if d.Cantidad > disp {
			return fmt.Errorf("stock insuficiente: disponible %d, solicitado %d", disp, d.Cantidad)
		}
		nuevaCant := disp - d.Cantidad
		prod.Cantidad = &nuevaCant
		if err := tx.Save(&prod).Error; err != nil {
			return err
		}
		d.Estado = inventario.DetalleEstadoAprobada
	} else {
		d.Estado = inventario.DetalleEstadoRechazada
	}
	if err := tx.Save(&d).Error; err != nil {
		return err
	}
	a := inventario.Aprobacion{
		OrdenID:         ordenID,
		DetalleOrdenID:  &detalleOrdenID,
		UserID:          userID,
		Estado:          estadoAprobacion,
		FechaAprobacion: time.Now(),
		Observaciones:   observaciones,
	}
	return tx.Create(&a).Error
}
