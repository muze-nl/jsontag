import JSONTag from '../src/JSONTag.mjs'
import tap from 'tap'
import { runInNewContext } from 'node:vm'

// The value contract shared with od-jsontag and its Rust implementation,
// adapted from the jsontag-corrected-contract bundle. Differences, by choice:
// - an untyped BigInt above the int64 maximum is written as <uint64>
// - a safe <timestamp> is parsed as a Number object
// - the parser accepts unpaired UTF-16 surrogates, only the writer rejects them

// --- exact integers ---

tap.test('exact 64-bit values keep metadata through parse, stringify and clone', t => {
	const values = [
		['int64', -(2n**63n)], ['int64', 2n**63n-1n],
		['uint64', 2n**64n-1n], ['uint64', 0n],
		['timestamp', 9007199254740993n]
	]
	for (const [type, n] of values) {
		const text = `<${type} id="x">${n}`
		const v = JSONTag.parse(text)
		t.equal(v.valueOf(), n, text)
		t.equal(JSONTag.getAttribute(v, 'id'), 'x', text)
		t.equal(JSONTag.stringify(v), text)
		t.equal(JSONTag.stringify(JSONTag.clone(v)), text)
	}
	t.end()
})

tap.test('parse rejects integers that would lose precision', t => {
	const invalid = [
		'9007199254740992', '-9007199254740992', '9007199254740993',
		'{"n":9007199254740993}', '[1,9007199254740993]',
		'{"a":<text>"x","n":9007199254740993}',
		'{"a":<text>"x","b":{"n":9007199254740993}}',
		'<number>9007199254740993',
		'<int>9007199254740992', '<uint>9007199254740993',
		'1e300', '{"a":1.5e20}'
	]
	for (const text of invalid) {
		t.throws(() => JSONTag.parse(text), /beyond 2\^53|out of range|integer value/, text)
	}
	t.end()
})

tap.test('parse accepts safe integers and floats', t => {
	t.equal(JSONTag.parse('9007199254740991'), 9007199254740991)
	t.equal(JSONTag.parse('-9007199254740991'), -9007199254740991)
	t.same(JSONTag.parse('{"a":1.5,"b":1e2,"c":"12345678901234567890"}'), { a: 1.5, b: 100, c: '12345678901234567890' })
	t.equal(JSONTag.parse('<float>1e300').valueOf(), 1e300)
	t.equal(JSONTag.parse('<float64>9007199254740993').valueOf(), 9007199254740992)
	t.equal(JSONTag.parse('<int64>9007199254740993').valueOf(), 9007199254740993n)
	t.end()
})

tap.test('stringify rejects Numbers that may have lost precision', t => {
	for (const n of [2**53, -(2**53), 2**60, 1e300, 6.022e23, new Number(2**60)]) {
		t.throws(() => JSONTag.stringify(n), TypeError, String(n))
		t.throws(() => JSONTag.stringify({ n }), TypeError, String(n))
	}
	t.end()
})

tap.test('stringify writes safe integers, floats and explicit float types', t => {
	t.equal(JSONTag.stringify([2**53-1, -(2**53-1), 1.5, 0.1, -0]), '[9007199254740991,-9007199254740991,1.5,0.1,0]')
	const big = new Number(6.022e23)
	JSONTag.setType(big, 'float64')
	t.equal(JSONTag.stringify(big), '<float64>6.022e+23')
	t.end()
})

tap.test('NaN and Infinity are written as null, like JSON', t => {
	t.equal(JSONTag.stringify([NaN, Infinity, -Infinity]), '[null,null,null]')
	t.end()
})

// --- formatNumber ---

tap.test('formatNumber', t => {
	t.equal(JSONTag.formatNumber(42), '42')
	t.equal(JSONTag.formatNumber(42n), '42')
	t.equal(JSONTag.formatNumber(new Number(1.5), 'float'), '1.5')
	t.equal(JSONTag.formatNumber(Object(2n**63n)), '9223372036854775808')
	t.equal(JSONTag.formatNumber(42, 'int64'), '42')
	t.equal(JSONTag.formatNumber(NaN), 'null')
	t.throws(() => JSONTag.formatNumber(2**53, 'int64'), TypeError)
	t.throws(() => JSONTag.formatNumber(2**53), TypeError)
	t.throws(() => JSONTag.formatNumber(1.5, 'int'), TypeError)
	t.throws(() => JSONTag.formatNumber(300, 'int8'), TypeError)
	t.throws(() => JSONTag.formatNumber(1n, 'float'), TypeError)
	t.throws(() => JSONTag.formatNumber(2n**64n), TypeError)
	t.throws(() => JSONTag.formatNumber('42'), TypeError)
	t.end()
})

