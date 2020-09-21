// Arveto Memo
// BSD 3-Clause License
// Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved.

package gen

import (
	"fmt"
	"github.com/alecthomas/chroma"
	"github.com/alecthomas/chroma/lexers"
	"gopkg.in/russross/blackfriday.v2"
	"html"
	"strings"
)

// Render code block
func htmlCode(w *strings.Builder, n *blackfriday.Node) {
	l := lexers.Get(string(n.CodeBlockData.Info))
	if l == nil {
		l = lexers.Fallback
	}
	iter, _ := l.Tokenise(nil, string(n.Literal))

	w.WriteString("<div class=codeBloc><pre class=codeLine>")
	defer w.WriteString("</pre></div>")

	for t := iter(); t != chroma.EOF; t = iter() {
		tockenLine(t.Value, func(v string) {
			fmt.Fprintf(w, "<span class=%s>%s</span>",
				renderCodeClass(t.Type),
				html.EscapeString(v))
		}, func() {
			w.WriteString("</pre><pre class=codeLine>")
		})
	}
}

// Find the new line rune and call newLine function, and call middle
// betwenn the new line runes.
func tockenLine(s string, middle func(string), newLine func()) {
	s = strings.ReplaceAll(s, "\r\n", "\n")
	begin := 0
	for i, r := range s {
		if r == '\n' {
			if i != begin {
				middle(s[begin:i])
			}
			begin = i + 1
			newLine()
		}
	}
	if begin != len(s) {
		middle(s[begin:])
	}
}

// Return the HTML class of the tocken
func renderCodeClass(t chroma.TokenType) string {
	// https://godoc.org/github.com/alecthomas/chroma#TokenType.Category
	switch t / 100 * 100 {
	case chroma.Keyword:
		switch t {
		case chroma.Keyword, chroma.KeywordNamespace,
			chroma.KeywordDeclaration:
			return "cKeyword"
		case chroma.KeywordConstant:
			return "cConst"
		case chroma.KeywordType:
			return "cType"
		}
	case chroma.Name:
		switch t {
		case chroma.NameOther:
			return "cName"
		}
		return "cFunc"
	case chroma.LiteralString:
		switch t {
		case chroma.LiteralStringChar:
			return "cValue"
		}
		return "cString"
	case chroma.LiteralNumber:
		return "cValue"
	case chroma.Comment:
		return "cComment"
	case chroma.CommentPreproc:
		switch t {
		case chroma.CommentPreprocFile:
			return "cString"
		}
		return "cKeyword"
	}
	return `""`
}
