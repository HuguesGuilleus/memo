/* Arveto Memo
BSD 3-Clause License
Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved. */

const PUBLIC_NO = 0,
	PUBLIC_READ = 1,
	PUBLIC_WRITE = 2;

var currentMemo = null;

// List all memo
async function memoList() {
	currentMemo = null;
	hideMain();
	$('memoListGroup').hidden = false;

	waiter.on();
	let list = (await fetchJson('/memo/list')).map(m => {
		m.update = new Date(m.update);
		m.releases = (m.releases || []).map(r => {
			r.date = new Date(r.date);
			return r;
		})
		return m;
	}).sort((m1, m2) => m1.title.toLowerCase() > m2.title.toLowerCase());
	waiter.off();

	const ul = $('memoList');
	while (ul.children.length) ul.children[0].remove();

	// Create a link for one memo or release and HTML+PDF button.
	function createLink(parent, id, release, title, date, pub) {
		const isr = release !== null;
		const group = $new(parent, 'div', '', ['memoItemLink']);

		const l = $anchor(group, 'name', ['memoItemLinkName'], title,
			`/memo/${isr?'release/view':'edit'}?m=${id}${isr?'&r='+release:''}`
		);
		$goto(l);
		addBadge(l, pub, date);

		const html = $anchor(group, '', ['memoItemLinkImg', 'imgHTML'], '',
			`/memo/${isr?'release/':''}html?m=${id}${isr?'&r='+release:''}`);
		html.title = 'View HTML';
		$goto(html);

		$anchor(group, '', ['memoItemLinkImg', 'imgPDF'], '',
				`/memo/${isr?'release/':''}get?f=pdf&m=${id}${isr?'&r='+release:''}`)
			.title = 'Download PDF';

		return group;
	}
	const listElements = list.map(m => {
		let item = $new(ul, 'li', '', ['memoItem']);
		createLink(item, m.id, null, m.title, m.update, m.public);

		let releaseGroup = $new(item, 'div', '', ['memoItemRealseGroup']);
		m.releases.forEach((r, i) => {
			createLink(releaseGroup, m.id, i, r.title, r.date, PUBLIC_NO);
		});

		return {
			i: item,
			m: m,
		};
	});

	const s = $('memoListSearch');
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
	let title = await inputText('The new memo title:', '', memoList);
	if (!title) return;
	let id = await fetchText('/memo/create', title);
	history.pushState({}, `Memo: ${title}`, '/memo/edit?m=' + id);
	memoEdit(id);
}

// Display one memo.
async function memoEdit(id) {
	hideMain();
	$('memuMemo').hidden = false;

	const [meta, text] = await waiter.all(
		currentMemo || fetchJson(`/memo/get?m=${id}`),
		fetchText(`/memo/get?m=${id}`)
	);

	currentMemo = meta;
	meta.update = new Date(meta.update);
	const t = $('title');
	t.innerText = meta.title;
	addBadge(t, meta.public, meta.update);

	const memoEdit = $('memoEdit');
	while (memoEdit.children.length) memoEdit.children[0].remove();
	memoEdit.hidden = false;
	$('memoViewContent').hidden = true;
	$('memoView').hidden = false;

	const lines = text.split(/\r?\n/) || [''];
	lines.forEach((l, i) => {
		$new(memoEdit, 'li', `l-${i}`, [], l)
	});

	document.onselectionchange();
}

var selection;
document.onselectionchange = function () {
	selection = document.getSelection();
};

function memoEditKey(event) {
	switch (event.key) {
	case 'Tab':
		switch (selection.type) {
		case 'Caret':
			const node = selection.anchorNode;
			if (event.shiftKey) {
				if (node.substringData(0, 1) === '\t') {
					node.deleteData(0, 1);
				}
			} else {
				node.insertData(selection.anchorOffset, '\t');
				selection.collapse(node, selection.anchorOffset + 1);
			}
			break;
		case 'Range':
			const r = selection.getRangeAt(0);
			const walker = r.startContainer === r.endContainer ? {
					firstChild() {
						return r.startContainer;
					},
					nextNode() {
						return null;
					}
				} :
				document.createTreeWalker(
					r.commonAncestorContainer,
					NodeFilter.SHOW_TEXT, {
						before: true,
						after: false,
						acceptNode(n) {
							if (this.before) {
								if (n === r.startContainer) {
									this.before = false;
									return NodeFilter.FILTER_ACCEPT;
								} else {
									return NodeFilter.FILTER_REJECT;
								}
							} else {
								if (this.after) return NodeFilter.FILTER_REJECT;
								if (n === r.endContainer) {
									this.after = true;
								}
								return NodeFilter.FILTER_ACCEPT;
							}
						},
					},
				);
			for (let n = walker.firstChild(); n; n = walker.nextNode()) {
				if (event.shiftKey) {
					const t = n.substringData(0, 1);
					if (t === '\t' || t === ' ') {
						n.deleteData(0, 1);
					}
				} else {
					n.insertData(0, '\t');
				}
			}
			break;
		}
		break;
	case '\'':
	case '"':
	case '(':
	case '{':
	case '[':
	case '<':
	case '`':
	case '«':
	case '“':
		const k = event.key;
		switch (selection.type) {
		case 'Caret':
			const n = selection.anchorNode;
			n.insertData(selection.anchorOffset, k + quoteOposite(k));
			selection.collapse(n, selection.anchorOffset + 1);
			break;
		case 'Range':
			const r = selection.getRangeAt(0);
			r.startContainer.insertData(r.startOffset, k);
			r.endContainer.insertData(r.endOffset, quoteOposite(k));
			r.setEnd(r.endContainer, r.endOffset + 1);
			break;
		}
		break;
	default:
		return;
	}
	event.preventDefault();
}

