package services

import (
	"errors"
	"fmt"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models/inventario"
	"github.com/sena/cdattg-web-golang/repositories"
)

// ProveedorService CRUD con regla: no eliminar si tiene productos (o contratos) asociados
type ProveedorService interface {
	List(limit, offset int) ([]dto.ProveedorResponse, int64, error)
	GetByID(id uint) (*dto.ProveedorResponse, error)
	Create(req dto.ProveedorCreateRequest) (*dto.ProveedorResponse, error)
	Update(id uint, req dto.ProveedorUpdateRequest) (*dto.ProveedorResponse, error)
	Delete(id uint) error
}

type proveedorService struct {
	repo repositories.ProveedorRepository
}

func NewProveedorService() ProveedorService {
	return &proveedorService{repo: repositories.NewProveedorRepository()}
}

func (s *proveedorService) List(limit, offset int) ([]dto.ProveedorResponse, int64, error) {
	list, total, err := s.repo.FindAll(limit, offset)
	if err != nil {
		return nil, 0, err
	}
	resp := make([]dto.ProveedorResponse, len(list))
	for i := range list {
		resp[i] = dto.ProveedorResponse{ID: list[i].ID, Name: list[i].Name, NIT: list[i].NIT, Status: list[i].Status}
	}
	return resp, total, nil
}

func (s *proveedorService) GetByID(id uint) (*dto.ProveedorResponse, error) {
	p, err := s.repo.FindByID(id)
	if err != nil || p == nil {
		return nil, errors.New("proveedor no encontrado")
	}
	return &dto.ProveedorResponse{ID: p.ID, Name: p.Name, NIT: p.NIT, Status: p.Status}, nil
}

func (s *proveedorService) Create(req dto.ProveedorCreateRequest) (*dto.ProveedorResponse, error) {
	status := true
	if req.Status != nil {
		status = *req.Status
	}
	p := inventario.Proveedor{Name: req.Name, NIT: req.NIT, Status: status}
	if err := s.repo.Create(&p); err != nil {
		return nil, err
	}
	return &dto.ProveedorResponse{ID: p.ID, Name: p.Name, NIT: p.NIT, Status: p.Status}, nil
}

func (s *proveedorService) Update(id uint, req dto.ProveedorUpdateRequest) (*dto.ProveedorResponse, error) {
	p, err := s.repo.FindByID(id)
	if err != nil || p == nil {
		return nil, errors.New("proveedor no encontrado")
	}
	p.Name = req.Name
	p.NIT = req.NIT
	if req.Status != nil {
		p.Status = *req.Status
	}
	if err := s.repo.Update(p); err != nil {
		return nil, err
	}
	return &dto.ProveedorResponse{ID: p.ID, Name: p.Name, NIT: p.NIT, Status: p.Status}, nil
}

func (s *proveedorService) Delete(id uint) error {
	p, err := s.repo.FindByID(id)
	if err != nil || p == nil {
		return errors.New("proveedor no encontrado")
	}
	n, _ := s.repo.CountProductos(id)
	if n > 0 {
		return fmt.Errorf("no se puede eliminar: tiene %d producto(s) asociado(s)", n)
	}
	return s.repo.Delete(p)
}

// CategoriaService no eliminar si tiene productos
type CategoriaService interface {
	List() ([]dto.CategoriaResponse, error)
	GetByID(id uint) (*dto.CategoriaResponse, error)
	Create(req dto.CategoriaCreateRequest) (*dto.CategoriaResponse, error)
	Update(id uint, req dto.CategoriaUpdateRequest) (*dto.CategoriaResponse, error)
	Delete(id uint) error
}

type categoriaService struct {
	repo repositories.CategoriaRepository
}

func NewCategoriaService() CategoriaService {
	return &categoriaService{repo: repositories.NewCategoriaRepository()}
}

func (s *categoriaService) List() ([]dto.CategoriaResponse, error) {
	list, err := s.repo.FindAll()
	if err != nil {
		return nil, err
	}
	resp := make([]dto.CategoriaResponse, len(list))
	for i := range list {
		resp[i] = dto.CategoriaResponse{ID: list[i].ID, Name: list[i].Name, Status: list[i].Status}
	}
	return resp, nil
}

