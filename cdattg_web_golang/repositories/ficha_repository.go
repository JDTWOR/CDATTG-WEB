package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type FichaRepository interface {
	FindByID(id uint) (*models.FichaCaracterizacion, error)
	FindByIDWithInstructoresAndAprendices(id uint) (*models.FichaCaracterizacion, error)
	FindByFicha(ficha string) (*models.FichaCaracterizacion, error)
	FindAll(page, pageSize int, programaID *uint, instructorID *uint) ([]models.FichaCaracterizacion, int64, error)
	Search(query string) ([]models.FichaCaracterizacion, error)
	Create(ficha *models.FichaCaracterizacion) error
	Update(ficha *models.FichaCaracterizacion) error
	Delete(id uint) error
	ExistsByFicha(ficha string) bool
	ExistsByFichaExcludingID(ficha string, excludeID uint) bool
}

type fichaRepository struct {
	db *gorm.DB
}

func NewFichaRepository() FichaRepository {
	return &fichaRepository{
		db: database.GetDB(),
	}
}

func (r *fichaRepository) FindByID(id uint) (*models.FichaCaracterizacion, error) {
	var ficha models.FichaCaracterizacion
	if err := r.db.Preload("ProgramaFormacion").Preload("ProgramaFormacion.RedConocimiento").
		Preload("Instructor").Preload("Instructor.Persona").
		Preload("Sede").Preload("Ambiente").Preload("ModalidadFormacion").
		Preload("Jornada").
		Preload("FichaDiasFormacion").
		First(&ficha, id).Error; err != nil {
		return nil, err
	}
	return &ficha, nil
}

func (r *fichaRepository) FindByIDWithInstructoresAndAprendices(id uint) (*models.FichaCaracterizacion, error) {
	var ficha models.FichaCaracterizacion
	if err := r.db.Preload("ProgramaFormacion").Preload("Instructor").Preload("Sede").Preload("Ambiente").Preload("ModalidadFormacion").
		Preload("Jornada").Preload("FichaDiasFormacion").
		Preload("InstructorFichas.Instructor.Persona").Preload("InstructorFichas.Competencia").Preload("Aprendices.Persona").
		First(&ficha, id).Error; err != nil {
		return nil, err
	}
	return &ficha, nil
}

func (r *fichaRepository) FindByFicha(ficha string) (*models.FichaCaracterizacion, error) {
	var fichaModel models.FichaCaracterizacion
	if err := r.db.Where("ficha = ?", ficha).First(&fichaModel).Error; err != nil {
		return nil, err
	}
	return &fichaModel, nil
}

func (r *fichaRepository) FindAll(page, pageSize int, programaID *uint, instructorID *uint) ([]models.FichaCaracterizacion, int64, error) {
	var fichas []models.FichaCaracterizacion
	var total int64
	offset := (page - 1) * pageSize
	q := r.db.Model(&models.FichaCaracterizacion{})
	if programaID != nil && *programaID > 0 {
		q = q.Where("programa_formacion_id = ?", *programaID)
	}
	if instructorID != nil && *instructorID > 0 {
		// Incluir fichas donde el instructor está asignado en el pivote
		// o figura como instructor líder directamente en la ficha.
		q = q.Where(
			"(id IN (SELECT ficha_id FROM instructor_fichas_caracterizacion WHERE instructor_id = ?) OR instructor_id = ?)",
			*instructorID, *instructorID,
		)
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	findQ := r.db.Preload("ProgramaFormacion").Preload("Instructor").Preload("Ambiente").Preload("Sede").Preload("ModalidadFormacion").Preload("Jornada")
	if programaID != nil && *programaID > 0 {
		findQ = findQ.Where("programa_formacion_id = ?", *programaID)
	}
	if instructorID != nil && *instructorID > 0 {
		findQ = findQ.Where(
			"(id IN (SELECT ficha_id FROM instructor_fichas_caracterizacion WHERE instructor_id = ?) OR instructor_id = ?)",
			*instructorID, *instructorID,
		)
	}
	if err := findQ.Offset(offset).Limit(pageSize).Find(&fichas).Error; err != nil {
		return nil, 0, err
	}
	return fichas, total, nil
}

func (r *fichaRepository) Search(query string) ([]models.FichaCaracterizacion, error) {
	var fichas []models.FichaCaracterizacion
	searchPattern := "%" + query + "%"
	
	if err := r.db.Where("ficha LIKE ?", searchPattern).
		Or("id IN (SELECT id FROM programas_formacion WHERE nombre LIKE ?)", searchPattern).
		Preload("ProgramaFormacion").Find(&fichas).Error; err != nil {
		return nil, err
	}
	
	return fichas, nil
}

func (r *fichaRepository) Create(ficha *models.FichaCaracterizacion) error {
	return r.db.Create(ficha).Error
}

func (r *fichaRepository) Update(ficha *models.FichaCaracterizacion) error {
	return r.db.Save(ficha).Error
}

func (r *fichaRepository) Delete(id uint) error {
	return r.db.Delete(&models.FichaCaracterizacion{}, id).Error
}

func (r *fichaRepository) ExistsByFicha(ficha string) bool {
	var count int64
	r.db.Model(&models.FichaCaracterizacion{}).Where("ficha = ?", ficha).Count(&count)
	return count > 0
}

func (r *fichaRepository) ExistsByFichaExcludingID(ficha string, excludeID uint) bool {
	var count int64
	r.db.Model(&models.FichaCaracterizacion{}).Where("ficha = ? AND id != ?", ficha, excludeID).Count(&count)
	return count > 0
}
