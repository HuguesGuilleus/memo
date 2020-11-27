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
	id: string;
	title: string;
	public: Public;
	update: Date;
	releases: Release[];

	constructor() { }
}
