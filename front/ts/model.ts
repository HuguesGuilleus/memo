/* Arveto Memo
BSD 3-Clause License
Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved. */

var model = new class Model {
	constructor() { }

	private _list: Memo[];
	get list(): Memo[] { return this._list }
	set list(l: Memo[]) {
		this._list = l;
		display.listUpdate();
	}
	async loadList() {
		this.list = (await fetch('/memo/list').then(rep => rep.json())).map(m => {
			m.update = new Date(m.update);
			m.releases = (m.releases || []).map(r => {
				r.date = new Date(r.date);
				return r;
			});
			return m;
		})
			.sort((m1, m2) => m1.title.toLowerCase() > m2.title.toLowerCase());
	}

	listSearch: RegExp = new RegExp('');
	listSearchSet(p: string) {
		this.listSearch = new RegExp(p, 'i');
		display.listSearch();
	}
}
