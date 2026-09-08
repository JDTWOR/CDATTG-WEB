/**
 * Pruebo leer la foto propuesta en un cambio pendiente.
 * Uso stubs para no depender de la base de datos.
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"bytes"
	"errors"
	"os"
	"path/filepath"
	"testing"

	"github.com/sena/cdattg-web-golang/models"
)

type stubCambioPendienteRepo struct {
	cambio *models.PersonaCambioPendiente
	err    error
}

func (s *stubCambioPendienteRepo) Create(cambio *models.PersonaCambioPendiente) error { return s.err }
func (s *stubCambioPendienteRepo) FindByID(id uint) (*models.PersonaCambioPendiente, error) {
	return s.cambio, s.err
}
func (s *stubCambioPendienteRepo) FindByPersonaID(personaID uint) (*models.PersonaCambioPendiente, error) {
	return s.cambio, s.err
}
func (s *stubCambioPendienteRepo) ListarPendientes() ([]models.PersonaCambioPendiente, error) {
	return nil, s.err
}
func (s *stubCambioPendienteRepo) Aprobar(id uint, validadorID uint) error { return s.err }
func (s *stubCambioPendienteRepo) Rechazar(id uint, validadorID uint, motivo string) error {
	return s.err
}

func TestLeerFotoCambioPendiente(t *testing.T) {
	repo := &stubCambioPendienteRepo{}
	svc := &personaCambioPendienteService{repo: repo}

	t.Run("sin foto propuesta", func(t *testing.T) {
		repo.cambio = &models.PersonaCambioPendiente{FotoPath: ""}
		if _, err := svc.LeerFoto(1); err != errPersonaFotoAusente {
			t.Fatalf("esperaba ausente, got %v", err)
		}
	})

	t.Run("cambio no existe", func(t *testing.T) {
		repo.cambio = nil
		repo.err = errors.New("no rows")
		if _, err := svc.LeerFoto(99); err == nil || err.Error() != "cambio pendiente no encontrado" {
			t.Fatalf("esperaba error de no encontrado, got %v", err)
		}
	})

	t.Run("lee los bytes de la foto", func(t *testing.T) {
		jpeg := []byte{0xFF, 0xD8, 0xFF, 0xE0, 0x00}
		tmp := filepath.Join(t.TempDir(), "pendiente.jpg")
		if err := os.WriteFile(tmp, jpeg, 0o600); err != nil {
			t.Fatal(err)
		}
		repo.cambio = &models.PersonaCambioPendiente{FotoPath: tmp}
		repo.err = nil
		arch, err := svc.LeerFoto(1)
		if err != nil {
			t.Fatalf("inesperado error: %v", err)
		}
		if arch.ContentType != "image/jpeg" || !bytes.Equal(arch.Bytes, jpeg) {
			t.Fatalf("foto corrupta: %#v", arch)
		}
	})
}