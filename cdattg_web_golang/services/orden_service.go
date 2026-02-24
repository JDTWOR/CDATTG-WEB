package services

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models/inventario"
	"github.com/sena/cdattg-web-golang/repositories"
	"gorm.io/gorm"
)

type OrdenService interface {
	CreateFromCarrito(req dto.OrdenFromCarritoRequest, personaID uint, userCreateID uint) (*dto.OrdenResponse, error)
	Create(req dto.OrdenStoreRequest, personaID uint, userCreateID uint) (*dto.OrdenResponse, error)
	GetByID(id uint) (*dto.OrdenResponse, error)
	List(limit, offset int, userID *uint, verTodas bool) ([]dto.OrdenResponse, int64, error)
	ListPendientesAprobacion(limit, offset int) ([]dto.OrdenResponse, int64, error)
}

type ordenService struct {
	ordenRepo    repositories.OrdenRepository
	detalleRepo  repositories.DetalleOrdenRepository
	productoRepo repositories.ProductoRepository
	notifSvc     NotificacionService
}

func NewOrdenService() OrdenService {
	return &ordenService{
		ordenRepo:    repositories.NewOrdenRepository(),
		detalleRepo:  repositories.NewDetalleOrdenRepository(),
		productoRepo: repositories.NewProductoRepository(),
		notifSvc:     NewNotificacionService(),
	}
}