// --- zero and booleans ---

tap.test('isZero', t => {
	const zeros = [0, -0, 0n, new Number(0), Object(0n), JSONTag.parse('<int64 id="z">0'),
		runInNewContext('Object(0n)'), runInNewContext('new Number(0)')]
	for (const v of zeros) {
		t.equal(JSONTag.isZero(v), true, String(v))
	}
	const others = [false, new Boolean(false), '0', new String('0'), null, undefined, NaN, 1, 1n, {},
		{ valueOf() { throw new Error('must not run') } }]
	for (const v of others) {
		t.equal(JSONTag.isZero(v), false, String(v))
	}
	// typed numbers are wrapper objects, which are always truthy
	t.equal(Boolean(JSONTag.parse('<int64>0')), true)
	t.end()
})

tap.test('isBigIntValue', t => {
	t.equal(JSONTag.isBigIntValue(1n), true)
	t.equal(JSONTag.isBigIntValue(Object(1n)), true)
	t.equal(JSONTag.isBigIntValue(runInNewContext('Object(1n)')), true)
	t.equal(JSONTag.isBigIntValue(1), false)
	t.equal(JSONTag.isBigIntValue(new Number(1)), false)
	t.equal(JSONTag.isBigIntValue('1'), false)
	t.end()
})

tap.test('booleans cannot be tagged', t => {
	t.throws(() => JSONTag.parse('<boolean>false'))
	t.throws(() => JSONTag.parse('<boolean id="x">true'))
	t.equal(JSONTag.parse('false'), false)
	const wrapped = new Boolean(false)
	JSONTag.setAttribute(wrapped, 'id', 'x')
	t.throws(() => JSONTag.stringify(wrapped), TypeError)
	t.equal(JSONTag.stringify(new Boolean(false)), 'false')
	t.end()
})

// --- strings and attributes ---

tap.test('quoteString and assertUnicode', t => {
	t.equal(JSONTag.quoteString('a"b\n😀'), '"a\\"b\\n😀"')
	t.equal(JSONTag.assertUnicode('😀'), '😀')
	t.throws(() => JSONTag.quoteString('\uD800'), TypeError)
	t.throws(() => JSONTag.assertUnicode('a\uDC00'), TypeError)
	t.throws(() => JSONTag.assertUnicode(1), TypeError)
	t.end()
})

tap.test('stringify rejects unpaired surrogates, also via toJSON and hidden attributes', t => {
	for (const v of ['\ud800', new String('\udfff'), { '\ud800': 1 }, { a: ['\ud800'] }, { toJSON() { return '\ud800' } }]) {
		t.throws(() => JSONTag.stringify(v), TypeError)
	}
	const bypass = {}
	bypass[Symbol['JSONTag:Attributes']] = { id: '\ud800' }
	t.throws(() => JSONTag.stringify(bypass), TypeError)
	t.equal(JSONTag.stringify(JSONTag.parse('<string id="😀">"😀"')), '<string id="😀">"😀"')
	t.end()
})

tap.test('attribute names must be valid', t => {
	for (const name of ['\ud800', 'a b', '1a', '', 'a-b', 'a"b']) {
		const o = {}
		JSONTag.setAttribute(o, name, 'x')
		t.throws(() => JSONTag.stringify(o), TypeError, JSON.stringify(name))
	}
	for (const name of ['a', 'A1', 'data_id', 'ontologyURL']) {
		const o = {}
		JSONTag.setAttribute(o, name, 'x')
		const s = JSONTag.stringify(o)
		t.equal(JSONTag.getAttribute(JSONTag.parse(s), name), 'x', name)
	}
	t.end()
})

// --- colors, ranges and floats ---

tap.test('hex colors', t => {
	for (const v of ['#abc', '#ABCD', '#00ffAA', '#001122FF']) {
		const text = '<color>"'+v+'"'
		t.equal(JSONTag.stringify(JSONTag.parse(text)), text)
	}
	for (const v of ['#ab', '#abcde', '#aabbccg', '#ggg', '#', 'abc']) {
		t.throws(() => JSONTag.parse('<color>"'+v+'"'), v)
	}
	t.end()
})

tap.test('ranges and float spellings', t => {
	t.equal(JSONTag.stringify(JSONTag.parse('<range>"[-1.5,2]"')), '<range>"[-1.5,2]"')
	for (const text of ['<float>1e2', '<float32>1.0', '<float64>1e+100']) {
		t.ok(Number.isFinite(JSONTag.parse(text).valueOf()), text)
	}
	t.end()
})
