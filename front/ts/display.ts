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
		titleElement: HTMLHeadingElement;

	/// Init display
	export function init() {
		mains = Array.from(document.querySelectorAll('main'));
		listMain = $('memoListGroup');
		mains.push(memoView = $('memoView'));
		mains.push(memoEdit = $('memoEdit'));
		mains.push(memoViewContent = $('memoViewContent'));
		titleElement = $<'h1'>('title');
		memoSingle = $('memoSingle');

		const memoListSearch: HTMLInputElement = $<'input'>('memoListSearch');
		memoListSearch.addEventListener('input',
			() => model.listSearchSet(memoListSearch.value));
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
				memoEdit.hidden = true;
				memoViewContent.hidden = false;
				content(model);
				return;
			// case URLKind.Editor: return x.hidden = false;
			// case URLKind.New : return x.hidden = false;
		}
	}
	// Set the title of the document
	function title(t: string) {
		document.title = t;
		titleElement.innerText = t;
		history.replaceState({}, t);
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
			title(model.memo.title);
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

		// TODO: use URLKind.Editor
		const a = newAnchor(CustomURL.new(URLKind.Html, m.id), gTitle, ['memoItemLinkName']);
		a.innerText = m.title;
		addBadge(a, m.public, m.update);

		newAnchor(CustomURL.new(URLKind.View, m.id), gTitle, ['memoItemLinkImg', 'imgHTML']).title = 'View source';
		$new_a(gTitle, '', ['memoItemLinkImg', 'imgPDF'], '', `/memo/get?f=pdf&m=${m.id}`)
			.title = 'Download PDF';

		m.releases.forEach((r, i) => {
			const g = $new('div', releaseGroup, '', ['memoItemLink'], '');

			let a = newAnchor(CustomURL.new(URLKind.Html, m.id, i), g, ['memoItemLinkName'])
			a.innerText = r.title;
			addBadge(a, Public.No, r.date);

			newAnchor(CustomURL.new(URLKind.View, m.id, i), g, ['memoItemLinkImg', 'imgHTML']).title = 'View source';
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