// Return the ending char for quoting a sequence:
function quoteOposite(c) {
	return {
		'(': ')',
		'{': '}',
		'[': ']',
		'<': '>',
		'«': '»',
		'“': '”',
	} [c] || c;
}

// Save the current memo
async function memoSave() {
	if (!currentMemo) return;

	const text = Array.from($('memoEdit').children)
		.map(c => c.innerText)
		.join('\n');

	waiter.on();
	await fetch('/memo/text?m=' + currentMemo.id, {
		method: 'POST',
		headers: new Headers({
			'Content-Type': 'text/plain',
		}),
		body: text,
	});
	waiter.off();

	new Notif(`'${currentMemo.title}' saved.`);
}

async function memoEditTile() {
	if (!currentMemo) return;
	let n = await inputText('The new memo title:', currentMemo.title);
	if (!n) return;

	waiter.on();
	const id = currentMemo.id;
	currentMemo = null;
	await fetchText('/memo/title?m=' + id, n);
	waiter.off();
	history.pushState({}, '', '/memo/edit?m=' + id);
	memoEdit(id);
}

async function memoEditPublic() {
	if (!currentMemo) return;
	hideMain();
	const main = $('inputPublic');
	main.hidden = false;

	function end() {
		main.hidden = true;
		const id = currentMemo.id;
		currentMemo = null;
		memoEdit(id);
	}
	$e('inputPublicCancel', 'onclick', end);

	const buttons = ['inputPublicNo', 'inputPublicRead', 'inputPublicWrite']
		.map(id => $(id));

	buttons.forEach(b => {
		console.log("parseInt(b.value) === currentMemo.public:",
			parseInt(b.value) === currentMemo.public, b);

		if (parseInt(b.value) === currentMemo.public) {
			b.classList.add('select');
			$e(b, 'onclick', end);
		} else {
			b.classList.remove('select');
			$e(b, 'onclick', async () => {

				console.log("body:", ({
					'0': 'no',
					'1': 'read',
					'2': 'write',
				} [b.value]));

				await waiter.all(fetch('/memo/public?m=' + currentMemo.id, {
					method: 'PATCH',
					headers: new Headers({
						'Content-Type': 'text/plain',
					}),
					body: ({
						'0': 'no',
						'1': 'read',
						'2': 'write',
					} [b.value]),
				}));
				end();
			});
		}
	});
}

async function memoView(id, r, mime) {
	const isr = r !== null;
	hideMain();

	const [meta, text] = await waiter.all(
		fetchJson(`/memo/get?m=${id}`).then(j => {
			j.update = new Date(j.update);
			j.releases = (j.releases || []).map(r => {
				r.date = new Date(r.date);
				return r;
			});
			return j;
		}),
		fetch(`/memo/${isr?'release/':''}get?m=${id}${isr?'&r='+r:''}`, {
			headers: new Headers({
				'Accept': mime,
			}),
		}).then(rep => rep.text())
	);

	document.title = 'Memo: ' + meta.title;
	const t = $('title');
	t.innerText = meta.title;
	addBadge(t, meta.public, isr ? meta.releases[r].date : meta.update);

	const v = $('memoViewContent');
	while (v.children.length) v.children[0].remove();
	v.hidden = false;
	$('memoView').hidden = false;
	$('memoEdit').hidden = true;

	switch (mime) {
	case 'text/plain':
		v.innerText = text;
		v.classList.add('textSpace');
		break;
	case 'text/html':
		v.innerHTML = text;
		v.classList.remove('textSpace');
		break;
	}
}

async function memoDelete() {
	if (!currentMemo) return;
	const m = currentMemo;
	if (await inputConfirm(m.title, `Please confirm to remove this memo. Write '${m.title}'`)) return;

	await waiter.all(fetch('/memo/delete?m=' + m.id));
	history.pushState({}, '', '/');
	currentMemo = null;
	main();
}

async function memoCreateRelease() {
	const m = currentMemo;
	if (!m) return;
	let t = await inputText('Create new release', '', () => memoEdit(m.id));
	if (!t) return;

	await waiter.all(fetch('/memo/release/new?m=' + m.id, {
		method: 'PUT',
		headers: new Headers({
			'Content-Type': 'text/plain',
		}),
		body: t,
	}));

	currentMemo = null;
	history.pushState({}, '', `/memo/release/view?m=${m.id}&r=${m.releases.length}`);
	main();
}
