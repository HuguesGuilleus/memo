/* Arveto Memo
BSD 3-Clause License
Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved. */

namespace display {
	var listMain: HTMLElement,
		mains: HTMLElement[],
		memoEdit: HTMLElement,
		memoSingle: HTMLElement,
		memoViewContent: HTMLElement,
		memoView: HTMLElement,
		titleElement: HTMLHeadingElement,
		wait: HTMLElement;

	/// Init display
	export function init() {
		mains = Array.from(document.querySelectorAll('main'));
		listMain = $('memoListGroup');
		mains.push(memoView = $('memoView'));
		mains.push(memoEdit = $('memoEdit'));
		mains.push(memoViewContent = $('memoViewContent'));
		mains.push(wait = $('wait'));
		titleElement = $<'h1'>('title');
		memoSingle = $('memoSingle');

		const memoListSearch: HTMLInputElement = $<'input'>('memoListSearch');
		memoListSearch.addEventListener('input',
			() => model.listSearchSet(memoListSearch.value));

		document.querySelectorAll('a.goto').forEach(a => {
			const u = new CustomURL((<HTMLAnchorElement>a).href);
			a.addEventListener('click', e => {
				e.preventDefault();
				model.url = u;
			});
		});
	}
	// Update from model.kind URL
	export function update(model: Model) {
		mains.forEach(main => main.hidden = true);
		switch (model.url.kind) {
			case URLKind.List:
				title('List');
				return listMain.hidden = false;
			case URLKind.View:
			case URLKind.Html:
				memoView.hidden = false;
				memoViewContent.hidden = false;
				content(model);
				return;
			case URLKind.Editor:
				memoView.hidden = false;
				memoEdit.hidden = false;
				editor(model);
				return;
			// case URLKind.New : return x.hidden = false;
		}
	}
	// Set the title of the document
	function title(t: string) {
		document.title = t;
		titleElement.innerText = t;
		history.replaceState({}, t);
	}
	// Display the waiter then a notification.
	function waiting<T>(p: Promise<T>, notif: string): Promise<T> {
		wait.hidden = false;
		return p.then(v => {
			const el = $new('div', document.body, '', ['notif'], notif);
			el.addEventListener('click', () => el.remove())
			setTimeout(() => el.remove(), 2000);
			return v;
		}).finally(() => wait.hidden = true);
	}

	/// Update the content from the model.
	export function content(model: Model) {
		switch (model.url.kind) {
			case URLKind.Html:
				return memoViewContent.innerHTML = model.content;
			case URLKind.View:
				return memoViewContent.innerText = model.content;
			default:
				return memoViewContent.innerText = '';
		}
	}

	// Display the editor.
	export function editor(model: Model) {
		Array.from(memoEdit.children).forEach(child => child.remove());
		model.content.split(/\r?\n/).forEach((l, i) => {
			return $new('li', memoEdit, `l-${i}`, [], l);
		});
	}
	// Get the text from edito block.
	function editorText(): string {
		return Array.from(memoEdit.children)
			.map(li => li.textContent)
			.join('\n');
	}
	export function editorSave() {
		if (model.url.kind !== URLKind.Editor) return;
		waiting(fetch('/memo/text?m=' + model.url.memo, {
			method: 'POST',
			headers: new Headers({
				'Content-Type': 'text/plain',
			}),
			body: editorText(),
		}), 'Memo saved');
	}
	export async function editorFormat() {
		if (model.url.kind !== URLKind.Editor) return;
		model.content = await waiting(
			fetch('/format', {
				method: 'POST',
				headers: new Headers({
					'Content-Type': 'text/plain',
				}),
				body: editorText(),
			}).then(rep => rep.text()),
			'Memo formated');
	}

	// Display information about the current memo.
	var memoBlock: HTMLElement | null = null;
	export function memo(model: Model) {
		if (model.memo === null) {
			if (model.url.memo !== null) {
				title('');
			}
			if (memoBlock) {
				memoBlock.remove();
				memoBlock = null;
			}
		} else {
			let r = model.url.release;
			if (r !== null) {
				title(`Release: ${model.memo.releases[r].title} (${model.memo.title})`);
			} else {
				title('Memo: ' + model.memo.title);
			}
			if (memoBlock) memoBlock.remove();
			memoBlock = createMemoBloc(model.memo, memoSingle);
		}
	}

