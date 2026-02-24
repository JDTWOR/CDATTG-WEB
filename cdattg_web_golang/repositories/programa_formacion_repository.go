package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type ProgramaFormacionRepository interface {
	FindByID(id uint) (*models.ProgramaFormacion, error)
	FindFirstByNombreContaining(nombre string) (*models.ProgramaFormacion, error)
	FindAll(page, pageSize int, search string) ([]models.ProgramaFormacion, int64, error)
	Create(p *models.ProgramaFormacion) error
	Update(p *models.ProgramaFormacion) error
	Delete(id uint) error
	ExistsByCodigo(codigo string) bool
	ExistsByCodigoExcludingID(codigo string, excludeID uint) bool
}

type programaFormacionRepository struct {
	db *gorm.DB
}

func NewProgramaFormacionRepository() ProgramaFormacionRepository {
	return &programaFormacionRepository{db: database.GetDB()}
}

func (r *programaFormacionRepository) FindByID(id uint) (*models.ProgramaFormacion, error) {
	var p models.ProgramaFormacion
	if err := r.db.Preload("RedConocimiento").First(&p, id).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *programaFormacionRepository) FindFirstByNombreContaining(nombre string) (*models.ProgramaFormacion, error) {
	var p models.ProgramaFormacion
	pat := "%" + nombre + "%"
	if err := r.db.Where("nombre ILIKE ?", pat).First(&p).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *programaFormacionRepository) FindAll(page, pageSize int, search string) ([]models.ProgramaFormacion, int64, error) {
	var list []models.ProgramaFormacion
	var total int64
	base := r.db.Model(&models.ProgramaFormacion{})
	if search != "" {
		pat := "%" + search + "%"
		base = base.Where("codigo ILIKE ? OR nombre ILIKE ?", pat, pat)
	}
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * pageSize
	q := r.db.Preload("RedConocimiento")
	if search != "" {
		pat := "%" + search + "%"
		q = q.Where("codigo ILIKE ? OR nombre ILIKE ?", pat, pat)
	}
	if err := q.Offset(offset).Limit(pageSize).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *programaFormacionRepository) Create(p *models.ProgramaFormacion) error {
	return r.db.Create(p).Error
}

func (r *programaFormacionRepository) Update(p *models.ProgramaFormacion) error {
	return r.db.Save(p).Error
}

func (r *programaFormacionRepository) Delete(id uint) error {
	return r.db.Delete(&models.ProgramaFormacion{}, id).Error
}

func (r *programaFormacionRepository) ExistsByCodigo(codigo string) bool {
	var count int64
	r.db.Model(&models.ProgramaFormacion{}).Where("codigo = ?", codigo).Count(&count)
	return count > 0
}

func (r *programaFormacionRepository) ExistsByCodigoExcludingID(codigo string, excludeID uint) bool {
	var count int64
	r.db.Model(&models.ProgramaFormacion{}).Where("codigo = ? AND id != ?", codigo, excludeID).Count(&count)
	return count > 0
}
