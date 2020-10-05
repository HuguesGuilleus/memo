// Arveto Memo
// BSD 3-Clause License
// Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved.

package genpdf

// A Generator with the font DejaVu Sans Mono.
var DejaVuSansMono = Config{
	TabLen:  4,
	LineLen: 75,
	PageLen: 53,
	Font:    dejaVuSansMonoFont,
	// Font:        b64Decode(dejaVuSansMonoFont),
	FontSize:    12,
	FontName:    "DejaVuSansMono",
	RuneReplace: '�',
	LineBreak:   0.49,
	MarginH:     0.9,
	MarginV:     2.0,
	HeadRune:    '━',
}

func init() {
	if err := DejaVuSansMono.Init(); err != nil {
		panic(err)
	}
}