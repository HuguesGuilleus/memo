/* Arveto Memo
BSD 3-Clause License
Copyright (c) 2020, Arveto Ink, see AUTHOR list file. All rights reserved. */

function hideMain() {
	let mains = document.getElementsByTagName('main');
	for (let i = 0; i < mains.length; i++) {
		mains[i].hidden = true
	}
}

// Return a Promise with the text inside.
function inputText(info, value, cancel) {
	hideMain();
	let group = $('input');
	group.hidden = false;

	let input = $('inputText');
	input.value = value;
	input.placeholder = '';
	input.focus();

	$('inputInfo').innerText = info;

	return new Promise(resolve => {
		function end() {
			let v = input.value;
			if (!v) return;
			resolve(v);
		};

		$e('inputSubmit', 'onclick', end);
		$e(input, 'onkeydown', e => {
			if (e.key === 'Enter') end();
		});

		$e('inputCancel', 'onclick', () => {
			resolve(null);
			cancel();
		});
	}).finally(v => {
		group.hidden = true;
	});
}

// Return a Promise that resole with false if the user confirm and true to
// cancel.
function inputConfirm(value, info) {
	hideMain();
	const group = $('input');
	group.hidden = false;
	$('inputInfo').innerText = info;

	let input = $('inputText');
	input.placeholder = value;
	input.value = '';
	input.focus();

	return new Promise(resolve => {
		function end() {
			if (value === input.value) resolve(false);
		};

		const submit = $('inputSubmit');
		submit.hidden = true;
		$e(submit, 'onclick', end);
		$e(input, 'onkeydown', e => {
			if (e.key === 'Enter') end();
		});
		$e(input, 'oninput', () => {
			submit.hidden = value !== input.value;
		});
		$e('inputCancel', 'onclick', () => resolve(true));
	}).finally(v => {
		group.hidden = true;
	});
}

function $new(parent, t, id, cl, text) {
	let el = document.createElement(t);
	if (id) el.id = id;
	if (typeof cl === 'string') cl = [cl];
	for (let c of (cl || [])) {
		el.classList.add(c);
	}
	if (text) el.innerText = text;
	parent.append(el);
	return el;
}

// Create a element a like $new with an href
function $anchor(parent, id, cl, text, href) {
	let a = $new(parent, 'a', id, cl, text);
	if (href) a.href = href;
	return a;
}

// document.getElementById
function $(id) {
	return document.getElementById(id);
}

// Add an event handler of type e to the elment el (a id String or the element).
function $e(el, e, cb) {
	el = (typeof el === 'string' ? $(el) : el);
	if (e.indexOf('on') === 0) {
		el[e] = cb;
	} else {
		el.addEventListener(e, cb);
	}
}

// document.querySelectorAll(q) into a Array
function $qsa(q) {
	return Array.from(document.querySelectorAll(q));
}

// On click onver a, add a history state and call main.
function $goto(a) {
	a.addEventListener('click', event => {
		event.preventDefault();
		history.pushState({}, '', a.href);
		main();
	});
}

async function fetchText(url, body, opt) {
	if (!opt) {
		opt = {
			headers: new Headers({
				'Accept': 'text/plain',
			}),
		};
	};
	if (body) {
		opt.body = body;
		switch ((opt.method || '').toUpperCase()) {
		case 'GET':
		case 'HEAD':
		case '':
			opt.method = 'POST';
		}
	};
	return fetch(url, opt).then(rep => rep.text());
}

async function fetchJson(url, body, opt) {
	if (!opt) {
		opt = {
			headers: new Headers({
				'Accept': 'application/json',
			}),
		};
	};
	if (body) {
		opt.body = body;
		switch ((opt.method || '').toUpperCase()) {
		case 'GET':
		case 'HEAD':
		case '':
			opt.method = 'POST';
		}
	};
	return fetch(url, opt).then(rep => rep.json());
}
