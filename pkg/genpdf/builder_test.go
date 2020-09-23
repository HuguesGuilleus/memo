package genpdf

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestStringLimit(t *testing.T) {
	assert.Equal(t, "éco", stringLimit("école", 3))
	assert.Equal(t, "école", stringLimit("école", 10))
}