	/* LIST */
	var listMemos: {
		memo: Memo,
		group: HTMLElement,
	}[] = [];
	// update the content list. No change main list hidden.
	export function listUpdate() {
		listMemos.forEach(m => m.group.remove());
		listMemos = model.list.map(m => ({
			memo: m,
			group: createMemoBloc(m, listMain),
		}));
		listSearch();
	}
	// Create a bloc for one memo. Used in the list or when display or edit
	// one memo.
	function createMemoBloc(m: Memo, parent: HTMLElement): HTMLElement {
		// Add to parent the HTML anchor. If click, chanhe model url.
		function newAnchor(url: CustomURL, parent: HTMLElement, cl: string[]): HTMLAnchorElement {
			let a = $new_a(parent, '', cl, '', url.toString());
			a.addEventListener('click', e => {
				e.preventDefault();
				model.url = url;
			});
			return a;
		}

		const li = $new('li', parent, '', ['memoItem'], '');
		const gTitle: HTMLDivElement = $new('div', li, '', ['memoItemLink'], '');
		const releaseGroup: HTMLDivElement = $new('div', li, '', ['memoItemRealseGroup'], '');

		const a = newAnchor(CustomURL.new(URLKind.Editor, m.id), gTitle, ['memoItemLinkName']);
		a.innerText = m.title;
		addBadge(a, m.public, m.update);

		let viewer = $new('div', gTitle, '', [], '');
		newAnchor(CustomURL.new(URLKind.Html, m.id), viewer, ['memoItemLinkImg', 'imgHTML']).title = 'View HTML';
		newAnchor(CustomURL.new(URLKind.View, m.id), viewer, ['memoItemLinkImg', 'imgCode']).title = 'View source';
		$new_a(gTitle, '', ['memoItemLinkImg', 'imgPDF'], '', `/memo/get?f=pdf&m=${m.id}`)
			.title = 'Download PDF';

		m.releases.forEach((r, i) => {
			const g = $new('div', releaseGroup, '', ['memoItemLink'], '');

			let a = newAnchor(CustomURL.new(URLKind.Html, m.id, i), g, ['memoItemLinkName'])
			a.innerText = r.title;
			addBadge(a, Public.No, r.date);

			newAnchor(CustomURL.new(URLKind.View, m.id, i), g, ['memoItemLinkImg', 'imgCode']).title = 'View source';
			$new_a(g, '', ['memoItemLinkImg', 'imgPDF'], '', `/memo/release/get?f=pdf&m=${m.id}&r=${i}`)
				.title = 'Download PDF';
		});

		return li;
	}
	// Apply the regexp to the memo list.
	export function listSearch() {
		listMemos.forEach(({ memo, group }) => {
			group.hidden = !model.listSearch.test(memo.title) &&
				!memo.releases.some(r => model.listSearch.test(r.title));
		});
	}
	// Add date and public level badge.
	function addBadge(parent: HTMLElement, pub: Public, date: Date) {
		$new('span', parent, '', ['badge'], date.toLocaleDateString()).title = date.toLocaleString();
		switch (pub) {
			case Public.Read:
				$new('span', parent, '', ['badge'], 'Read').title = 'Every on who had this link can view this memo.';
				break;
			case Public.Write:
				$new('span', parent, '', ['badge'], 'Write').title = 'Every on who had this link can view and edit this memo.';
		}
	}

	/* DOM */
	/// Get element by id. Threw exeption if the element doesn't exit.
	function $<N extends keyof HTMLElementTagNameMap>(id: string): HTMLElementTagNameMap[N] {
		let e = document.getElementById(id);
		if (e == null) {
			throw new Error(`The element with id:${id} not found`);
		}
		return <HTMLElementTagNameMap[N]>e;
	}
	// Create a new alement of type n, attach it to parent (if exist)
	// Set an id, classes and innerText.
	function $new<N extends keyof HTMLElementTagNameMap>
		(n: N, parent: null | HTMLElement, id: string, cl: string[], text: string): HTMLElementTagNameMap[N] {
		const e: HTMLElementTagNameMap[N] = document.createElement(n);
		if (parent !== null) {
			parent.append(e);
		}
		if (id) e.id = id;
		e.classList.add(...cl);
		e.innerText = text;
		return e;
	}
	// Create a new anchor.
	function $new_a(parent: null | HTMLElement, id: string, cl: string[], text: string, href: string): HTMLAnchorElement {
		let a: HTMLAnchorElement = $new('a', parent, id, cl, text);
		a.href = href;
		return a;
	}
	function panic<T>(v: null | T): T {
		if (v == null) {
			throw "null element";
		} else {
			return v;
		}
	}
}
