package services

import "testing"

func TestNormalizeHoraMM(t *testing.T) {
	t.Parallel()
	cases := []struct {
		in, want string
	}{
		{"06:30", "06:30"},
		{"06:30:00", "06:30"},
		{"06:30:00+00", "06:30"},
		{"0001-01-01T06:30:00Z", "06:30"},
		{"0001-01-01T02:30:00Z", "02:30"},
		{"", ""},
		{"0001-", ""},
	}
	for _, tc := range cases {
		if got := normalizeHoraMM(tc.in); got != tc.want {
			t.Errorf("normalizeHoraMM(%q) = %q, want %q", tc.in, got, tc.want)
		}
	}
}
