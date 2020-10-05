// Arveto Memo
// BSD 3-Clause License
// Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved.

package memo

import (
	"./front"
	"encoding/json"
	"github.com/Arveto/arvetoAuth/pkg/public2"
	"github.com/HuguesGuilleus/go-db.v1"
	"github.com/HuguesGuilleus/static.v3"
	"log"
	"net/http"
)

type App struct {
	db   *db.DB
	auth *public.App
}

func NewApp() (*App, error) {
	auth, err := public.NewApp("memo", "https://auth.dev.arveto.io/", true)
	if err != nil {
		return nil, err
	}

	a := &App{
		db:   db.New("data/db/"),
		auth: auth,
	}
	a.auth.Error = a.error

	static.Dev = true
	htmlApp := static.Html().Func(front.HtmlIndexEn)
	a.auth.Mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			a.error(w, r, "Not Found", 404)
			return
		}
		htmlApp.ServeHTTP(w, r)
	})
	a.auth.Mux.Handle("/memo/new", htmlApp)
	a.auth.Mux.Handle("/memo/edit", htmlApp)
	a.auth.Mux.Handle("/memo/html", htmlApp)
	a.auth.Mux.Handle("/memo/release/html", htmlApp)
	a.auth.Mux.Handle("/memo/release/view", htmlApp)
	a.auth.Mux.Handle("/app.js", static.Js().Func(front.Js))
	a.auth.Mux.Handle("/style.css", static.Css().Func(front.Style))
	a.auth.Mux.Handle("/font/bold.ttf", static.New("font/ttf", nil).Func(front.FontBold))
	a.auth.Mux.Handle("/font/code.ttf", static.New("font/ttf", nil).Func(front.FontCode))
	a.auth.Mux.Handle("/font/text.ttf", static.New("font/ttf", nil).Func(front.FontText))

	a.auth.HandleFunc("/memo/create", public.LevelStd, a.memoCreate)
	a.auth.HandleFunc("/memo/delete", public.LevelAdmin, a.memoDelete)
	a.auth.HandleFunc("/memo/get", public.LevelCandidate, a.memoGet)
	a.auth.HandleFunc("/memo/list", public.LevelVisitor, a.memoList)
	a.auth.HandleFunc("/memo/public", public.LevelStd, a.memoPublic)
	a.auth.HandleFunc("/memo/release/get", public.LevelCandidate, a.memoReleaseGet)
	a.auth.HandleFunc("/memo/release/new", public.LevelVisitor, a.memoReleaseNew)
	a.auth.HandleFunc("/memo/text", public.LevelCandidate, a.memoText)
	a.auth.HandleFunc("/memo/title", public.LevelCandidate, a.memoTitle)

	a.auth.HandleFunc("/me", public.LevelCandidate, func(w http.ResponseWriter, r *public.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(r.User)
	})

	return a, nil
}

func (a *App) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	log.Println("[REQ]", r.Method, r.RequestURI)
	w.Header().Set("Server", "Arveto Memo server")
	a.auth.Mux.ServeHTTP(w, r)
}
