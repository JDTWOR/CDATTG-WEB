/**
 * services: pruebas de validación del registro público.
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/dto"
)

func TestValidarRegisterRequest(t *testing.T) {
	ok := dto.RegisterRequest{
		NumeroDocumento: "123", FechaNacimiento: "2000-01-15",
		Password: "Clave1234", PasswordConfirm: "Clave1234",
	}
	if err := ValidarRegisterRequest(ok); err != nil {
		t.Fatal(err)
	}
	joven := ok
	joven.FechaNacimiento = "2020-01-01"
	if err := ValidarRegisterRequest(joven); err == nil {
		t.Fatal("menor de 14")
	}
	mismatch := ok
	mismatch.PasswordConfirm = "otra"
	if err := ValidarRegisterRequest(mismatch); err == nil {
		t.Fatal("contraseñas distintas")
	}
	soloLetras := ok
	soloLetras.Password = "sololetras"
	soloLetras.PasswordConfirm = "sololetras"
	if err := ValidarRegisterRequest(soloLetras); err == nil {
		t.Fatal("debe exigir número")
	}
}
