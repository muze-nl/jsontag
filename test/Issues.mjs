import JSONTag from '../src/JSONTag.mjs'
import { integerRanges, floatRanges } from '../src/lib/types.mjs'
import tap from 'tap'

// Regression tests for issues found in stringify and setType. Where
// JSONTag.stringify should behave like JSON.stringify, the expected value is
// taken from JSON.stringify.

const ids = (jsont) => [...jsont.matchAll(/id="([^"]*)"/g)].map(m => m[1])

// --- toJSON ---

tap.test('Date is stringified as datetime', t => {
	const data = { d: new Date(0) }
	const s = JSONTag.stringify(data)
	t.equal(s, '{"d":<datetime>"1970-01-01T00:00:00.000Z"}')
	const result = JSONTag.parse(s)
	t.equal(JSONTag.getType(result.d), 'datetime')
	t.equal(new Date(result.d).getTime(), 0)
	t.end()
})

tap.test('Date keeps its attributes', t => {
	const d = new Date(0)
	JSONTag.setAttribute(d, 'class', 'birthday')
	t.equal(JSONTag.stringify(d), '<datetime class="birthday">"1970-01-01T00:00:00.000Z"')
	t.end()
})

tap.test('invalid Date is stringified as datetime null', t => {
	t.equal(JSONTag.stringify({ d: new Date(NaN) }), '{"d":<datetime>null}')
	t.end()
})

tap.test('Date outside of the datetime range throws', t => {
	t.throws(() => JSONTag.stringify(new Date('+010000-01-01T00:00:00Z')), TypeError)
	t.throws(() => JSONTag.stringify(new Date('-000001-01-01T00:00:00Z')), TypeError)
	t.end()
})

tap.test('object with toJSON returning a string', t => {
	const data = { o: { toJSON() { return 'foo' } } }
	t.equal(JSONTag.stringify(data), JSON.stringify(data))
	t.end()
})

tap.test('toJSON is called with the property key', t => {
	const data = { x: { toJSON(key) { return 'key='+key } } }
	t.equal(JSONTag.stringify(data), JSON.stringify(data))
	t.end()
})

// --- replacer ---

tap.test('replacer returning undefined omits the property', t => {
	const replacer = (key, value) => key==='drop' ? undefined : value
	const data = { drop: 1, keep: 2 }
	t.equal(JSONTag.stringify(data, replacer), JSON.stringify(data, replacer))
	t.end()
})

tap.test('replacer is applied once per value', t => {
	const replacer = (key, value) => typeof value==='string' ? value+'!' : value
	const data = { x: 's', list: ['a'] }
	t.equal(JSONTag.stringify(data, replacer), JSON.stringify(data, replacer))
	t.end()
})

tap.test('replacer is called for the root object with key ""', t => {
	const replacer = (key, value) => key==='' ? { b: 2 } : value
	const data = { a: 1 }
	t.equal(JSONTag.stringify(data, replacer), JSON.stringify(data, replacer))
	t.end()
})

tap.test('array replacer accepts numbers', t => {
	const data = { 1: 'a', 2: 'b' }
	t.equal(JSONTag.stringify(data, [1]), JSON.stringify(data, [1]))
	t.end()
})

// --- values JSON cannot represent ---

tap.test('function properties are omitted', t => {
	const data = { a: 1, f() {} }
	t.equal(JSONTag.stringify(data), JSON.stringify(data))
	t.end()
})

tap.test('functions in arrays become null', t => {
	const data = [1, () => 1]
	t.equal(JSONTag.stringify(data), JSON.stringify(data))
	t.end()
})

tap.test('symbol properties are omitted', t => {
	const data = { a: 1, s: Symbol('x') }
	t.equal(JSONTag.stringify(data), JSON.stringify(data))
	t.end()
})

// --- space ---

