import JSONTag from '../src/JSONTag.mjs'
import tap from 'tap'

// Unpaired UTF-16 surrogates are valid in javascript strings, but not in
// Unicode text: they cannot be encoded as UTF-8, e.g. in a Rust String. So
// stringify does not write them, escaped or not. The parser accepts them.
// Valid surrogate pairs are fine.

const lone = ['\uD800', '\uDBFF', '\uDC00', '\uDFFF', 'a\uD800b', '\uDC00\uD800', '\uD83D']

// output must survive encoding to UTF-8 unchanged
const utf8RoundTrip = (s) => new TextDecoder().decode(new TextEncoder().encode(s)) === s

// --- stringify ---

tap.test('stringify rejects unpaired surrogates in strings', t => {
	for (const s of lone) {
		t.throws(() => JSONTag.stringify(s), TypeError, JSON.stringify(s))
		t.throws(() => JSONTag.stringify({ a: s }), TypeError, JSON.stringify(s))
		t.throws(() => JSONTag.stringify([s]), TypeError, JSON.stringify(s))
	}
	t.end()
})

tap.test('stringify rejects unpaired surrogates in keys', t => {
	for (const s of lone) {
		t.throws(() => JSONTag.stringify({ [s]: 1 }), TypeError, JSON.stringify(s))
	}
	t.end()
})

tap.test('stringify rejects unpaired surrogates in typed strings', t => {
	const value = new String('a\uD800')
	JSONTag.setType(value, 'text')
	t.throws(() => JSONTag.stringify(value), TypeError)
	t.end()
})

tap.test('stringify accepts valid surrogate pairs', t => {
	const data = { '😀': '😀 😀 𝄞' }
	const s = JSONTag.stringify(data)
	t.equal(s, JSON.stringify(data))
	t.ok(utf8RoundTrip(s))
	t.same(JSONTag.parse(s), data)
	t.end()
})

// --- attributes ---

tap.test('stringify rejects unpaired surrogates in attribute values', t => {
	for (const s of lone) {
		const o = {}
		JSONTag.setAttribute(o, 'class', s)
		t.throws(() => JSONTag.stringify(o), TypeError, JSON.stringify(s))
		t.throws(() => JSONTag.getAttributesString(o), TypeError, JSON.stringify(s))
	}
	t.end()
})

tap.test('attribute values are escaped as JSON strings', t => {
	const values = ['a\\b', 'line\nbreak', 'tab\there', 'ctrl\u0001', 'é😀', '\\u0041']
	for (const value of values) {
		const o = {}
		JSONTag.setAttribute(o, 'title', value)
		const s = JSONTag.stringify(o)
		t.ok(utf8RoundTrip(s), JSON.stringify(value))
		t.equal(JSONTag.getAttribute(JSONTag.parse(s), 'title'), value, JSON.stringify(value))
	}
	t.end()
})

tap.test('getAttributesString escapes values', t => {
	const o = {}
	JSONTag.setAttribute(o, 'title', 'a\\b\nc')
	t.equal(JSONTag.getAttributesString(o), 'title="a\\\\b\\nc"')
	t.end()
})

tap.test('plain attribute values are unchanged', t => {
	const jsont = '<object class="foo bar" id="1">{"name":"Foo"}'
	t.equal(JSONTag.stringify(JSONTag.parse(jsont)), jsont)
	t.end()
})

// --- parse ---

const escape = (s) => [...s].map(c => '\\u'+c.charCodeAt(0).toString(16).padStart(4, '0')).join('')

tap.test('parse accepts unpaired surrogates, stringify does not write them back', t => {
	for (const s of lone) {
		const e = escape(s)
		const inputs = [
			['"'+e+'"', r => r],                                   // plain JSON
			['<text>"'+e+'"', r => r.valueOf()],                   // tagged value
			['{"b":<text>"x","'+e+'":1}', r => Object.keys(r)[1]], // key
			['<object class="'+e+'">{}', r => JSONTag.getAttribute(r, 'class')], // attribute
			['<text>"'+s+'"', r => r.valueOf()]                    // raw, not escaped
		]
		for (const [input, get] of inputs) {
			let result
			t.doesNotThrow(() => { result = JSONTag.parse(input) }, JSON.stringify(input))
			t.equal(get(result), s, JSON.stringify(input))
			t.throws(() => JSONTag.stringify(result), TypeError, JSON.stringify(input))
		}
	}
	t.end()
})

tap.test('parse accepts escaped surrogate pairs', t => {
	const e = '\\ud83d\\ude00'
	t.equal(JSONTag.parse('"'+e+'"'), '😀')
	t.equal(JSONTag.parse('<text>"'+e+'"').valueOf(), '😀')
	t.same(JSONTag.parse('{"b":<text>"x","c":{"'+e+'":"'+e+'"}}').c, { '😀': '😀' })
	t.equal(JSONTag.getAttribute(JSONTag.parse('<object class="'+e+'">{}'), 'class'), '😀')
	t.end()
})

tap.test('an escaped backslash before u is not a surrogate escape', t => {
	t.equal(JSONTag.parse('"\\\\ud800"'), '\\ud800')
	t.equal(JSONTag.parse('<text>"\\\\ud800"').valueOf(), '\\ud800')
	t.end()
})
