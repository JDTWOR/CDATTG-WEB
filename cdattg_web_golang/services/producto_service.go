package services

import (
	"errors"
	"fmt"
	"strings"

	"github.com/sena/cdattg-web-golang/config"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models/inventario"
	"github.com/sena/cdattg-web-golang/repositories"
)

type ProductoService interface {
	Create(req dto.ProductoCreateRequest, userCreateID uint) (*dto.ProductoResponse, error)
	Update(id uint, req dto.ProductoUpdateRequest) (*dto.ProductoResponse, error)
	GetByID(id uint) (*dto.ProductoResponse, error)
	List(limit, offset int) ([]dto.ProductoResponse, int64, error)
	Delete(id uint) error
}

type productoService struct {
	repo      repositories.ProductoRepository
	catRepo   repositories.CategoriaRepository
	marcaRepo repositories.MarcaRepository
	provRepo  repositories.ProveedorRepository
	contRepo  repositories.ContratoConvenioRepository
	notifSvc  NotificacionService
}

func NewProductoService() ProductoService {
	return &productoService{
		repo:      repositories.NewProductoRepository(),
		catRepo:   repositories.NewCategoriaRepository(),
		marcaRepo: repositories.NewMarcaRepository(),
		provRepo:  repositories.NewProveedorRepository(),
		contRepo:  repositories.NewContratoConvenioRepository(),
		notifSvc:  NewNotificacionService(),
	}
}

func (s *productoService) Create(req dto.ProductoCreateRequest, userCreateID uint) (*dto.ProductoResponse, error) {
	// Nombre único y en mayúsculas (documentación)
	name := strings.TrimSpace(strings.ToUpper(req.Name))
	if name == "" {
		return nil, errors.New("el nombre es obligatorio")
	}
	exist, _ := s.repo.FindByName(name)
	if exist != nil {
		return nil, fmt.Errorf("ya existe un producto con el nombre %s", name)
	}
	// Cantidad inicial ≥ 1
	if req.Cantidad == nil || *req.Cantidad < 1 {
		return nil, errors.New("la cantidad inicial debe ser al menos 1")
	}
	// Proveedor obligatorio en creación
	if req.ProveedorID == nil {
		return nil, errors.New("el proveedor es obligatorio")
	}
	cant := *req.Cantidad
	peso := 0.0
	if req.Peso != nil && *req.Peso >= 0 {
		peso = *req.Peso
	}
	p := inventario.Producto{
		Name:               name,
		TipoProductoID:      req.TipoProductoID,
		Descripcion:        req.Descripcion,
		Peso:               &peso,
		UnidadMedidaID:     req.UnidadMedidaID,
		Cantidad:           &cant,
		CodigoBarras:       req.CodigoBarras,
		EstadoProductoID:   req.EstadoProductoID,
		CategoriaID:        req.CategoriaID,
		MarcaID:            req.MarcaID,
		ContratoConvenioID: req.ContratoConvenioID,
		AmbienteID:         req.AmbienteID,
		ProveedorID:        req.ProveedorID,
		FechaVencimiento:   req.FechaVencimiento,
		EsConsumible:       false, // puede venir en DTO si se agrega
	}
	p.UserCreateID = &userCreateID
	if err := s.repo.Create(&p); err != nil {
		return nil, fmt.Errorf("error al crear producto: %w", err)
	}
	return s.toResponse(&p), nil
}

