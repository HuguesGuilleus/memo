/* Arveto Memo
BSD 3-Clause License
Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved. */

var memoID = null;
var currentMemo = null;

// List all memo
async function memoList() {
	memoID = null;
	hideMain();
	$('memoListGroup').hidden = false;

	let list = (await fetchJson('/memo/list')).map(m => {
		m.uplaod = new Date(m.uplaod);
		return m;
	}).sort((m1, m2) => m1.title.toLowerCase() > m2.title.toLowerCase());

	let ul = $('memoList');
	while (ul.children.length) ul.children[0].remove();

	// Create a link for one memo or release and HTML+PDF button.
	function createLink(parent, id, release, title) {
		const isr = release !== null;
		const group = $new(parent, 'div', '', ['memoItemLink']);

		$goto($anchor(group, 'name', ['memoItemLinkName'], title,
			`/memo/${isr?'release/view':'edit'}?m=${id}${isr?'&r='+release:''}`
		));

		const html = $anchor(group, '', ['memoItemLinkImg', 'imgHTML'], '',
			`/memo/${isr?'release/':''}html?m=${id}${isr?'&r='+release:''}`);
		html.title = 'View HTML';
		$goto(html);

		$anchor(group, '', ['memoItemLinkImg', 'imgPDF'], '',
				`/memo/${isr?'release/':''}get?f=pdf&m=${id}${isr?'&r='+release:''}`)
			.title = 'Download PDF';

		return group;
	}
	let listElements = list.map(m => {
		let item = $anchor(ul, '', ['memoItem'], '', '/memo/view?m=' + m.id);
		createLink(item, m.id, null, m.title);

		let releaseGroup = $new(item, 'div', '', ['memoItemRealseGroup']);
		(m.releases || []).forEach((r, i) => {
			createLink(releaseGroup, m.id, i, r.title);
		});

		return {
			i: item,
			m: m,
		};
	});

	let s = $('memoListSearch');
	s.value = '';
	$e(s, 'input', () => memoSearch(s.value, listElements))
}

// Hide no match memo.
function memoSearch(v, list) {
	const ok = new RegExp(v, 'i');
	list.forEach(e => e.i.hidden = !(
		ok.test(e.m.title) || (e.m.releases || []).some(r => ok.test(r.title))
	));
}

// Search one memo in the list of memo.
function memoListSearch() {}

// Get text from memo
async function memoNew() {
	let title = await inputText('The new memo title:', '');
	if (!title) return;
	let id = await fetchText('/memo/create', title);
	history.pushState({}, `Memo: ${title}`, '/memo/edit?m=' + id);
	memoEdit(id);
}

// Display one memo.
async function memoEdit(id) {
	let memoText = $('memoText');
	while (memoText.children.length) {
		memoText.children[0].remove();
	}

	hideMain();
	$('memoView').hidden = false;

	memoText.innerText = 'load ...';

	let meta = await fetchJson(`/memo/get?m=${id}`);
	meta.upload = new Date(meta.upload);
	currentMemo = meta;
	$('title').innerText = meta.title;

	let text = await fetchText(`/memo/get?m=${id}`);
	let lines = text.split(/\r?\n/) || [''];
	memoText.innerText = '';

	lines.forEach((l, i) => {
		$new(memoText, 'li', `l-${i}`, [], l)
	});
}

// Save the current memo
function memoSave() {
	if (!currentMemo) return;

	let text = '';
	let memo = $('memoText');
	for (let i = 0; i < memo.children.length; i++) {
		text += memo.children[i].innerText + '\n';
	}

	fetch('/memo/text?m=' + currentMemo.id, {
		method: 'POST',
		headers: new Headers({
			'Content-Type': 'text/plain',
		}),
		body: text,
	});
}

async function memoEditTile() {
	if (!currentMemo) return;
	let n = await inputText('The new memo title:', currentMemo.title);
	if (!n) return;

	await fetchText('/memo/title?m=' + currentMemo.id, n);
	memoGotoView(currentMemo.id);
}
