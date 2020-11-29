/* Arveto Memo
BSD 3-Clause License
Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved. */

var model: Model;

class Model {
	// Call be after the dispaly is init.
	constructor() {
		display.init();
		display.update(this);
		this.memoFetch();
		this.contentFetch();
		this.loadList();
	}

	private _url: CustomURL = new CustomURL(document.location.href);
	get url(): CustomURL { return this._url }
	set url(u: CustomURL) {
		history.pushState({}, '', u.toString());
		this.urlSetNoHistory(u);
	}
	urlSetNoHistory(u: CustomURL) {
		const old = this.url;
		this._url = u;
		if (old.memo != u.memo) this.memoFetch();
		this.contentFetch();
		display.update(this);
	}

	private _memo: Memo | null = null;
	get memo(): Memo | null { return this._memo }
	set memo(m: Memo | null) {
		this._memo = m;
		display.memo(this);
	}
	async memoFetch() {
		this.memo = null;
		const id = this.url.memo;
		if (id === null) return;
		this.memo = await fetch(`/memo/get?m=${this.url.memo}`, {
			headers: new Headers({
				'Accept': 'application/json',
			}),
		})
			.then(rep => rep.json())
			.then((m: Memo) => new Memo(m));
	}

	private _content: string = '';
	get content(): string { return this._content }
	set content(s: string) {
		this._content = s;
		switch (this.url.kind) {
			case URLKind.Editor:
				display.editor(this);
				break;
			case URLKind.Html:
			case URLKind.View:
				display.content(this);
				break;
		}
	}
	async contentFetch() {
		if (this.url.memo === null) {
			this.content = '';
			return;
		}
		let format: string = '';
		switch (this.url.kind) {
			case URLKind.Html:
				format = 'text/html';
				break;
			case URLKind.View:
			case URLKind.Editor:
				format = 'text/markdown';
				break;
			default: return;
		}

		const r: boolean = this.url.release !== null;
		let u: string = '/memo/';
		if (this.url.release != null) {
			u += 'release/';
		}
		u += 'get?m=' + (this.url.memo ?? '');
		if (this.url.release != null) {
			u += '&r=' + this.url.release;
		}

		this.content = 'loading ...';
		this.content = await fetch(u, {
			headers: new Headers({
				'Accept': format,
			}),
		}).then(rep => rep.text());
	}

	private _list: Memo[] = [];
	get list(): Memo[] { return this._list }
	set list(l: Memo[]) {
		this._list = l;
		display.listUpdate();
	}
	async loadList() {
		this.list = (await fetch('/memo/list')
			.then(rep => rep.json()))
			.map((m: Memo) => new Memo(m))
			.sort((m1: Memo, m2: Memo) => m1.title.toLowerCase() > m2.title.toLowerCase());
	}

	listSearch: RegExp = new RegExp('');
	listSearchSet(p: string) {
		this.listSearch = new RegExp(p, 'i');
		display.listSearch();
	}
}
