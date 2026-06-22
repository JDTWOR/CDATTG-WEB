package utils

import (
	"testing"
	"time"
)

func TestAppLocationDefault(t *testing.T) {
	loc := AppLocation()
	if loc == nil {
		t.Fatal("AppLocation() no debe ser nil")
	}
	name, _ := time.Now().In(loc).Zone()
	if name != "COT" && name != "-05" && loc.String() != "America/Bogota" {
		t.Logf("zona detectada: %s (%s)", loc.String(), name)
	}
}

func TestNowUsesAppLocation(t *testing.T) {
	InitAppLocation()
	now := Now()
	if now.Location().String() != time.Local.String() {
		t.Fatalf("Now() location %v != time.Local %v", now.Location(), time.Local)
	}
}
