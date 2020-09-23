// Arveto Memo
// BSD 3-Clause License
// Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved.

package memo

import (
	"encoding/json"
	"github.com/Arveto/arvetoAuth/pkg/public2"
	"github.com/HuguesGuilleus/go-db.v1"
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

	a.auth.HandleFunc("/memo/create", public.LevelStd, a.memoCreate)
	a.auth.HandleFunc("/me", public.LevelCandidate, func(w http.ResponseWriter, r *public.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(r.User)
	})
	a.auth.HandleFunc("/memo/delete", public.LevelAdmin, a.memoDelete)
	a.auth.HandleFunc("/memo/get", public.LevelCandidate, a.memoGet)
	a.auth.HandleFunc("/memo/list", public.LevelVisitor, a.memoList)
	a.auth.HandleFunc("/memo/public", public.LevelStd, a.memoPublic)
	a.auth.HandleFunc("/memo/text", public.LevelCandidate, a.memoText)
	a.auth.HandleFunc("/memo/title", public.LevelCandidate, a.memoTitle)

	return a, nil
}

func (a *App) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	log.Println("[REQ]", r.Method, r.RequestURI)
	w.Header().Set("Server", "Arveto Memo server")
	a.auth.Mux.ServeHTTP(w, r)
}
