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
	}).sort((m1, m2) => m1.title > m2.title);

	let ul = $('memoList');
	while (ul.children.length) ul.children[0].remove();

	// Create a link for one memo or release and HTML+PDF button.
	function createLink(parent, id, release, title) {
		let group = $new(parent, 'div', '', ['memoItemLink']);
		$anchor(group, 'name', ['memoItemLinkName'], title,
			`/memo/${typeof release==='number'?'release/':''}view?m=${id}${typeof release==='number'?'&r='+release:''}`
		);
		// TODO: Download URL
		$anchor(group, '', ['memoItemLinkImg', 'imgPDF'], '', '/d').title = 'Download PDF';
		$anchor(group, '', ['memoItemLinkImg', 'imgHTML'], '', '/d').title = 'Download HTML';
		return group;
	}

	list.forEach(m => {
		let item = $anchor(ul, '', ['memoItem'], '', '/memo/view?m=' + m.ID);
		$e(item, 'click', event => {
			event.preventDefault();
			memoGotoView(m.ID);
		});
		createLink(item, m.ID, '', m.title);

		let releaseGroup = $new(item, 'div', '', ['memoItemRealseGroup']);

		(m.Releases || []).forEach((r, i) => {
			createLink(releaseGroup, m.ID, i, r.title);
		});
	});
}

// Search one memo in the list of memo.
function memoListSearch() {}

// Get text from memo
async function memoNew() {
	let title = await inputText('The new memo title:', '');
	if (!title) return;
	let id = await fetchText('/memo/create', title);
	memoGotoView(id);
}

function memoGotoView(id) {
	history.pushState({}, `Memo: ${title}`, '/memo/view?m=' + id);
	memoView(id);
}

// Display one memo.
async function memoView(id) {
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

	fetch('/memo/text?m=' + currentMemo.ID, {
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

	await fetchText('/memo/title?m=' + currentMemo.ID, n);
	memoGotoView(currentMemo.ID);
}