// Arveto Memo
// BSD 3-Clause License
// Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved.

package main

import (
	"./pkg"
	"log"
	"net/http"
)

func init() {
	log.SetFlags(log.Lshortfile)
	log.Println("init()")
}

func main() {
	app, err := memo.NewApp()
	if err != nil {
		log.Fatal(err)
	}

	log.Fatal(http.ListenAndServe(":8000", app))
}
