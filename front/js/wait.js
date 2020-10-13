/* Arveto Memo
BSD 3-Clause License
Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved. */

var waiter = null;

class Waiter {
	constructor() {
		this.w = $('wait');
		this.off();
	}
	on() {
		this.w.hidden = false;
	}
	off() {
		this.w.hidden = true;
	}
	async all() {
		this.on();
		const r = await Promise.all(Array.from(arguments));
		this.off();
		return r;
	}
}
