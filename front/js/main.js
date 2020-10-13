/* Arveto Memo
BSD 3-Clause License
Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved. */

function main() {
	function def() {
		history.pushState({}, '', '/');
		memoList();
	};
	({
		'/memo/edit': () => {
			const m = new URLSearchParams(location.search).get('m');
			m ? memoEdit(m) : def();
		},
		'/memo/html': () => {
			const m = new URLSearchParams(location.search).get('m');
			m ? memoView(m, null, 'text/html') : def();
		},
		'/memo/release/html': () => {
			const query = new URLSearchParams(location.search);
			const m = query.get('m');
			if (!m) return def();
			const r = parseInt(query.get('r'));
			if (isNaN(r)) {
				history.pushState({}, '', '/memo/html?m=' + m);
				main();
				return;
			}
			memoView(m, r, 'text/html');
		},
		'/memo/release/view': () => {
			const query = new URLSearchParams(location.search);
			const m = query.get('m');
			if (!m) return def();
			const r = parseInt(query.get('r'));
			if (isNaN(r)) {
				history.pushState({}, '', '/memo/edit?m=' + m);
				main();
				return;
			}
			memoView(m, r, 'text/plain');
		},
		'/memo/new': memoNew,
		'/': memoList,
	} [location.pathname] || def)();
}

window.addEventListener('popstate', main);
document.addEventListener("DOMContentLoaded", () => {
	waiter = new Waiter();

	$qsa('a.goto').forEach(a => $goto(a));
	const memoEdit = $('memoEdit');
	$e(memoEdit, 'keydown', memoEditKey);
	$e(memoEdit, 'input', () => {
		memoEdit.querySelectorAll('br').forEach(br => br.remove());
	});

	const menu = $('menuGroup');
	let menuActive = false;

	function menuSwitch(e) {
		if (menuActive = !menuActive) {
			menu.classList.add('active');
		} else {
			menu.classList.remove('active');
		}
		e.stopPropagation();
	}
	$e('menuImg', 'click', menuSwitch);
	$e(document.body, 'click', e => menuActive && menuSwitch(e));

	$e('menuEditTitle', 'click', menuEditTitle);
	$e('menuEditPublic', 'click', menuEditPublic);
	$e('menuRelease', 'click', memoCreateRelease);
	$e('menuDelete', 'click', menuDelete);

	main();
}, {
	once: true,
});

window.addEventListener('keydown', e => {
	if (e.key !== 's' || !e.ctrlKey || !currentMemo) return;
	e.preventDefault();
	memoSave();
});
