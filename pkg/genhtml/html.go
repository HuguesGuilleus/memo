// Arveto Memo
// BSD 3-Clause License
// Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved.

package gen

import (
	"fmt"
	"gopkg.in/russross/blackfriday.v2"
	"html"
	"regexp"
	"strings"
)

func Html(in string) string {
	root := blackfriday.New(
		blackfriday.WithExtensions(blackfriday.CommonExtensions),
	).Parse([]byte(in))

	// Remove HTML Block
	root.Walk(func(n *blackfriday.Node, entering bool) blackfriday.WalkStatus {
		switch n.Type {
		case blackfriday.HTMLBlock, blackfriday.HTMLSpan:
			n.Unlink()
			return blackfriday.SkipChildren
		default:
			return blackfriday.GoToNext
		}
	})

	var buff strings.Builder
	root.Walk(func(n *blackfriday.Node, entering bool) blackfriday.WalkStatus {
		defaultRender(&buff, n, entering)
		return blackfriday.GoToNext
	})

	return buff.String()
}

var renderNodeMap = map[blackfriday.NodeType][2]string{
	blackfriday.BlockQuote: {"<blockquote>", "</blockquote>"},
	blackfriday.Del:        {"<del>", "</del>"},
	blackfriday.Emph:       {"<em>", "</em>"},
	blackfriday.Hardbreak:  {"<br>", ""},
	blackfriday.Strong:     {"<strong>", "</strong>"},
	blackfriday.Table:      {"<table>", "</table>"},
	blackfriday.TableBody:  {"<tbody>", "</tbody>"},
	blackfriday.TableHead:  {"<thead>", "</thead>"},
	blackfriday.TableRow:   {"<tr>", "</tr>"},
}

// The default render for Html
func defaultRender(w *strings.Builder, n *blackfriday.Node, entering bool) {
	// The node types Document and Softbreak are ignored.

	// Simple tags with an opening and a closing
	if tags, exist := renderNodeMap[n.Type]; exist {
		if entering {
			w.WriteString(tags[0])
		} else {
			w.WriteString(tags[1])
		}
		return
	}

	// More complex tags
	switch n.Type {
	case blackfriday.Code:
		w.WriteString("<code>")
		w.WriteString(html.EscapeString(string(n.Literal)))
		w.WriteString("</code>")
	case blackfriday.CodeBlock:
		if entering {
			htmlCode(w, n)
		}
	case blackfriday.Heading:
		if entering {
			fmt.Fprintf(w, `<h%d id="%s">`, n.Level, n.HeadingID)
		} else {
			fmt.Fprintf(w, `</h%d>`, n.Level)
		}
	case blackfriday.HTMLBlock, blackfriday.HTMLSpan:
		w.Write(n.Literal)
	case blackfriday.Image:
		if entering {
			fmt.Fprintf(w, `<img class="plain" src="%s" title="%s">`, n.Destination, html.EscapeString(string(n.Title)))
		}
	case blackfriday.Item:
		if n.ListFlags&blackfriday.ListTypeTerm != 0 {
			if entering {
				w.WriteString("<dt>")
			} else {
				w.WriteString("</dt>")
			}
		} else if n.ListFlags&blackfriday.ListTypeDefinition != 0 {
			if entering {
				w.WriteString("<dd>")
			} else {
				w.WriteString("</dd>")
			}
		} else {
			if entering {
				w.WriteString("<li>")
			} else {
				w.WriteString("</li>")
			}
		}
	case blackfriday.Link:
		if entering {
			if n.Title != nil {
				fmt.Fprintf(w, `<a href="%s" title="%s">`, n.Destination, n.Title)
			} else {
				fmt.Fprintf(w, `<a href="%s">`, n.Destination)
			}
		} else {
			w.WriteString("</a>")
		}
	case blackfriday.List:
		switch {
		case n.ListFlags&blackfriday.ListTypeDefinition != 0:
			if entering {
				w.WriteString("<dl>")
			} else {
				w.WriteString("</dl>")
			}
		case n.ListFlags&blackfriday.ListTypeOrdered != 0:
			if entering {
				w.WriteString("<ol>")
			} else {
				w.WriteString("</ol>")
			}
		default:
			if entering {
				w.WriteString("<ul>")
			} else {
				w.WriteString("</ul>")
			}
		}
	case blackfriday.Paragraph:
		if p := n.Parent; p.Type == blackfriday.Item && !p.Tight {
			return
		}
		if entering {
			w.WriteString("<p>")
		} else {
			w.WriteString("</p>")
		}
	case blackfriday.TableCell:
		if n.IsHeader {
			if entering {
				w.WriteString("<th>")
			} else {
				w.WriteString("</th>")
			}
		} else {
			if entering {
				w.WriteString("<td>")
			} else {
				w.WriteString("</td>")
			}
		}
	case blackfriday.Text:
		frenchSpace(w, n.Literal)
	}
}

var (
	frenchSpaceSpaces = regexp.MustCompile(`\s+`)
	frenchPonctuation = regexp.MustCompile(`[<>&:«»;!?]`)
)

// Change ponctuation for French text.
func frenchSpace(w *strings.Builder, in []byte) {
	text := frenchSpaceSpaces.ReplaceAllString(string(in), " ")
	w.WriteString(frenchPonctuation.ReplaceAllStringFunc(text, func(in string) string {
		switch in {
		case ";", "!", "?", "»":
			return "&#x202F;" + in
		case "«":
			return "«&#x202F;"
		case ":":
			return "&nbsp;:"
		case "&":
			return "&#38;"
		case "<":
			return "&#60;"
		case ">":
			return "&#62;"
		default:
			return in
		}
	}))
}
