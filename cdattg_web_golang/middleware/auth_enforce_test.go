/**
 * middleware: pruebas de comprobaciones Casbin.
 * @author Cristian Deysdayr Jiménez
 */
package middleware

import (
	"errors"
	"testing"
)

func TestEnforceOK(t *testing.T) {
	ok := func(_, _, act string) (bool, error) {
		return act == "VER", nil
	}
	if !enforceOK(ok, "1", "ficha", "VER") {
		t.Fatal("debería permitir")
	}
	if enforceOK(ok, "1", "ficha", "NO") {
		t.Fatal("no debería permitir")
	}
	falla := func(_, _, _ string) (bool, error) {
		return true, errors.New("casbin")
	}
	if enforceOK(falla, "1", "ficha", "VER") {
		t.Fatal("error no concede")
	}
}

func TestAnyEnforceOK(t *testing.T) {
	fn := func(_, _, act string) (bool, error) {
		return act == "EDITAR", nil
	}
	if !anyEnforceOK(fn, "1", "ficha", []string{"VER", "EDITAR"}) {
		t.Fatal("debería hallar EDITAR")
	}
	if anyEnforceOK(fn, "1", "ficha", []string{"VER"}) {
		t.Fatal("ninguna acción válida")
	}
}
