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

type DevolucionService interface {
	Create(req dto.DevolucionCreateRequest, userID uint) (*dto.DevolucionResponse, error)
}

type devolucionService struct {
	detalleRepo  repositories.DetalleOrdenRepository
	productoRepo repositories.ProductoRepository
	devolRepo    repositories.DevolucionRepository
}

func NewDevolucionService() DevolucionService {
	return &devolucionService{
		detalleRepo:  repositories.NewDetalleOrdenRepository(),
		productoRepo: repositories.NewProductoRepository(),
		devolRepo:    repositories.NewDevolucionRepository(),
	}
}

func (s *devolucionService) Create(req dto.DevolucionCreateRequest, userID uint) (*dto.DevolucionResponse, error) {
	detalle, err := s.detalleRepo.FindByID(req.DetalleOrdenID)
	if err != nil || detalle == nil {
		return nil, errors.New("detalle de orden no encontrado")
	}
	if detalle.Estado != inventario.DetalleEstadoAprobada {
		return nil, errors.New("solo se pueden registrar devoluciones sobre detalles aprobados")
	}
	pendiente := detalle.Cantidad - detalle.CantidadDevuelta
	if detalle.CierraSinStock {
		pendiente = 0
	}
	cierreSinStock := req.CierraSinStock || req.CantidadDevuelta == 0
	if cierreSinStock {
		yaCierre, _ := s.devolRepo.ExisteCierreSinStock(req.DetalleOrdenID)
		if yaCierre {
			return nil, errors.New("este detalle ya tiene un cierre sin stock; no se aceptan más devoluciones")
		}
		if req.CantidadDevuelta != 0 {
			return nil, errors.New("cierre sin stock debe ser con cantidad devuelta 0")
		}
		// Solo consumibles y con observaciones obligatorias
		prod, err := s.productoRepo.FindByID(detalle.ProductoID)
		if err != nil || prod == nil {
			return nil, errors.New("producto no encontrado")
		}
		if !prod.EsConsumible {
			return nil, errors.New("el cierre sin stock solo está permitido para productos consumibles")
		}
		if len(req.Observaciones) == 0 {
			return nil, errors.New("las observaciones son obligatorias en cierre sin stock")
		}
	} else {
		if req.CantidadDevuelta > pendiente {
			return nil, fmt.Errorf("la cantidad devuelta no puede superar la pendiente por devolver (%d)", pendiente)
		}
	}

	db := database.GetDB()
	var dev inventario.Devolucion
	err = db.Transaction(func(tx *gorm.DB) error {
		dev = inventario.Devolucion{
			DetalleOrdenID:   req.DetalleOrdenID,
			CantidadDevuelta: req.CantidadDevuelta,
			CierraSinStock:   cierreSinStock,
			FechaDevolucion:  time.Now(),
			Observaciones:    req.Observaciones,
		}
		dev.UserCreateID = &userID
		if err := tx.Create(&dev).Error; err != nil {
			return err
		}
		if req.CantidadDevuelta > 0 {
			var prod inventario.Producto
			if err := tx.First(&prod, detalle.ProductoID).Error; err != nil {
				return err
			}
			nuevaCant := 0
			if prod.Cantidad != nil {
				nuevaCant = *prod.Cantidad
			}
			nuevaCant += req.CantidadDevuelta
			prod.Cantidad = &nuevaCant
			if err := tx.Save(&prod).Error; err != nil {
				return err
			}
		}
		detalle.CantidadDevuelta += req.CantidadDevuelta
		if cierreSinStock {
			detalle.CierraSinStock = true
		}
		return tx.Save(detalle).Error
	})
	if err != nil {
		return nil, err
	}
	return &dto.DevolucionResponse{
		ID:               dev.ID,
		DetalleOrdenID:   dev.DetalleOrdenID,
		CantidadDevuelta: dev.CantidadDevuelta,
		CierraSinStock:   dev.CierraSinStock,
		FechaDevolucion:  dev.FechaDevolucion,
		Observaciones:    dev.Observaciones,
	}, nil
}
