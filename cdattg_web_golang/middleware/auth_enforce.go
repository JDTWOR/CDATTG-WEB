/**
 * middleware: comprobaciones Casbin reutilizables.
 * @author Cristian Deysdayr Jiménez
 */
package middleware

type enforceFn func(sub, obj, act string) (bool, error)

// enforceOK true si Enforce no falla y concede.
func enforceOK(fn enforceFn, sub, obj, act string) bool {
	allowed, err := fn(sub, obj, act)
	return err == nil && allowed
}

// anyEnforceOK true si alguna acción sobre el objeto está permitida.
func anyEnforceOK(fn enforceFn, sub, obj string, acts []string) bool {
	for _, act := range acts {
		if enforceOK(fn, sub, obj, act) {
			return true
		}
	}
	return false
}