func (s *ordenService) CreateFromCarrito(req dto.OrdenFromCarritoRequest, personaID uint, userCreateID uint) (*dto.OrdenResponse, error) {
	if req.Tipo == "prestamo" && (req.FechaDevolucion == nil || !req.FechaDevolucion.After(time.Now().Truncate(24*time.Hour))) {
		return nil, errors.New("para préstamo la fecha de devolución es obligatoria y debe ser posterior a hoy")
	}
	// Validar stock de todos los ítems antes de crear
	for _, item := range req.Carrito {
		prod, err := s.productoRepo.FindByID(item.ProductoID)
		if err != nil || prod == nil {
			return nil, fmt.Errorf("producto %d no encontrado", item.ProductoID)
		}
		disp := 0
		if prod.Cantidad != nil {
			disp = *prod.Cantidad
		}
		if item.Cantidad > disp {
			return nil, fmt.Errorf("stock insuficiente para producto %s: solicitado %d, disponible %d", prod.Name, item.Cantidad, disp)
		}
	}
	db := database.GetDB()
	var orden *inventario.Orden
	err := db.Transaction(func(tx *gorm.DB) error {
		o := inventario.Orden{
			NumeroOrden:         "", // se asigna después
			TipoOrden:           strings.ToUpper(req.Tipo),
			Descripcion:         req.Descripcion,
			FechaOrden:          time.Now(),
			FechaDevolucion:     req.FechaDevolucion,
			Estado:              inventario.OrdenEstadoEnEspera,
			PersonaID:           personaID,
			RolID:               req.RolID,
			ProgramaFormacionID: req.ProgramaFormacionID,
		}
		o.UserCreateID = &userCreateID
		if err := tx.Create(&o).Error; err != nil {
			return err
		}
		o.NumeroOrden = "ORD-" + strconv.FormatUint(uint64(o.ID), 10)
		if err := tx.Save(&o).Error; err != nil {
			return err
		}
		orden = &o
		detalles := make([]inventario.DetalleOrden, 0, len(req.Carrito))
		for _, item := range req.Carrito {
			detalles = append(detalles, inventario.DetalleOrden{
				OrdenID:   o.ID,
				ProductoID: item.ProductoID,
				Cantidad:   item.Cantidad,
				Estado:     inventario.DetalleEstadoEnEspera,
			})
		}
		if err := tx.Create(&detalles).Error; err != nil {
			return err
		}
		orden.DetalleOrdenes = detalles
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("error al crear orden: %w", err)
	}
	s.notifSvc.NotificarNuevaOrden(orden.ID, orden.NumeroOrden)
	orden, _ = s.ordenRepo.FindByID(orden.ID)
	return s.ordenToResponse(orden), nil
}

func (s *ordenService) Create(req dto.OrdenStoreRequest, personaID uint, userCreateID uint) (*dto.OrdenResponse, error) {
	if req.FechaDevolucion != nil && !req.FechaDevolucion.After(time.Now().Truncate(24*time.Hour)) {
		return nil, errors.New("si se envía fecha de devolución debe ser posterior a hoy")
	}
	for _, item := range req.Productos {
		prod, err := s.productoRepo.FindByID(item.ProductoID)
		if err != nil || prod == nil {
			return nil, fmt.Errorf("producto %d no encontrado", item.ProductoID)
		}
		disp := 0
		if prod.Cantidad != nil {
			disp = *prod.Cantidad
		}
		if item.Cantidad > disp {
			return nil, fmt.Errorf("stock insuficiente para producto %s", prod.Name)
		}
	}
	numero, _ := s.ordenRepo.NextNumeroOrden()
	if numero == "" {
		numero = "ORD-1"
	}
	o := inventario.Orden{
		NumeroOrden:   numero,
		TipoOrden:     req.TipoOrden,
		Descripcion:   req.Descripcion,
		FechaOrden:    time.Now(),
		FechaDevolucion: req.FechaDevolucion,
		Estado:        inventario.OrdenEstadoEnEspera,
		PersonaID:     personaID,
	}
	o.UserCreateID = &userCreateID
	if err := s.ordenRepo.Create(&o); err != nil {
		return nil, err
	}
	detalles := make([]inventario.DetalleOrden, 0, len(req.Productos))
	for _, item := range req.Productos {
		detalles = append(detalles, inventario.DetalleOrden{
			OrdenID:   o.ID,
			ProductoID: item.ProductoID,
			Cantidad:   item.Cantidad,
			Estado:     inventario.DetalleEstadoEnEspera,
		})
	}
	if err := s.detalleRepo.CreateBatch(detalles); err != nil {
		return nil, err
	}
	o.DetalleOrdenes = detalles
	s.notifSvc.NotificarNuevaOrden(o.ID, o.NumeroOrden)
	return s.ordenToResponse(&o), nil
}

func (s *ordenService) GetByID(id uint) (*dto.OrdenResponse, error) {
	o, err := s.ordenRepo.FindByID(id)
	if err != nil || o == nil {
		return nil, errors.New("orden no encontrada")
	}
	return s.ordenToResponse(o), nil
}

func (s *ordenService) List(limit, offset int, userID *uint, verTodas bool) ([]dto.OrdenResponse, int64, error) {
	list, total, err := s.ordenRepo.FindAll(limit, offset, userID, verTodas)
	if err != nil {
		return nil, 0, err
	}
	resp := make([]dto.OrdenResponse, len(list))
	for i := range list {
		resp[i] = *s.ordenToResponse(&list[i])
	}
	return resp, total, nil
}

func (s *ordenService) ListPendientesAprobacion(limit, offset int) ([]dto.OrdenResponse, int64, error) {
	list, total, err := s.ordenRepo.FindPendientesAprobacion(limit, offset)
	if err != nil {
		return nil, 0, err
	}
	resp := make([]dto.OrdenResponse, len(list))
	for i := range list {
		resp[i] = *s.ordenToResponse(&list[i])
	}
	return resp, total, nil
}

func (s *ordenService) ordenToResponse(o *inventario.Orden) *dto.OrdenResponse {
	detalles := make([]dto.DetalleOrdenResponse, len(o.DetalleOrdenes))
	for i := range o.DetalleOrdenes {
		d := &o.DetalleOrdenes[i]
		pend := d.Cantidad - d.CantidadDevuelta
		if d.CierraSinStock {
			pend = 0
		}
		nombre := ""
		if d.Producto != nil {
			nombre = d.Producto.Name
		}
		detalles[i] = dto.DetalleOrdenResponse{
			ID:                d.ID,
			OrdenID:           d.OrdenID,
			ProductoID:        d.ProductoID,
			ProductoNombre:    nombre,
			Cantidad:          d.Cantidad,
			CantidadDevuelta:  d.CantidadDevuelta,
			PendienteDevolver: pend,
			Estado:            d.Estado,
			CierraSinStock:    d.CierraSinStock,
		}
	}
	personaNombre := ""
	if o.Persona != nil {
		p := o.Persona
		personaNombre = strings.TrimSpace(p.PrimerNombre + " " + p.SegundoNombre + " " + p.PrimerApellido + " " + p.SegundoApellido)
	}
	return &dto.OrdenResponse{
		ID:              o.ID,
		NumeroOrden:     o.NumeroOrden,
		TipoOrden:       o.TipoOrden,
		Descripcion:     o.Descripcion,
		FechaOrden:      o.FechaOrden,
		FechaDevolucion: o.FechaDevolucion,
		Estado:          o.Estado,
		PersonaID:       o.PersonaID,
		PersonaNombre:   personaNombre,
		DetalleOrdenes:  detalles,
		CreatedAt:       o.CreatedAt,
	}
}
