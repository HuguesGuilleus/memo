/* Arveto Memo
BSD 3-Clause License
Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved. */

function editorKeyDown(event: KeyboardEvent) {
	const selection: Selection | null = document.getSelection();
	if (selection == null) return;

	switch (event.key) {
		case 'Tab':
			let nodes: Text[] = [];
			switch (selection.type) {
				case 'Caret':
					let n = selection.anchorNode;
					if (n instanceof Text) nodes.push(n);
					break;
				case 'Range':
					const r = selection.getRangeAt(0),
						start = r.startContainer,
						end = r.endContainer;
					let walker = document.createTreeWalker(
						r.commonAncestorContainer,
						NodeFilter.SHOW_TEXT
					);
					let before = true;
					for (let n = walker.nextNode(); n != null; n = walker.nextNode()) {
						if (before) {
							if (n == start) {
								before = false;
							} else continue;
						}
						if (n instanceof Text) nodes.push(n);
						if (n == end) break;
					}
					break;
				default:
					return;
			}
			if (event.shiftKey) {
				nodes
					.filter(n => n.substringData(0, 1) === '\t')
					.forEach(n => n.deleteData(0, 1));
			} else if (nodes.length === 1) {
				nodes[0].insertData(selection.anchorOffset, '\t');
				selection.collapse(nodes[0], selection.anchorOffset + 1);
			} else {
				nodes.forEach(n => n.insertData(0, '\t'));
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
					const n = <Text>selection.anchorNode;
					n.insertData(selection.anchorOffset, k + quoteOposite(k));
					selection.collapse(n, selection.anchorOffset + 1);
					break;
				case 'Range':
					const r = selection.getRangeAt(0);
					(<Text>r.startContainer).insertData(r.startOffset, k);
					(<Text>r.endContainer).insertData(r.endOffset, quoteOposite(k));
					r.setEnd(r.endContainer, r.endOffset + 1);
					break;
				default: return;
			}
			break;
		default:
			return;
	}
	event.preventDefault();
}


// Return the ending char for quoting a sequence:
function quoteOposite(c: string): string {
	switch (c) {
		case '(': return ')';
		case '{': return '}';
		case '[': return ']';
		case '<': return '>';
		case '«': return '»';
		case '“': return '”';
	}
	return '';
}