func (s *productoService) Update(id uint, req dto.ProductoUpdateRequest) (*dto.ProductoResponse, error) {
	p, err := s.repo.FindByID(id)
	if err != nil || p == nil {
		return nil, errors.New("producto no encontrado")
	}
	name := strings.TrimSpace(strings.ToUpper(req.Name))
	if name == "" {
		return nil, errors.New("el nombre es obligatorio")
	}
	exist, _ := s.repo.FindByName(name)
	if exist != nil && exist.ID != id {
		return nil, fmt.Errorf("ya existe otro producto con el nombre %s", name)
	}
	// Cantidad ≥ 0 en actualización
	if req.Cantidad != nil && *req.Cantidad < 0 {
		return nil, errors.New("la cantidad no puede ser negativa")
	}
	p.Name = name
	p.TipoProductoID = req.TipoProductoID
	p.Descripcion = req.Descripcion
	p.UnidadMedidaID = req.UnidadMedidaID
	p.CodigoBarras = req.CodigoBarras
	p.EstadoProductoID = req.EstadoProductoID
	p.CategoriaID = req.CategoriaID
	p.MarcaID = req.MarcaID
	p.ContratoConvenioID = req.ContratoConvenioID
	p.AmbienteID = req.AmbienteID
	if req.Peso != nil && *req.Peso >= 0 {
		p.Peso = req.Peso
	}
	if req.Cantidad != nil {
		p.Cantidad = req.Cantidad
	}
	if req.ProveedorID != nil {
		p.ProveedorID = req.ProveedorID
	}
	if req.FechaVencimiento != nil {
		p.FechaVencimiento = req.FechaVencimiento
	}
	if err := s.repo.Update(p); err != nil {
		return nil, fmt.Errorf("error al actualizar producto: %w", err)
	}
	if config.AppConfig != nil && config.AppConfig.Inventario.NotificarStockBajo && p.Cantidad != nil && *p.Cantidad < config.AppConfig.Inventario.UmbralMinimo {
		s.notifSvc.NotificarStockBajo(p.ID, p.Name, *p.Cantidad)
	}
	return s.toResponse(p), nil
}

func (s *productoService) GetByID(id uint) (*dto.ProductoResponse, error) {
	p, err := s.repo.FindByID(id)
	if err != nil || p == nil {
		return nil, errors.New("producto no encontrado")
	}
	return s.toResponse(p), nil
}

func (s *productoService) List(limit, offset int) ([]dto.ProductoResponse, int64, error) {
	list, total, err := s.repo.FindAll(limit, offset)
	if err != nil {
		return nil, 0, err
	}
	resp := make([]dto.ProductoResponse, len(list))
	for i := range list {
		resp[i] = *s.toResponse(&list[i])
	}
	return resp, total, nil
}

func (s *productoService) Delete(id uint) error {
	p, err := s.repo.FindByID(id)
	if err != nil || p == nil {
		return errors.New("producto no encontrado")
	}
	return s.repo.Delete(p)
}

func (s *productoService) toResponse(p *inventario.Producto) *dto.ProductoResponse {
	cant := 0
	if p.Cantidad != nil {
		cant = *p.Cantidad
	}
	nivel := "normal"
	if config.AppConfig != nil {
		cfg := config.AppConfig.Inventario
		if cfg.UmbralCritico > 0 && cant < cfg.UmbralCritico {
			nivel = "critico"
		} else if cfg.UmbralMinimo > 0 && cant < cfg.UmbralMinimo {
			nivel = "bajo"
		} else if cfg.UmbralMinimo > 0 && cant >= cfg.UmbralMinimo*2 {
			nivel = "alto"
		}
	}
	return &dto.ProductoResponse{
		ID:                 p.ID,
		Name:               p.Name,
		TipoProductoID:     p.TipoProductoID,
		Descripcion:        p.Descripcion,
		Peso:               p.Peso,
		UnidadMedidaID:     p.UnidadMedidaID,
		Cantidad:           cant,
		CodigoBarras:       p.CodigoBarras,
		EstadoProductoID:   p.EstadoProductoID,
		CategoriaID:        p.CategoriaID,
		MarcaID:            p.MarcaID,
		ContratoConvenioID: p.ContratoConvenioID,
		AmbienteID:         p.AmbienteID,
		ProveedorID:        p.ProveedorID,
		Imagen:             p.Imagen,
		NivelStock:         nivel,
	}
}
