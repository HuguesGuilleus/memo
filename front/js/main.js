/* Arveto Memo
BSD 3-Clause License
Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved. */

function main() {
	function def() {
		history.pushState({}, 'Index', '/');
		memoList();
	};
	({
		'/memo/view': () => {
			let m = new URLSearchParams(location.search).get('m');
			m ? memoView(m) : def();
		},
		'/memo/new': memoNew,
		'/': memoList,
	} [location.pathname] || def)();
}

window.addEventListener('popstate', main);
document.addEventListener("DOMContentLoaded", () => {
	$qsa('a.goto').forEach(a => a.addEventListener('click', event => {
		event.preventDefault();
		history.pushState({}, '', a.href);
		main();
	}));

	main();
}, {
	once: true,
});

window.addEventListener('keydown', e => {
	if (e.key !== 's' || !e.ctrlKey || !currentMemo) return;
	e.preventDefault();
	memoSave();
});
