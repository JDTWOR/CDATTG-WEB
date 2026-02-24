package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// CatalogoRepository expone catálogos para formularios
type CatalogoRepository interface {
	FindSedes() ([]models.Sede, error)
	FindAmbientes() ([]models.Ambiente, error)
	FindModalidadesFormacion() ([]models.ModalidadFormacion, error)
	FindJornadas() ([]models.Jornada, error)
	FindJornadaByID(id uint) (*models.Jornada, error)
	FindDiasFormacion() ([]models.DiasFormacion, error)
	FindPaises() ([]models.Pais, error)
	FindDepartamentosByPais(paisID uint) ([]models.Departamento, error)
	FindMunicipiosByDepartamento(departamentoID uint) ([]models.Municipio, error)
	FindTiposDocumento() ([]models.TipoDocumento, error)
	FindGeneros() ([]models.Genero, error)
	FindPersonaCaracterizacion() ([]models.PersonaCaracterizacion, error)
	FindRegionales() ([]models.Regional, error)
	FindNivelesFormacion() ([]models.NivelFormacion, error)
	FindTiposPrograma() ([]models.TipoPrograma, error)
}

type catalogoRepository struct {
	db *gorm.DB
}

func NewCatalogoRepository() CatalogoRepository {
	return &catalogoRepository{db: database.GetDB()}
}

func (r *catalogoRepository) FindSedes() ([]models.Sede, error) {
	var list []models.Sede
	if err := r.db.Where("status = ?", true).Order("nombre").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *catalogoRepository) FindAmbientes() ([]models.Ambiente, error) {
	var list []models.Ambiente
	if err := r.db.Where("status = ?", true).Preload("Piso").Order("nombre").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *catalogoRepository) FindModalidadesFormacion() ([]models.ModalidadFormacion, error) {
	var list []models.ModalidadFormacion
	if err := r.db.Where("status = ?", true).Order("nombre").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *catalogoRepository) FindJornadas() ([]models.Jornada, error) {
	var list []models.Jornada
	if err := r.db.Order("nombre").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *catalogoRepository) FindJornadaByID(id uint) (*models.Jornada, error) {
	var m models.Jornada
	if err := r.db.First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *catalogoRepository) FindDiasFormacion() ([]models.DiasFormacion, error) {
	var list []models.DiasFormacion
	if err := r.db.Where("status = ?", true).Order("id").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *catalogoRepository) FindRegionales() ([]models.Regional, error) {
	var list []models.Regional
	if err := r.db.Order("nombre").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *catalogoRepository) FindPaises() ([]models.Pais, error) {
	var list []models.Pais
	if err := r.db.Order("nombre").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *catalogoRepository) FindDepartamentosByPais(paisID uint) ([]models.Departamento, error) {
	var list []models.Departamento
	if err := r.db.Where("pais_id = ?", paisID).Order("nombre").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *catalogoRepository) FindMunicipiosByDepartamento(departamentoID uint) ([]models.Municipio, error) {
	var list []models.Municipio
	if err := r.db.Where("departamento_id = ?", departamentoID).Order("nombre").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *catalogoRepository) FindTiposDocumento() ([]models.TipoDocumento, error) {
	var list []models.TipoDocumento
	if err := r.db.Order("nombre").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *catalogoRepository) FindGeneros() ([]models.Genero, error) {
	var list []models.Genero
	if err := r.db.Order("nombre").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *catalogoRepository) FindPersonaCaracterizacion() ([]models.PersonaCaracterizacion, error) {
	var list []models.PersonaCaracterizacion
	if err := r.db.Order("nombre").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *catalogoRepository) FindNivelesFormacion() ([]models.NivelFormacion, error) {
	var list []models.NivelFormacion
	if err := r.db.Order("nombre").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *catalogoRepository) FindTiposPrograma() ([]models.TipoPrograma, error) {
	var list []models.TipoPrograma
	if err := r.db.Order("nombre").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}
