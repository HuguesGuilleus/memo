// Arveto Memo
// BSD 3-Clause License
// Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved.

package genpdf

import (
	"bytes"
	"fmt"
	"github.com/signintech/gopdf"
	"strings"
)

// All Public fields are required.
type Generator struct {
	isInit      bool
	Font        []byte
	FontSize    int
	fontObj     gopdf.SubsetFontObj
	FontName    string
	RuneReplace rune
	TabLen      int     // width of a tabulation
	LineLen     int     // max line size
	PageLen     int     // The number of line into a page
	LineBreak   float64 // Line size
	// The margins
	MarginH, MarginV float64
}

func (g *Generator) PDF(input string, head func(int, int) string) ([]byte, error) {
	if !g.isInit {
		g.fontObj.SetTTFByReader(bytes.NewReader(g.Font))
	}

	// Split into several line
	b := Builder{
		TabLen:      g.TabLen,
		LineLen:     g.LineLen,
		PageLen:     g.PageLen,
		RuneReplace: g.RuneReplace,
		RuneCheck:   g.runeExist,
	}
	b.WriteString(input)
	b.CommitLine()

	// Init the PDF
	pdf := gopdf.GoPdf{}
	pdf.Start(gopdf.Config{
		PageSize: *gopdf.PageSizeA4,
		Unit:     gopdf.Unit_CM,
	})
	if err := pdf.AddTTFFontByReader(g.FontName, bytes.NewReader(g.Font)); err != nil {
		return nil, fmt.Errorf("Load Font fail: %v", err)
	}
	if err := pdf.SetFont(g.FontName, "", g.FontSize); err != nil {
		return nil, fmt.Errorf("Load Font fail: %v", err)
	}
	pdf.SetMargins(g.MarginH, g.MarginV, g.MarginH, g.MarginV)

	// Write into PDF
	total := len(b.Lines)/g.PageLen + 1
	for i, l := range b.Lines {
		if i%g.PageLen == 0 {
			pdf.AddPage()
			pdf.Text(strings.Map(g.runeMap, head(i/g.PageLen+1, total)))
			pdf.Br(g.LineBreak * 2.0)
		}
		pdf.Text(l)
		pdf.Br(g.LineBreak)
	}

	p, err := pdf.GetBytesPdfReturnErr()
	if err != nil {
		return nil, fmt.Errorf("Genrate PDF fail: %v", err)
	}
	return p, nil
}

// Replace space rune
func (g *Generator) runeMap(r rune) rune {
	if g.runeExist(r) {
		return r
	}
	return g.RuneReplace
}

func (g *Generator) runeExist(r rune) bool {
	switch r {
	case '\t', '\n', '\f', ' ':
		return true
	}

	if i, _ := g.fontObj.CharCodeToGlyphIndex(r); i == 0 {
		return false
	}

	return true
}
