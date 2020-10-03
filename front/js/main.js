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
document.addEventListener("DOMContentLoaded", main, {
	once: true,
});

window.addEventListener('keydown', e => {
	console.log('sauvegarde ...');
	if (e.key !== 's' || !e.ctrlKey || !currentMemo) return;
	console.log('oui!');
	e.preventDefault();
	memoSave();
});
