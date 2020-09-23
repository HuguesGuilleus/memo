// Arveto Memo
// BSD 3-Clause License
// Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved.

package genpdf

import (
	"sort"
)

// Return the length in rune of the string.
func stringLen(s string) (l int) {
	for range s {
		l++
	}
	return
}

// Limit the number of rune into a string
func stringLimit(s string, limit int) string {
	n := 0             // number of rune
	for i := range s { // i is the size in byte
		n++
		if n > limit {
			return s[:i]
		}
	}
	return s
}

// A buffer to split a text into several lines. TabLen and LineLen must be set
// before use. Do not use it in concurence.
type Builder struct {
	Lines []string
	// The future line is line + space + world
	line     string
	space    string // used only if a world comme after.
	word     string
	wordSize int
	size     int // Len of the line + len of space. All length are in rune.

	// Config
	TabLen  int // width of a tabulation
	LineLen int // max line size
	PageLen int // The number of line into a page

	// Return true if the rune is invalid (For example: the rune desn't have
	// a glyph in the font). Can be nil.
	RuneCheck func(rune) bool
	// The rune to replace unchecked rune
	RuneReplace rune
	//
	unchechedRunes map[rune]bool
}

// Add miltiples lines.
func (b *Builder) AddLines(lines ...string) {
	for _, l := range lines {
		b.AddLine(l)
	}
}

// Add one line.
func (b *Builder) AddLine(line string) {
	b.CommitLine()
	b.WriteString(line)
	b.NewLine()
}

// Add the text to the buffer. No new line at the end. If it's the last line
// of the document, call Builder.CommitLine()
func (b *Builder) WriteString(text string) {
	for _, r := range text {
		b.Map(r)
	}
}

// Check the rune of map it the add it to the builder.
func (b *Builder) Map(r rune) {
	if b.RuneCheck != nil && !b.RuneCheck(r) {
		if b.unchechedRunes == nil {
			b.unchechedRunes = make(map[rune]bool, 1)
		}
		b.unchechedRunes[r] = true
		b.add(b.RuneReplace)
		return
	}
	b.add(r)
}

func (b *Builder) UncheckedRunes() []rune {
	all := make([]rune, 0, len(b.unchechedRunes))
	for r := range b.unchechedRunes {
		all = append(all, r)
	}
	sort.Slice(all, func(i int, j int) bool { return all[i] < all[j] })
	return all
}

func (b *Builder) add(r rune) {
	switch r {
	case '\t':
		if b.wordSize > 0 {
			b.commitWorld()
		}
		n := b.TabLen - b.size%b.TabLen
		for i := 0; i < n; i++ {
			b.space += string(' ')
		}
		b.size += n
	case ' ':
		if b.wordSize > 0 {
			b.commitWorld()
		}
		b.space += string(' ')
		b.size++
	case '\n':
		b.NewLine()
	case '\f':
		b.CommitLine()
		n := b.PageLen - len(b.Lines)%b.PageLen
		for i := 0; i < n; i++ {
			b.NewLine()
		}
	default:
		b.word += string(r)
		b.wordSize++
	}
}

// Commit the word and create a new line if not empty
func (b *Builder) CommitLine() {
	if b.wordSize > 0 {
		b.commitWorld()
		if b.size > 0 {
			b.NewLine()
		}
	}
}

// Commit current line and add a new line
func (b *Builder) NewLine() {
	if b.wordSize > 0 {
		b.commitWorld()
	}
	b.Lines = append(b.Lines, b.line)

	b.line = ""
	b.space = ""
	b.word = ""
	b.size = 0
}

func (b *Builder) commitWorld() {
	if b.size > b.LineLen {
		b.Lines = append(b.Lines, b.line)
		b.line = ""
		b.space = ""
		b.size = 0
	} else {
		b.line += b.space
		b.space = ""
	}

	l := stringLen(b.word)
	if l > b.LineLen {
		for _, r := range b.word {
			b.line += string(r)
			b.size++
			if b.size > b.LineLen {
				b.Lines = append(b.Lines, b.line)
				b.line = ""
				b.word = ""
				b.size = 0
			}
		}
	} else if b.size+l > b.LineLen {
		b.Lines = append(b.Lines, b.line)
		b.line = b.word
		b.space = ""
		b.word = ""
		b.size = l
	} else {
		b.line += b.word
		b.size += l
		b.word = ""
	}
}
