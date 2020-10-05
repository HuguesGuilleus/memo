/* Arveto Memo
BSD 3-Clause License
Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved. */

function main() {
	function def() {
		history.pushState({}, 'Index', '/');
		memoList();
	};
	({
		'/memo/edit': () => {
			let m = new URLSearchParams(location.search).get('m');
			m ? memoEdit(m) : def();
		},
		'/memo/new': memoNew,
		'/': memoList,
	} [location.pathname] || def)();
}

window.addEventListener('popstate', main);
document.addEventListener("DOMContentLoaded", () => {
	$qsa('a.goto').forEach(a => $goto(a));
	main();
}, {
	once: true,
});

window.addEventListener('keydown', e => {
	if (e.key !== 's' || !e.ctrlKey || !currentMemo) return;
	e.preventDefault();
	memoSave();
});
