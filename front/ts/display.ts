/* Arveto Memo
BSD 3-Clause License
Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved. */

namespace display {
	enum Kind {
		None = 0,
		List,
	}
	var kind: Kind = Kind.None;

	/* LIST */
	var listMain: HTMLElement;
	var listMemos: {
		memo: Memo,
		group: HTMLElement,
	}[] = [];
	// update the content list. No change main list hidden.
	export function listUpdate() {
		listMemos = model.list.map(m => {
			const g = $new('li', listMain, '', ['memoItem'], '');
			const gTitle: HTMLDivElement = $new('div', g, '', ['memoItemLink'], '');
			const a: HTMLAnchorElement = $new_a(gTitle, '', ['memoItemLinkName'], m.title, '');
			addBadge(a, m.public, m.update);

			$new_a(gTitle, '', ['memoItemLinkImg', 'imgHTML'], '', `/memo/html?m=${m.id}`)
				.title = 'View HTML';
			$new_a(gTitle, '', ['memoItemLinkImg', 'imgPDF'], '', `/memo/get?f=pdf&m=${m.id}`)
				.title = 'Download PDF';

			const releaseGroup: HTMLDivElement = $new('div', g, '', ['memoItemRealseGroup'], '');
			m.releases.forEach((r, i) => {
				const g = $new('div', releaseGroup, '', ['memoItemLink'], '');
				const a: HTMLAnchorElement = $new_a(g, '', ['memoItemLinkName'], r.title, '');
				addBadge(a, Public.No, r.date);
				$new_a(g, '', ['memoItemLinkImg', 'imgHTML'], '', `/memo/release/html?m=${m.id}&r=${i}`)
					.title = 'View HTML';
				$new_a(g, '', ['memoItemLinkImg', 'imgPDF'], '', `/memo/release/get?f=pdf&m=${m.id}&r=${i}`)
					.title = 'Download PDF';
			});

			return {
				memo: m,
				group: g,
			};
		});
	}
	// Apply the regexp to the memo list.
	export function listSearch() {
		console.log('listSearch()'),
			listMemos.forEach(({ memo, group }) => {
				group.hidden = !model.listSearch.test(memo.title) &&
					!memo.releases.some(r => model.listSearch.test(r.title));
			})
	}

	/* SMALLS TOOLS */
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

	/// Init display
	export function init() {
		document.querySelectorAll('main').forEach(main => main.hidden = true);
		listMain = panic(document.getElementById('memoListGroup'));
		listMain.hidden = false;

		const memoListSearch: HTMLInputElement = $<'input'>('memoListSearch');
		memoListSearch.addEventListener('input',
			() => model.listSearchSet(memoListSearch.value));
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
	/// Create a new alement of type n, attach it to parent (if exist)
	/// Set an id, classes and innerText.
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
	/// Create a new anchor.
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

document.addEventListener('DOMContentLoaded', () => {
	display.init();

	model.loadList();
}, { once: true, });
