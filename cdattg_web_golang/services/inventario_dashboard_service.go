package services

import (
	"github.com/sena/cdattg-web-golang/config"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/repositories"
)

type InventarioDashboardService interface {
	GetDashboard() (*dto.InventarioDashboardResponse, error)
}

type inventarioDashboardService struct {
	productoRepo repositories.ProductoRepository
	ordenRepo    repositories.OrdenRepository
}

func NewInventarioDashboardService() InventarioDashboardService {
	return &inventarioDashboardService{
		productoRepo: repositories.NewProductoRepository(),
		ordenRepo:    repositories.NewOrdenRepository(),
	}
}

func (s *inventarioDashboardService) GetDashboard() (*dto.InventarioDashboardResponse, error) {
	totalProd, _ := s.productoRepo.CountTotal()
	stockBajo := int64(0)
	stockCritico := int64(0)
	if config.AppConfig != nil {
		cfg := config.AppConfig.Inventario
		stockBajo, _ = s.productoRepo.CountStockBajo(cfg.UmbralMinimo)
		stockCritico, _ = s.productoRepo.CountStockCritico(cfg.UmbralCritico)
	}
	ordenesEnEspera, _ := s.ordenRepo.CountEnEspera()
	ordenesHoy, _ := s.ordenRepo.CountHoy()
	return &dto.InventarioDashboardResponse{
		TotalProductos:   int(totalProd),
		StockBajo:        int(stockBajo),
		StockCritico:     int(stockCritico),
		OrdenesEnEspera:  ordenesEnEspera,
		OrdenesHoy:       ordenesHoy,
	}, nil
}
