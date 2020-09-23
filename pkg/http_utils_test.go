package memo

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestHTTPQ(t *testing.T) {
	assert.Equal(t, []httpQ{
		{Q: 1.0, V: "text/html"},
		{Q: 1.0, V: "application/xhtml+xml"},
		{Q: 0.9, V: "application/xml"},
		{Q: 0.8, V: "*/*"},
	}, parseQuoting("text/html,application/xhtml+xml,*/*;q=0.8,application/xml;q=0.9"))
}
