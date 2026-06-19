package services

import "testing"

func TestGetMisInasistencias_sinPersonaID(t *testing.T) {
	s := NewAsistenciaService()
	_, err := s.GetMisInasistencias(0, 30)
	if err == nil {
		t.Fatal("expected error for personaID 0")
	}
	if err.Error() != errMsgAprendizActivoNoEncontrado {
		t.Fatalf("expected %q, got %q", errMsgAprendizActivoNoEncontrado, err.Error())
	}
}
