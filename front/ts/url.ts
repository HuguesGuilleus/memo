/* Arveto Memo
BSD 3-Clause License
Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved. */

const enum URLKind {
	List = 0,
	Html,
	View,
	Editor,
	New,
};

class CustomURL {
	kind: URLKind = URLKind.List;
	memo: string | null = null;
	release: number | null = null;

	constructor(u: string) {
		// Save Kind parse from the path p. unknow path return URLKind.List
		function path2kind(p: string): URLKind {
			switch (p) {
				case '/memo/html': return URLKind.Html;
				case '/memo/view': return URLKind.View;
				case '/memo/release/html': return URLKind.Html;
				case '/memo/release/view': return URLKind.View;
				case '/memo/edit': return URLKind.Editor;
				case '/memo/new': return URLKind.New;
				default: return URLKind.List;
			}
			return URLKind.List;
		}

		const { pathname, search } = /^\w+:\/\//.test(u) ? new URL(u) :
			{
				pathname: u.replace(/(.*)(\?.*)/, "$1"),
				search: u.replace(/(.*)(\?.*)/, "$2"),
			};
		this.kind = path2kind(pathname);
		const params = new URLSearchParams(search);
		this.memo = params.get('m');
		const r: string | null = params.get('r');
		if (r !== null) {
			this.release = parseInt(r);
			if (isNaN(this.release)) {
				this.release = null;
			}
		} else {
			this.release = null;
		}
	}
	toString(): string {
		if (this.release !== null) {
			let r = this.release;
			switch (this.kind) {
				case URLKind.Html:
					return `/memo/release/html?m=${this.memo ?? ''}&r=${r}`;
				case URLKind.View:
					return `/memo/release/view?m=${this.memo ?? ''}&r=${r}`;
			}
		}
		switch (this.kind) {
			case URLKind.Html: return `/memo/html?m=${this.memo ?? ''}`;
			case URLKind.View: return `/memo/view?m=${this.memo ?? ''}`;
			case URLKind.Editor: return `/memo/edit?m=${this.memo ?? ''}`;
			case URLKind.New: return `/memo/new`;
			default: return '/';
		}
	}
}
