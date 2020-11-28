/* Arveto Memo
BSD 3-Clause License
Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved. */

enum Public {
	No = 0,
	Read,
	Write,
}

interface Release {
	title: string;
	date: Date;
}

class Memo {
	id: string = '';
	title: string = '';
	public: Public = Public.No;
	update: Date = new Date(0);
	releases: Release[] = [];

	// Use from JSON
	constructor(m: Memo) {
		function toStr(v: any): string {
			if (typeof v == "string") return v;
			return '';
		}
		this.id = toStr(m.id);
		this.title = toStr(m.title);
		this.update = new Date(m.update);
		this.public = m.public === Public.No
			|| m.public === Public.Read
			|| m.public === Public.Write ?
			m.public : Public.No;
		this.releases = (m.releases ?? []).map(r => ({
			date: new Date(r.date),
			title: toStr(r.title),
		}));
	}
}
