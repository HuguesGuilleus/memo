// Arveto Memo
// BSD 3-Clause License
// Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved.

package memo

import (
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

	app := &App{
		db:   db.New("data/db/"),
		auth: auth,
	}
	app.auth.Error = app.error

	app.auth.HandleFunc("/memo/create", public.LevelStd, app.memoCreate)
	app.auth.HandleFunc("/memo/list", public.LevelStd, app.memoList)

	return app, nil
}

func (a *App) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	log.Println("[REQ]", r.Method, r.RequestURI)
	w.Header().Set("Server", "Arveto Memo server")
	a.auth.Mux.ServeHTTP(w, r)
}
