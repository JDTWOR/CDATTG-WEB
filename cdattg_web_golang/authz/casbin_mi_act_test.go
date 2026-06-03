package authz_test

import (
	"testing"

	casbin "github.com/casbin/casbin/v3"
	"github.com/sena/cdattg-web-golang/authz"
)

func TestCasbinRoleAndDirectPermissions(t *testing.T) {
	e, err := casbin.NewEnforcer("model.conf")
	if err != nil {
		t.Fatal(err)
	}
	_, _ = e.AddPolicy("INSTRUCTOR", "asistencia", "VER MI AGENDA")
	_, _ = e.AddPolicy("INSTRUCTOR", "asistencia", "VER ASISTENCIA")
	_, _ = e.AddGroupingPolicy("5", "INSTRUCTOR")
	_, _ = authz.AddPermissionForUser(e, "99", "asistencia", "VER MI AGENDA")

	for _, tc := range []struct {
		sub, obj, act string
		want          bool
	}{
		{"5", "asistencia", "VER MI AGENDA", true},
		{"5", "asistencia", "VER ASISTENCIA", true},
		{"99", "asistencia", "VER MI AGENDA", true},
		{"99", "asistencia", "VER ASISTENCIA", false},
	} {
		ok, errEnf := authz.Enforce(e, tc.sub, tc.obj, tc.act)
		if errEnf != nil {
			t.Fatalf("%s/%s/%s err=%v", tc.sub, tc.obj, tc.act, errEnf)
		}
		if ok != tc.want {
			t.Fatalf("%s/%s/%s got=%v want=%v", tc.sub, tc.obj, tc.act, ok, tc.want)
		}
	}
}
