// Arveto Memo
// BSD 3-Clause License
// Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved.

package memo

import (
	"github.com/Arveto/auth-go"
	"html"
	"io"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"
)

func now() time.Time { return time.Now().UTC().Truncate(time.Second) }

// Like parseQuoting but return a list of string that begin with fisrt.
func parseQuotingList(mediarange, first string) []string {
	q := parseQuoting(mediarange)
	list := make([]string, len(q)+1)
	list[0] = first
	for i, q := range q {
		list[i+1] = q.V
	}
	return list
}

type httpQ struct {
	V string
	Q float64
}

// Parse The HTTP headers like Accept. Ignore error. If mediarange is empty,
// The return value is []httpQ{{V: "*/*", Q: 1.0}}
func parseQuoting(mediarange string) []httpQ {
	if mediarange == "" {
		return []httpQ{{V: "*/*", Q: 1.0}}
	}

	rangelist := strings.Split(mediarange, ",")
	qvalues := make([]httpQ, 0, len(rangelist))

	for _, r := range rangelist {
		rr := strings.Split(r, ";q=")
		v, q := "", 1.0
		if len(rr) == 0 {
			continue
		} else if len(rr) == 1 {
			v = rr[0]
		} else {
			v = rr[0]
			qs := strings.SplitN(rr[1], ";", 2)[0]
			var err error
			q, err = strconv.ParseFloat(qs, 64)
			if err != nil {
				continue
			}
		}
		qvalues = append(qvalues, httpQ{V: v, Q: q})
	}

	sort.Slice(qvalues, func(i int, j int) bool { return qvalues[i].Q > qvalues[j].Q })

	return qvalues
}

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

// Check if the user level is more than l. If fail a message is sending and
// the function return true.
func (a *App) checkLevel(w http.ResponseWriter, r *auth.Request, l auth.UserLevel) bool {
	if l == auth.LevelCandidate {
		return false
	}

	if r.User == nil {
		a.error(w, &r.Request, "You are not connected", http.StatusUnauthorized)
		return true
	} else if r.User.Level < l {
		a.error(w, &r.Request,
			"You have insufficient to make this action",
			http.StatusForbidden)
		return true
	}

	return false
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
