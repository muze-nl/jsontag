import JSONTag from '../src/JSONTag.mjs'
import tap from 'tap'

// Repeated references are written as path links: <link>"#!/json/pointer",
// pointing to the first occurrence of the same object or array.

tap.test('shared object', t => {
	const shared = { a: 1 }
	const s = JSONTag.stringify({ x: shared, y: shared })
	t.equal(s, '{"x":{"a":1},"y":<link>"#!/x"}')
	const result = JSONTag.parse(s)
	t.equal(result.x, result.y)
	t.end()
})

tap.test('shared array', t => {
	const list = [1, 2]
	const s = JSONTag.stringify({ a: list, b: list })
	t.equal(s, '{"a":[1,2],"b":<link>"#!/a"}')
	const result = JSONTag.parse(s)
	t.equal(result.a, result.b)
	t.end()
})

tap.test('cycle to a parent', t => {
	const o = { foo: { bar: { name: 'Bar' } } }
	o.foo.bar.parent = o.foo
	const s = JSONTag.stringify(o)
	t.equal(s, '{"foo":{"bar":{"name":"Bar","parent":<link>"#!/foo"}}}')
	const result = JSONTag.parse(s)
	t.equal(result.foo.bar.parent, result.foo)
	t.end()
})

tap.test('cycle to the root', t => {
	const o = {}
	o.self = o
	const s = JSONTag.stringify(o)
	t.equal(s, '{"self":<link>"#!"}')
	const result = JSONTag.parse(s)
	t.equal(result.self, result)
	t.end()
})

tap.test('path into an array', t => {
	const item = { name: 'item' }
	const s = JSONTag.stringify({ list: [{}, item], pick: item })
	t.equal(s, '{"list":[{},{"name":"item"}],"pick":<link>"#!/list/1"}')
	const result = JSONTag.parse(s)
	t.equal(result.pick, result.list[1])
	t.end()
})

tap.test('/ and ~ in keys are escaped', t => {
	const k = {}
	const s = JSONTag.stringify({ 'a/b': { 'c~d': k }, z: k })
	t.equal(s, '{"a/b":{"c~d":{}},"z":<link>"#!/a~1b/c~0d"}')
	const result = JSONTag.parse(s)
	t.equal(result.z, result['a/b']['c~d'])
	t.end()
})

tap.test('empty key', t => {
	const k = {}
	const s = JSONTag.stringify({ '': k, z: k })
	t.equal(s, '{"":{},"z":<link>"#!/"}')
	const result = JSONTag.parse(s)
	t.equal(result.z, result[''])
	t.end()
})

tap.test('objects with an id are linked by id', t => {
	const o = { name: 'Foo' }
	JSONTag.setAttribute(o, 'id', 'foo')
	const s = JSONTag.stringify({ a: o, b: o })
	t.equal(s, '{"a":<object id="foo">{"name":"Foo"},"b":<link>"foo"}')
	const result = JSONTag.parse(s)
	t.equal(result.a, result.b)
	t.end()
})

tap.test('indented output', t => {
	const shared = { a: 1 }
	const s = JSONTag.stringify({ x: shared, y: shared }, null, 4)
	t.equal(s, `{
    "x":{
        "a":1
    },
    "y":<link>"#!/x"
}`)
	t.end()
})

tap.test('paths follow the keys after the replacer has run', t => {
	const shared = { a: 1 }
	const replacer = (key, value) => key==='skip' ? undefined : value
	const s = JSONTag.stringify({ skip: shared, x: shared, y: shared }, replacer)
	t.equal(s, '{"x":{"a":1},"y":<link>"#!/x"}')
	t.end()
})

tap.test('replacer can break a cycle', t => {
	const o = { name: 'o' }
	o.parent = o
	const replacer = (key, value) => key==='parent' ? undefined : value
	t.equal(JSONTag.stringify(o, replacer), '{"name":"o"}')
	t.end()
})

