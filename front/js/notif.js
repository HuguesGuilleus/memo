/* Arveto Memo
BSD 3-Clause License
Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved. */

// Create a notifacation
class Notif {
	constructor(ms) {
		this.el = $new(document.body, 'div', '', ['notif'], ms);
		$e(this.el, 'click', () => this.drop());
		this.timeout = setTimeout(() => this.drop(), 2000);
	}
	drop() {
		this.el.remove();
	}
}
