// Arveto Memo
// BSD 3-Clause License
// Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved.

package genpdf

import (
	"bytes"
	"fmt"
	"github.com/signintech/gopdf"
	"strings"
	"time"
)

// All Public fields are required.
type Config struct {
	isInit      bool
	Font        []byte
	FontSize    int
	mapGlyph    gopdf.MapOfCharacterToGlyphIndex
	FontName    string
	RuneReplace rune
	TabLen      int     // width of a tabulation
	LineLen     int     // max line size
	PageLen     int     // The number of line into a page
	LineBreak   float64 // Line size
	HeadRune    rune    // The rune line to separate head and body.
	headLine    string

	// The margins
	MarginH, MarginV float64

	// Return the header in one line. If nil a other function will be used
	head func(page int, sum int) string

	// This function it's called in CreatePDF() and the result at each line
	// begin.
	BeginLine func() func(first bool) string
}

// Init the list of runes into the font. And headLine.
func (c *Config) Init() error {
	if !c.isInit {
		c.isInit = true
		c.mapGlyph = *gopdf.NewMapOfCharacterToGlyphIndex()

		err := (&gopdf.SubsetFontObj{
			CharacterToGlyphIndex: &c.mapGlyph,
		}).SetTTFByReader(bytes.NewReader(c.Font))
		if err != nil {
			return err
		}
	}
	c.headLine = strings.Repeat(string(c.HeadRune), c.LineLen)
	return nil
}

// Used to write text then generate the PDF. Zero value is not ready to use.
type Generator struct {
	Builder
	Title string
	Date  time.Time
	c     *Config
}

// Create Create a PDF.
func (c *Config) CreatePDF() Generator {
	beginer := c.BeginLine()
	l := beginer(true)

	return Generator{
		Builder: Builder{
			TabLen:      c.TabLen,
			LineLen:     c.LineLen,
			PageLen:     c.PageLen,
			RuneReplace: c.RuneReplace,
			RuneCheck:   c.runeExist,
			BeginLine:   beginer,
			line:        l,
			size:        stringLen(l),
		},
		c: c,
	}
}

func (g *Generator) head(page, sum int) string {
	h := fmt.Sprintf("[ %s | %d/%d ] ", g.Date.Format("2006-01-02"), page, sum)
	return h + stringLimit(g.Title, g.c.LineLen-len(h))
}

func (g *Generator) PDF() ([]byte, error) {
	g.CommitLine()

	// Init the PDF
	pdf := gopdf.GoPdf{}
	pdf.Start(gopdf.Config{
		PageSize: *gopdf.PageSizeA4,
		Unit:     gopdf.Unit_CM,
	})
	if err := pdf.AddTTFFontByReader(g.c.FontName, bytes.NewReader(g.c.Font)); err != nil {
		return nil, fmt.Errorf("Load Font fail: %v", err)
	}
	if err := pdf.SetFont(g.c.FontName, "", g.c.FontSize); err != nil {
		return nil, fmt.Errorf("Load Font fail: %v", err)
	}
	pdf.SetMargins(g.c.MarginH, g.c.MarginV, g.c.MarginH, g.c.MarginV)

	// init header values
	total := len(g.Lines)/g.PageLen + 1
	head := g.c.head
	if head == nil {
		head = g.head
	}
	if g.Date.IsZero() {
		g.Date = time.Now()
	}

	// Write into PDF
	for i, l := range g.Lines {
		if i%g.PageLen == 0 {
			pdf.AddPage()
			pdf.Text(strings.Map(g.c.runeMap, head(i/g.c.PageLen+1, total)))
			pdf.Br(g.c.LineBreak)
			pdf.Text(g.c.headLine)
			pdf.Br(g.c.LineBreak)
		}
		pdf.Text(l)
		pdf.Br(g.c.LineBreak)
	}

	p, err := pdf.GetBytesPdfReturnErr()
	if err != nil {
		return nil, fmt.Errorf("Genrate PDF fail: %v", err)
	}
	return p, nil
}

// Replace space rune
func (c *Config) runeMap(r rune) rune {
	if c.runeExist(r) {
		return r
	}
	return c.RuneReplace
}

func (c *Config) runeExist(r rune) bool {
	switch r {
	case '\t', '\n', '\f', ' ':
		return true
	}

	return !c.mapGlyph.KeyExists(r)
}
