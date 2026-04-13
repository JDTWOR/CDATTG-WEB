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

const (
	errMsgDetalleOrdenNoEncontrado     = "detalle de orden no encontrado"
	errMsgSoloDetallesAprobados        = "solo se pueden registrar devoluciones sobre detalles aprobados"
	errMsgCierreSinStockDuplicado      = "este detalle ya tiene un cierre sin stock; no se aceptan más devoluciones"
	errMsgCierreSinStockCantidadCero   = "cierre sin stock debe ser con cantidad devuelta 0"
	errMsgProductoNoEncontrado         = "producto no encontrado"
	errMsgCierreSoloConsumibles        = "el cierre sin stock solo está permitido para productos consumibles"
	errMsgObservacionesObligatorias    = "las observaciones son obligatorias en cierre sin stock"
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
		return nil, errors.New(errMsgDetalleOrdenNoEncontrado)
	}
	if err := validarEstadoDetalleParaDevolucion(detalle); err != nil {
		return nil, err
	}
	pendiente := pendientePorDevolver(detalle)
	cierreSinStock := req.CierraSinStock || req.CantidadDevuelta == 0
	if err := s.validarReglasDevolucion(req, detalle, pendiente, cierreSinStock); err != nil {
		return nil, err
	}

	db := database.GetDB()
	var dev inventario.Devolucion
	err = db.Transaction(func(tx *gorm.DB) error {
		return s.persistirDevolucionEnTx(tx, &dev, req, detalle, userID, cierreSinStock)
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

func validarEstadoDetalleParaDevolucion(detalle *inventario.DetalleOrden) error {
	if detalle.Estado != inventario.DetalleEstadoAprobada {
		return errors.New(errMsgSoloDetallesAprobados)
	}
	return nil
}

func pendientePorDevolver(detalle *inventario.DetalleOrden) int {
	pendiente := detalle.Cantidad - detalle.CantidadDevuelta
	if detalle.CierraSinStock {
		pendiente = 0
	}
	return pendiente
}

func (s *devolucionService) validarReglasDevolucion(req dto.DevolucionCreateRequest, detalle *inventario.DetalleOrden, pendiente int, cierreSinStock bool) error {
	if cierreSinStock {
		return s.validarCierreSinStock(req, detalle)
	}
	if req.CantidadDevuelta > pendiente {
		return fmt.Errorf("la cantidad devuelta no puede superar la pendiente por devolver (%d)", pendiente)
	}
	return nil
}

func (s *devolucionService) validarCierreSinStock(req dto.DevolucionCreateRequest, detalle *inventario.DetalleOrden) error {
	yaCierre, _ := s.devolRepo.ExisteCierreSinStock(req.DetalleOrdenID)
	if yaCierre {
		return errors.New(errMsgCierreSinStockDuplicado)
	}
	if req.CantidadDevuelta != 0 {
		return errors.New(errMsgCierreSinStockCantidadCero)
	}
	prod, err := s.productoRepo.FindByID(detalle.ProductoID)
	if err != nil || prod == nil {
		return errors.New(errMsgProductoNoEncontrado)
	}
	if !prod.EsConsumible {
		return errors.New(errMsgCierreSoloConsumibles)
	}
	if len(req.Observaciones) == 0 {
		return errors.New(errMsgObservacionesObligatorias)
	}
	return nil
}

func (s *devolucionService) persistirDevolucionEnTx(tx *gorm.DB, dev *inventario.Devolucion, req dto.DevolucionCreateRequest, detalle *inventario.DetalleOrden, userID uint, cierreSinStock bool) error {
	*dev = inventario.Devolucion{
		DetalleOrdenID:   req.DetalleOrdenID,
		CantidadDevuelta: req.CantidadDevuelta,
		CierraSinStock:   cierreSinStock,
		FechaDevolucion:  time.Now(),
		Observaciones:    req.Observaciones,
	}
	dev.UserCreateID = &userID
	if err := tx.Create(dev).Error; err != nil {
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
}