func (s *categoriaService) GetByID(id uint) (*dto.CategoriaResponse, error) {
	c, err := s.repo.FindByID(id)
	if err != nil || c == nil {
		return nil, errors.New("categoría no encontrada")
	}
	return &dto.CategoriaResponse{ID: c.ID, Name: c.Name, Status: c.Status}, nil
}

func (s *categoriaService) Create(req dto.CategoriaCreateRequest) (*dto.CategoriaResponse, error) {
	status := true
	if req.Status != nil {
		status = *req.Status
	}
	c := inventario.Categoria{Name: req.Name, Status: status}
	if err := s.repo.Create(&c); err != nil {
		return nil, err
	}
	return &dto.CategoriaResponse{ID: c.ID, Name: c.Name, Status: c.Status}, nil
}

func (s *categoriaService) Update(id uint, req dto.CategoriaUpdateRequest) (*dto.CategoriaResponse, error) {
	c, err := s.repo.FindByID(id)
	if err != nil || c == nil {
		return nil, errors.New("categoría no encontrada")
	}
	c.Name = req.Name
	if req.Status != nil {
		c.Status = *req.Status
	}
	if err := s.repo.Update(c); err != nil {
		return nil, err
	}
	return &dto.CategoriaResponse{ID: c.ID, Name: c.Name, Status: c.Status}, nil
}

func (s *categoriaService) Delete(id uint) error {
	c, err := s.repo.FindByID(id)
	if err != nil || c == nil {
		return errors.New("categoría no encontrada")
	}
	n, _ := s.repo.CountProductos(id)
	if n > 0 {
		return fmt.Errorf("no se puede eliminar: tiene %d producto(s) asociado(s)", n)
	}
	return s.repo.Delete(c)
}

// MarcaService no eliminar si tiene productos
type MarcaService interface {
	List() ([]dto.MarcaResponse, error)
	GetByID(id uint) (*dto.MarcaResponse, error)
	Create(req dto.MarcaCreateRequest) (*dto.MarcaResponse, error)
	Update(id uint, req dto.MarcaUpdateRequest) (*dto.MarcaResponse, error)
	Delete(id uint) error
}

type marcaService struct {
	repo repositories.MarcaRepository
}

func NewMarcaService() MarcaService {
	return &marcaService{repo: repositories.NewMarcaRepository()}
}

func (s *marcaService) List() ([]dto.MarcaResponse, error) {
	list, err := s.repo.FindAll()
	if err != nil {
		return nil, err
	}
	resp := make([]dto.MarcaResponse, len(list))
	for i := range list {
		resp[i] = dto.MarcaResponse{ID: list[i].ID, Name: list[i].Name, Status: list[i].Status}
	}
	return resp, nil
}

func (s *marcaService) GetByID(id uint) (*dto.MarcaResponse, error) {
	m, err := s.repo.FindByID(id)
	if err != nil || m == nil {
		return nil, errors.New("marca no encontrada")
	}
	return &dto.MarcaResponse{ID: m.ID, Name: m.Name, Status: m.Status}, nil
}

func (s *marcaService) Create(req dto.MarcaCreateRequest) (*dto.MarcaResponse, error) {
	status := true
	if req.Status != nil {
		status = *req.Status
	}
	m := inventario.Marca{Name: req.Name, Status: status}
	if err := s.repo.Create(&m); err != nil {
		return nil, err
	}
	return &dto.MarcaResponse{ID: m.ID, Name: m.Name, Status: m.Status}, nil
}

func (s *marcaService) Update(id uint, req dto.MarcaUpdateRequest) (*dto.MarcaResponse, error) {
	m, err := s.repo.FindByID(id)
	if err != nil || m == nil {
		return nil, errors.New("marca no encontrada")
	}
	m.Name = req.Name
	if req.Status != nil {
		m.Status = *req.Status
	}
	if err := s.repo.Update(m); err != nil {
		return nil, err
	}
	return &dto.MarcaResponse{ID: m.ID, Name: m.Name, Status: m.Status}, nil
}

func (s *marcaService) Delete(id uint) error {
	m, err := s.repo.FindByID(id)
	if err != nil || m == nil {
		return errors.New("marca no encontrada")
	}
	n, _ := s.repo.CountProductos(id)
	if n > 0 {
		return fmt.Errorf("no se puede eliminar: tiene %d producto(s) asociado(s)", n)
	}
	return s.repo.Delete(m)
}

