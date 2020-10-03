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

	list.forEach(m => {
		let item = $anchor(ul, '', ['memoItem'], '', '/memo/view?m=' + m.ID);
		$e(item, 'click', event => {
			event.preventDefault();
			memoGotoView(m.ID);
		});
		$new(item, 'div', '', ['memoItemTitle'], m.title);
		$anchor(item, '', 'memoItemHTML', '', '/memo/html?m=' + m.ID).title = 'View HTML';
		$anchor(item, '', 'memoItemPDF', '', '/memo/pdf?m=' + m.ID).title = 'Download PDF';
		(m.Releases || []).forEach((r, i) => {
			let rg = $new(item, 'div', '', ['memoItemRealse'], '');
			$new(rg, 'div', '', 'memoItemRealseTitle', r.title);
			$anchor(rg, '', 'memoItemHTML', '', `/memo/release/html?m=${m.ID}&r=${i}`).title = 'View HTML';
			$anchor(rg, '', 'memoItemPDF', '', `/memo/release/pdf?m=${m.ID}&r=${i}`).title = 'Download PDF';
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
