package utils

import (
	"testing"
)

func TestHashPassword(t *testing.T) {
	password := "miClaveSegura123"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}
	if hash == "" || hash == password {
		t.Error("el hash no debe estar vacío ni ser igual a la contraseña en claro")
	}
	// Mismo input debe producir hash distinto (bcrypt usa salt)
	hash2, _ := HashPassword(password)
	if hash == hash2 {
		t.Error("se esperaba que dos hashes del mismo password fueran distintos (salt)")
	}
}

func TestCheckPasswordHash(t *testing.T) {
	password := "otraClave456"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}
	if !CheckPasswordHash(password, hash) {
		t.Error("CheckPasswordHash debe ser true para la contraseña correcta")
	}
	if CheckPasswordHash("otraClave457", hash) {
		t.Error("CheckPasswordHash debe ser false para contraseña incorrecta")
	}
	if CheckPasswordHash("", hash) {
		t.Error("contraseña vacía no debe coincidir")
	}
}
