/* Arveto Memo
BSD 3-Clause License
Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved. */

namespace Main {
	function main() {
		model = new Model();
	}
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', main, { once: true });
	} else {
		main();
	}
}
