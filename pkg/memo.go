// Arveto Memo
// BSD 3-Clause License
// Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved.

package memo

import (
	// "./genhtml"
	// "./genpdf"
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"github.com/Arveto/arvetoAuth/pkg/public2"
	"github.com/HuguesGuilleus/go-db.v1"
	"net/http"
	"strconv"
	"time"
)

const (
	PublicNo    uint = 0
	PublicRead  uint = 1
	PublicWrite uint = 2
	TitleMax    int  = 256
)

type Memo struct {
	db       *db.DB
	ID       string
	Title    string    `json:"title"`
	Public   uint      `json:"public"`
	Text     db.Key    `json:"-"`
	Update   time.Time `json:"uplaod"`
	Releases []*Release
}
type Release struct {
	Title string    `json:"title"`
	Date  time.Time `json:"date"`
	Text  db.Key    `json:"-"`
	Html  db.Key    `json:"-"`
	Pdf   db.Key    `json:"-"`
}

func (m *Memo) getText() string { return string(m.db.GetRaw(m.Text)) }
func (m *Memo) save()           { m.db.SetS("memo:"+m.ID, m) }
func (a *App) getMemo(w http.ResponseWriter, r *http.Request) *Memo {
	id := r.URL.Query().Get("m")
	if id == "" {
		a.error(w, r, "Need m query with the memo id", http.StatusBadRequest)
		return nil
	}

	var m Memo
	if a.db.GetS("memo:"+id, &m) {
		return nil
	}
	m.db = a.db
	return &m
}
func (a *App) getRelease(w http.ResponseWriter, r *http.Request) *Release {
	m := a.getMemo(w, r)
	if m == nil {
		return nil
	}

	_id, err := strconv.ParseInt(r.URL.Query().Get("r"), 10, 64)
	id := int(_id)
	if err != nil {
		a.error(w, r, "Query r to get release number has an invalid syntax: "+err.Error(), http.StatusBadRequest)
		return nil
	} else if id < 0 || id >= len(m.Releases) {
		a.error(w, r, "The release number is out of range", http.StatusBadRequest)
	}

	return m.Releases[id]
}

/* HANDLERS */

// List all memos id into a JSON array.
func (a *App) memoList(w http.ResponseWriter, r *public.Request) {
	// all := []string{}
	// a.db.ForS("memo:", 0, 0, func(id string) bool {
	// 	all = append(all, strings.TrimPrefix(id, "memo:"))
	// 	return false
	// }, func(_ string, _ struct{}) {})
	//
	// j, _ := json.Marshal(all)
	// w.Header().Set("Content-Type", "application/json")
	// w.Write(j)
	all := make([]Memo, 0)
	a.db.ForS("memo:", 0, 0, nil, func(id string, m Memo) {
		all = append(all, m)
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(all)
	// j, _ := json.Marshal(all)
	// w.Write(j)
}

// Create a new Memo.
func (a *App) memoCreate(w http.ResponseWriter, r *public.Request) {
	title := a.getText(w, &r.Request, TitleMax)
	if title == "" {
		return
	}

	hash := md5.Sum([]byte(title))
	id := hex.EncodeToString(hash[:])
	if !a.db.UnknownS("memo:" + id) {
		a.error(w, &r.Request, "The title hash already exit:"+id, http.StatusConflict)
		return
	}

	m := Memo{
		db:     a.db,
		ID:     id,
		Title:  title,
		Update: now(),
		Text:   a.db.New(),
	}
	a.db.Set(m.Text, []byte("An new emty memo, ;)\r\n"))
	m.save()

	w.Write([]byte(m.ID))
}

// Delete an memo.
func (a *App) memoDelete(w http.ResponseWriter, r *public.Request) {
	m := a.getMemo(w, &r.Request)
	if m == nil {
		return
	}

	for _, r := range m.Releases {
		a.db.Delete(r.Html)
		a.db.Delete(r.Text)
		a.db.Delete(r.Pdf)
	}
	a.db.Delete(m.Text)
	a.db.DeleteS("memo:" + m.ID)
}

// Set Memo.Title
func (a *App) memoTitle(w http.ResponseWriter, r *public.Request) {
	m := a.getMemo(w, &r.Request)
	if m == nil {
		return
	}
	title := a.getText(w, &r.Request, TitleMax)
	if title == "" {
		return
	}

	m.Title = title
	m.save()
}

// func (a *App) memoCreate(w http.ResponseWriter, r *public.Request){}
// func (a *App) memoCreate(w http.ResponseWriter, r *public.Request){}
// func (a *App) memoCreate(w http.ResponseWriter, r *public.Request){}
// func (a *App) memoCreate(w http.ResponseWriter, r *public.Request){}