tap.test('deep graph', t => {
	const n = 2000
	const people = []
	for (let i=0; i<n; i++) {
		people.push({ name: 'p'+i })
	}
	for (let i=0; i<n; i++) {
		people[i].friend = people[(i*7919)%n]
	}
	const result = JSONTag.parse(JSONTag.stringify({ people }))
	t.ok(result.people.every((p, i) => p.friend === result.people[(i*7919)%n]))
	t.end()
})

tap.test('path links are local to each document', t => {
	const parser = new JSONTag.Parser()
	const a = parser.parse('{"x":{"v":"a"},"y":<link>"#!/x"}')
	const b = parser.parse('{"x":{"v":"b"},"y":<link>"#!/x"}')
	t.equal(a.y, a.x)
	t.equal(b.y, b.x)
	t.equal(parser.meta.unresolved.size, 0)
	t.end()
})

tap.test('unresolvable path link', t => {
	t.throws(() => JSONTag.parse('{"x":{},"y":<link>"#!/z"}'), /does not point to an earlier value/)
	t.throws(() => JSONTag.parse('{"x":{},"y":<link>"#!/x/a"}'), /does not point to an earlier value/)
	t.throws(() => JSONTag.parse('{"x":"text","y":<link>"#!/x/a"}'), /does not point to an earlier value/)
	t.end()
})

tap.test('forward path links are rejected', t => {
	const forward = [
		'{"a":<link>"#!/b","b":{}}',
		'[<link>"#!/1",{}]',
		'{"a":{"b":<link>"#!/c"},"c":{}}',
		'{"a":[<link>"#!/a/1",{}]}'
	]
	for (const input of forward) {
		t.throws(() => JSONTag.parse(input), /does not point to an earlier value/, input)
	}
	t.end()
})

tap.test('a path link cannot point to itself', t => {
	t.throws(() => JSONTag.parse('{"a":<link>"#!/a"}'), /does not point to an earlier value/)
	t.throws(() => JSONTag.parse('{"a":{"b":<link>"#!/a/b"}}'), /does not point to an earlier value/)
	t.end()
})

tap.test('backward path links into earlier siblings and open containers', t => {
	const result = JSONTag.parse('{"a":{"b":[{"c":1}]},"d":{"e":<link>"#!/a/b/0","f":<link>"#!/d","g":<link>"#!"}}')
	t.equal(result.d.e, result.a.b[0])
	t.equal(result.d.f, result.d)
	t.equal(result.d.g, result)
	t.end()
})

tap.test('path link into a value parsed as plain JSON', t => {
	const result = JSONTag.parse('{"list":[{"a":1},{"b":2}],"pick":<link>"#!/list/1"}')
	t.equal(result.pick, result.list[1])
	t.end()
})

tap.test('parser can be reused after a rejected path link', t => {
	const parser = new JSONTag.Parser()
	t.throws(() => parser.parse('{"a":{"b":<link>"#!/c"},"c":{}}'))
	const result = parser.parse('{"x":{},"y":<link>"#!/x"}')
	t.equal(result.y, result.x)
	t.end()
})

tap.test('reviver sees path links before they are resolved', t => {
	const seen = []
	const result = JSONTag.parse('{"x":{"a":1},"y":<link>"#!/x"}', function(key, value) {
		if (JSONTag.getType(value)==='link') {
			seen.push(''+value)
		}
		return value
	})
	t.same(seen, ['#!/x'])
	t.equal(result.y, result.x)
	t.end()
})

tap.test('reviver can replace a path link', t => {
	const result = JSONTag.parse('{"x":{"a":1},"y":<link>"#!/x"}', function(key, value) {
		if (key==='y') {
			return 'replaced'
		}
		return value
	})
	t.equal(result.y, 'replaced')
	t.end()
})

tap.test('path links resolve to the revived value', t => {
	const result = JSONTag.parse('{"x":{"a":1},"y":<link>"#!/x"}', function(key, value) {
		if (key==='x') {
			return { revived: true }
		}
		return value
	})
	t.equal(result.y, result.x)
	t.same(result.y, { revived: true })
	t.end()
})
