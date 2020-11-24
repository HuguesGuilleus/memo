// Arveto Memo
// BSD 3-Clause License
// Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved.

package memo

import (
	"./front"
	"github.com/Arveto/auth-go"
	"github.com/HuguesGuilleus/go-db.v1"
	"github.com/HuguesGuilleus/static.v3"
	"github.com/shurcooL/markdownfmt/markdown"
	"io/ioutil"
	"log"
	"net/http"
)

type App struct {
	db   *db.DB
	auth *auth.App
}

func NewApp() (*App, error) {
	authapp, err := auth.NewApp("memo", "https://auth.dev.arveto.io/")
	if err != nil {
		return nil, err
	}

	a := &App{
		db:   db.New("data/db/"),
		auth: authapp,
	}
	a.auth.Error = func(w http.ResponseWriter, r *http.Request, e error, code int) {
		a.error(w, r, e.Error(), code)
	}

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
	a.auth.Mux.Handle("/icon.webp", static.WebP().Func(front.IconIcon))
	a.auth.Mux.Handle("/icon-96.png", static.Png().Func(front.IconIcon96))
	a.auth.Mux.Handle("/font/bold.ttf", static.New("font/ttf", nil).Func(front.FontBold))
	a.auth.Mux.Handle("/font/code.ttf", static.New("font/ttf", nil).Func(front.FontCode))
	a.auth.Mux.Handle("/font/text.ttf", static.New("font/ttf", nil).Func(front.FontText))
	a.auth.Mux.HandleFunc("/format", format)

	a.auth.HandleFunc("/memo/create", auth.LevelStandard, a.memoCreate)
	a.auth.HandleFunc("/memo/delete", auth.LevelAdministrator, a.memoDelete)
	a.auth.HandleFunc("/memo/get", auth.LevelCandidate, a.memoGet)
	a.auth.HandleFunc("/memo/list", auth.LevelVisitor, a.memoList)
	a.auth.HandleFunc("/memo/public", auth.LevelStandard, a.memoPublic)
	a.auth.HandleFunc("/memo/release/get", auth.LevelCandidate, a.memoReleaseGet)
	a.auth.HandleFunc("/memo/release/new", auth.LevelVisitor, a.memoReleaseNew)
	a.auth.HandleFunc("/memo/text", auth.LevelCandidate, a.memoText)
	a.auth.HandleFunc("/memo/title", auth.LevelCandidate, a.memoTitle)

	return a, nil
}

func (a *App) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	log.Println("[REQ]", r.Method, r.RequestURI)
	w.Header().Set("Server", "Arveto Memo server")
	a.auth.Mux.ServeHTTP(w, r)
}

// Format the input body and return it into the ResponseWriter.
func format(w http.ResponseWriter, r *http.Request) {
	body, err := ioutil.ReadAll(r.Body)
	r.Body.Close()
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	f, err := markdown.Process("", body, nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Write(f)
}