// ContratoConvenioService no eliminar si tiene productos
type ContratoConvenioService interface {
	List(limit, offset int) ([]dto.ContratoConvenioResponse, int64, error)
	GetByID(id uint) (*dto.ContratoConvenioResponse, error)
	Create(req dto.ContratoConvenioCreateRequest) (*dto.ContratoConvenioResponse, error)
	Update(id uint, req dto.ContratoConvenioUpdateRequest) (*dto.ContratoConvenioResponse, error)
	Delete(id uint) error
}

type contratoConvenioService struct {
	repo repositories.ContratoConvenioRepository
}

func NewContratoConvenioService() ContratoConvenioService {
	return &contratoConvenioService{repo: repositories.NewContratoConvenioRepository()}
}

func (s *contratoConvenioService) List(limit, offset int) ([]dto.ContratoConvenioResponse, int64, error) {
	list, total, err := s.repo.FindAll(limit, offset)
	if err != nil {
		return nil, 0, err
	}
	resp := make([]dto.ContratoConvenioResponse, len(list))
	for i := range list {
		resp[i] = dto.ContratoConvenioResponse{
			ID:             list[i].ID,
			NumeroContrato: list[i].NumeroContrato,
			Nombre:         list[i].Nombre,
			FechaInicio:    list[i].FechaInicio,
			FechaFin:       list[i].FechaFin,
			Status:         list[i].Status,
		}
	}
	return resp, total, nil
}

func (s *contratoConvenioService) GetByID(id uint) (*dto.ContratoConvenioResponse, error) {
	c, err := s.repo.FindByID(id)
	if err != nil || c == nil {
		return nil, errors.New("contrato/convenio no encontrado")
	}
	return &dto.ContratoConvenioResponse{
		ID:             c.ID,
		NumeroContrato: c.NumeroContrato,
		Nombre:         c.Nombre,
		FechaInicio:    c.FechaInicio,
		FechaFin:       c.FechaFin,
		Status:         c.Status,
	}, nil
}

func (s *contratoConvenioService) Create(req dto.ContratoConvenioCreateRequest) (*dto.ContratoConvenioResponse, error) {
	status := true
	if req.Status != nil {
		status = *req.Status
	}
	c := inventario.ContratoConvenio{
		NumeroContrato: req.NumeroContrato,
		Nombre:         req.Nombre,
		FechaInicio:    req.FechaInicio,
		FechaFin:       req.FechaFin,
		Status:         status,
	}
	if err := s.repo.Create(&c); err != nil {
		return nil, err
	}
	return &dto.ContratoConvenioResponse{
		ID:             c.ID,
		NumeroContrato: c.NumeroContrato,
		Nombre:         c.Nombre,
		FechaInicio:    c.FechaInicio,
		FechaFin:       c.FechaFin,
		Status:         c.Status,
	}, nil
}

func (s *contratoConvenioService) Update(id uint, req dto.ContratoConvenioUpdateRequest) (*dto.ContratoConvenioResponse, error) {
	c, err := s.repo.FindByID(id)
	if err != nil || c == nil {
		return nil, errors.New("contrato/convenio no encontrado")
	}
	c.NumeroContrato = req.NumeroContrato
	c.Nombre = req.Nombre
	c.FechaInicio = req.FechaInicio
	c.FechaFin = req.FechaFin
	if req.Status != nil {
		c.Status = *req.Status
	}
	if err := s.repo.Update(c); err != nil {
		return nil, err
	}
	return &dto.ContratoConvenioResponse{
		ID:             c.ID,
		NumeroContrato: c.NumeroContrato,
		Nombre:         c.Nombre,
		FechaInicio:    c.FechaInicio,
		FechaFin:       c.FechaFin,
		Status:         c.Status,
	}, nil
}

func (s *contratoConvenioService) Delete(id uint) error {
	c, err := s.repo.FindByID(id)
	if err != nil || c == nil {
		return errors.New("contrato/convenio no encontrado")
	}
	n, _ := s.repo.CountProductos(id)
	if n > 0 {
		return fmt.Errorf("no se puede eliminar: tiene %d producto(s) asociado(s)", n)
	}
	return s.repo.Delete(c)
}