// JSONTag writes no space after the colon, JSON.stringify does when indenting
const indented = (data, space) => JSON.stringify(data, null, space).replace(/": /g, '":')

tap.test('space is limited to 10 characters', t => {
	const data = { a: 1 }
	t.equal(JSONTag.stringify(data, null, 20), indented(data, 20))
	t.equal(JSONTag.stringify(data, null, Infinity), indented(data, Infinity))
	t.equal(JSONTag.stringify(data, null, 1e9), indented(data, 1e9))
	t.equal(JSONTag.stringify(data, null, ' '.repeat(20)), indented(data, ' '.repeat(20)))
	t.end()
})

tap.test('space below 1 means no indentation', t => {
	const data = { a: [1] }
	for (const space of [0, -1, -Infinity, NaN, 0.5]) {
		// by the spec 0.5 is truncated to 0, V8 adds newlines without indentation
		t.equal(JSONTag.stringify(data, null, space), '{"a":[1]}', String(space))
	}
	t.end()
})

tap.test('space as Number or String object', t => {
	const data = { a: [1] }
	t.equal(JSONTag.stringify(data, null, new Number(2)), indented(data, new Number(2)))
	t.equal(JSONTag.stringify(data, null, new String('\t')), indented(data, new String('\t')))
	t.end()
})

tap.test('space of another type is ignored', t => {
	const data = { a: [1] }
	for (const space of [true, {}, [2], null]) {
		t.equal(JSONTag.stringify(data, null, space), indented(data, space), String(space))
	}
	t.end()
})

tap.test('space may only contain whitespace', t => {
	const data = { a: [1] }
	for (const space of ['\t', ' \t', '\n', '\r\n']) {
		const s = JSONTag.stringify(data, null, space)
		t.equal(s, indented(data, space), JSON.stringify(space))
		t.same(JSONTag.parse(s), data, JSON.stringify(space))
	}
	t.throws(() => JSONTag.stringify(data, null, '--'), TypeError)
	t.throws(() => JSONTag.stringify(data, null, ' x'), TypeError)
	// only the first 10 characters are used
	t.doesNotThrow(() => JSONTag.stringify(data, null, ' '.repeat(10)+'x'))
	t.end()
})

// --- setType ---

tap.test('setType rejects a type that does not match the value', t => {
	t.throws(() => JSONTag.setType(new String('abc'), 'int'), TypeError)
	t.throws(() => JSONTag.setType(new String('abc'), 'array'), TypeError)
	t.throws(() => JSONTag.setType(new Number(1), 'object'), TypeError)
	t.throws(() => JSONTag.setType(new Number(1), 'date'), TypeError)
	t.end()
})

tap.test('stringify output can be parsed again', t => {
	const s = new String('abc')
	try {
		JSONTag.setType(s, 'int')
	} catch {
		// rejecting the type is fine too
		t.end()
		return
	}
	t.doesNotThrow(() => JSONTag.parse(JSONTag.stringify(s)))
	t.end()
})

// --- typed numbers ---

const typedNumber = (number, type) => {
	const result = new Number(number)
	JSONTag.setType(result, type)
	return result
}

tap.test('typed numbers out of range throw', t => {
	const invalid = [
		[300, 'int8'], [-129, 'int8'], [-1, 'uint'], [-1, 'uint8'], [65536, 'uint16'],
		[2147483648, 'int32'], [4294967296, 'uint32'], [-1, 'uint64'],
		[3.5e38, 'float32'], [-3.5e38, 'float32'], [1.75e308, 'float64']
	]
	for (const [number, type] of invalid) {
		t.throws(() => JSONTag.stringify(typedNumber(number, type)), TypeError, type+' '+number)
	}
	t.end()
})

tap.test('typed integers must be integers', t => {
	const invalid = [
		[1.5, 'int'], [1.5, 'int8'], [1.5, 'uint'], [1.5, 'int64'], [1.5, 'timestamp'],
		[1e21, 'int'], [1e21, 'uint64']
	]
	for (const [number, type] of invalid) {
		t.throws(() => JSONTag.stringify(typedNumber(number, type)), TypeError, type+' '+number)
	}
	t.end()
})

tap.test('typed numbers in range', t => {
	t.equal(JSONTag.stringify(typedNumber(127, 'int8')), '<int8>127')
	t.equal(JSONTag.stringify(typedNumber(0, 'uint8')), '<uint8>0')
	t.equal(JSONTag.stringify(typedNumber(3.4e38, 'float32')), '<float32>3.4e+38')
	t.equal(JSONTag.stringify(typedNumber(0.5, 'float')), '<float>0.5')
	t.equal(JSONTag.stringify(typedNumber(1.5, 'number')), '1.5')
	t.end()
})

tap.test('typed Number as int64 parses to the same value', t => {
	const s = JSONTag.stringify(typedNumber(2**60, 'int64'))
	t.equal(s, '<int64>1152921504606846976')
	t.equal(JSONTag.parse(s).valueOf(), 2n**60n)
	t.end()
})

tap.test('typed Number as int keeps the shortest form, which parses to the same Number', t => {
	const s = JSONTag.stringify(typedNumber(2**60, 'int'))
	t.equal(s, '<int>1152921504606847000')
	t.equal(JSONTag.parse(s).valueOf(), 2**60)
	t.end()
})

tap.test('typed NaN and Infinity are written as typed null, like JSON', t => {
	t.equal(JSONTag.stringify(typedNumber(NaN, 'float')), '<float>null')
	t.equal(JSONTag.stringify(typedNumber(Infinity, 'int')), '<int>null')
	t.end()
})

tap.test('stringify and parse agree on the range of every number type', t => {
	const safe = [BigInt(Number.MIN_SAFE_INTEGER), BigInt(Number.MAX_SAFE_INTEGER)]
	for (const [type, [min, max]] of Object.entries(integerRanges)) {
		for (const [bound, outside] of [[min, -1n], [max, 1n]]) {
			if (bound===null || bound<safe[0] || bound>safe[1]) {
				continue
			}
			const s = JSONTag.stringify(typedNumber(Number(bound), type))
			t.equal(BigInt(JSONTag.parse(s).valueOf()), bound, s)
			const beyond = bound+outside
			t.throws(() => JSONTag.stringify(typedNumber(Number(beyond), type)), TypeError, type+' '+beyond)
			t.throws(() => JSONTag.parse('<'+type+'>'+beyond), /out of range/, type+' '+beyond)
		}
	}
	for (const [type, [min, max]] of Object.entries(floatRanges)) {
		for (const bound of [min, max]) {
			if (bound===null) {
				continue
			}
			const s = JSONTag.stringify(typedNumber(bound, type))
			t.equal(JSONTag.parse(s).valueOf(), bound, s)
		}
	}
	t.end()
})

// --- unsupported objects ---

tap.test('Map, Set, WeakMap and WeakSet throw', t => {
	for (const value of [new Map([['a', 1]]), new Set([1]), new WeakMap(), new WeakSet()]) {
		t.throws(() => JSONTag.stringify({ value }), TypeError, value.constructor.name)
	}
	t.end()
})

tap.test('Map converted by a replacer', t => {
	const replacer = (key, value) => value instanceof Map ? Object.fromEntries(value) : value
	t.equal(JSONTag.stringify({ m: new Map([['a', 1]]) }, replacer), '{"m":{"a":1}}')
	t.end()
})

tap.test('Map subclass with toJSON', t => {
	class Dictionary extends Map {
		toJSON() {
			return Object.fromEntries(this)
		}
	}
	t.equal(JSONTag.stringify(new Dictionary([['a', 1]])), '{"a":1}')
	t.end()
})

// --- repeated references ---

tap.test('stringify does not modify its input', t => {
	const shared = { a: 1 }
	JSONTag.stringify({ x: shared, y: shared })
	t.same(JSONTag.getAttributes(shared), {})
	t.end()
})

tap.test('equal input gives equal output', t => {
	const make = () => {
		const shared = { a: 1 }
		return { x: shared, y: shared }
	}
	t.equal(JSONTag.stringify(make()), JSONTag.stringify(make()))
	t.end()
})

tap.test('circular array', t => {
	const arr = [1]
	arr.push(arr)
	let s
	t.doesNotThrow(() => { s = JSONTag.stringify(arr) })
	if (s === undefined) {
		t.end()
		return
	}
	const result = JSONTag.parse(s)
	t.equal(result[1], result)
	t.end()
})

tap.test('shared array keeps its identity', t => {
	const list = [1, 2]
	const result = JSONTag.parse(JSONTag.stringify({ a: list, b: list }))
	t.equal(result.a, result.b)
	t.end()
})

tap.test('shared typed string does not repeat its id', t => {
	const d = new String('2020-01-01')
	JSONTag.setType(d, 'date')
	const found = ids(JSONTag.stringify({ a: d, b: d }))
	t.equal(new Set(found).size, found.length, 'no duplicate ids: '+found.join(', '))
	t.end()
})

tap.test('shared Link does not repeat its id', t => {
	const link = new JSONTag.Link('/foo')
	const found = ids(JSONTag.stringify({ a: link, b: link }))
	t.equal(new Set(found).size, found.length, 'no duplicate ids: '+found.join(', '))
	t.end()
})

tap.test('shared typed null does not repeat its id', t => {
	const n = new JSONTag.Null()
	JSONTag.setType(n, 'date')
	const found = ids(JSONTag.stringify({ a: n, b: n }))
	t.equal(new Set(found).size, found.length, 'no duplicate ids: '+found.join(', '))
	t.end()
})

tap.test('object shared via toJSON is linked correctly', t => {
	const inner = { v: 1 }
	class Wrapper {
		toJSON() {
			return { p: inner, q: inner }
		}
	}
	const result = JSONTag.parse(JSONTag.stringify(new Wrapper()))
	t.equal(result.q, result.p)
	t.end()
})

tap.test('object shared via replacer is linked correctly', t => {
	const inner = { v: 1 }
	const replacer = (key, value) => (key==='p' || key==='q') ? inner : value
	const result = JSONTag.parse(JSONTag.stringify({ p: 1, q: 2 }, replacer))
	t.equal(result.q, result.p)
	t.end()
})

// --- README examples ---

tap.test('README: <link>"#source" refers to id="source"', { todo: 'TODO.md #3' }, t => {
	// see TODO.md #3, identity expansion
	const result = JSONTag.parse(`<object id="source">{
	"foo":{
		"bar":"Baz"
	},
	"bar":<link>"#source"
}`)
	t.equal(result.bar, result)
	t.end()
})
