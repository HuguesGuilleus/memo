// Arveto Memo
// BSD 3-Clause License
// Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved.

package memo

import (
	"html"
	"io"
	"net/http"
	"strings"
	"time"
	"unicode/utf8"
)

func now() time.Time { return time.Now().UTC().Truncate(time.Second) }

// Get body and return it. Max is the number max of rune. If max is negative
// or zero, the length is unchecked.
//
// If an error occure, it is processed and an emty string is returned.
func (a *App) getText(w http.ResponseWriter, r *http.Request, max int) string {
	if !strings.HasPrefix(r.Header.Get("Content-Type"), "text/plain") {
		a.error(w, r, "Need `text/plain` Mime Type", http.StatusUnsupportedMediaType)
		return ""
	}

	defer r.Body.Close()
	buff := strings.Builder{}
	_, err := io.Copy(&buff, r.Body)
	if err != nil {
		a.error(w, r, "Read request body fail: "+err.Error(), http.StatusInternalServerError)
		return ""
	}

	if buff.Len() == 0 {
		a.error(w, r, "Need some content in your request body", http.StatusBadRequest)
		return ""
	}

	s := strings.TrimSpace(buff.String())

	if !utf8.ValidString(s) {
		a.error(w, r, "The body Contain invalid rune", http.StatusUnsupportedMediaType)
		return ""
	}

	if max > 0 {
		i := 0
		for range s {
			i++
		}
		if i > max {
			a.error(w, r, "The body string is too long", http.StatusRequestEntityTooLarge)
			return ""
		}
	}

	return s
}

// Send an error to the client.
func (a *App) error(w http.ResponseWriter, r *http.Request, ms string, code int) {
	if strings.Contains(r.Header.Get("Accept"), "text/html") {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(code)
		w.Write([]byte(html.EscapeString(ms)))
	} else {
		w.WriteHeader(code)
		w.Write([]byte(ms))
	}
}
