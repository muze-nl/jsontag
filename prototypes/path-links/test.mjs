import tap from 'tap'
import JSONTag from '../../src/JSONTag.mjs'
import { stringify } from './stringify-path.mjs'
import PathParser from './PathParser.mjs'

const parse = (s, reviver) => new PathParser().parse(s, reviver)

tap.test('plain trees are unchanged', t => {
	const data = { name: 'John', tags: ['a','b'], address: { city: 'X' } }
	t.equal(stringify(data), JSONTag.stringify(data))
	t.equal(stringify(data, null, 4), JSONTag.stringify(data, null, 4))
	t.end()
})

tap.test('shared object', t => {
	const shared = { a: 1 }
	const s = stringify({ x: shared, y: shared })
	t.equal(s, '{"x":{"a":1},"y":<link>"#/x"}')
	const r = parse(s)
	t.equal(r.x, r.y)
	t.end()
})

tap.test('input is not mutated, output is deterministic', t => {
	const shared = { a: 1 }
	const data = { x: shared, y: shared }
	t.equal(stringify(data), stringify(data))
	t.same(JSONTag.getAttributes(shared), {})
	t.end()
})

tap.test('cycle to an open ancestor', t => {
	const o = { foo: { bar: { name: 'Bar' } } }
	o.foo.bar.parent = o.foo
	const s = stringify(o)
	t.equal(s, '{"foo":{"bar":{"name":"Bar","parent":<link>"#/foo"}}}')
	const r = parse(s)
	t.equal(r.foo.bar.parent, r.foo)
	t.end()
})

tap.test('cycle to the root', t => {
	const self = {}
	self.me = self
	t.equal(stringify(self), '{"me":<link>"#"}')
	const r = parse(stringify(self))
	t.equal(r.me, r)
	t.end()
})

tap.test('array cycle', t => {
	const arr = [1]
	arr.push(arr)
	const s = stringify(arr)
	t.equal(s, '[1,<link>"#"]')
	const r = parse(s)
	t.equal(r[1], r)
	t.end()
})

tap.test('shared array', t => {
	const a = [1,2]
	const s = stringify({ a, b: a })
	t.equal(s, '{"a":[1,2],"b":<link>"#/a"}')
	const r = parse(s)
	t.equal(r.a, r.b)
	t.end()
})

tap.test('object shared via toJSON', t => {
	const inner = { v: 1 }
	class W { toJSON() { return { p: inner, q: inner } } }
	const s = stringify(new W())
	t.equal(s, '{"p":{"v":1},"q":<link>"#/p"}')
	const r = parse(s)
	t.equal(r.p, r.q)
	t.end()
})

tap.test('shared typed strings are written twice, without ids', t => {
	const d = new String('2020-01-01')
	JSONTag.setType(d, 'date')
	t.equal(stringify({ a: d, b: d }), '{"a":<date>"2020-01-01","b":<date>"2020-01-01"}')
	t.end()
})

tap.test('existing ids are used for links', t => {
	const o = { name: 'Foo' }
	JSONTag.setAttribute(o, 'id', 'foo')
	const s = stringify({ a: o, b: o })
	t.equal(s, '{"a":<object id="foo">{"name":"Foo"},"b":<link>"foo"}')
	const r = parse(s)
	t.equal(r.a, r.b)
	t.end()
})

tap.test('keys with / and ~ are escaped', t => {
	const k = {}
	const s = stringify({ 'a/b': { 'c~d': k }, z: k })
	t.equal(s, '{"a/b":{"c~d":{}},"z":<link>"#/a~1b/c~0d"}')
	const r = parse(s)
	t.equal(r.z, r['a/b']['c~d'])
	t.end()
})

tap.test('links into plain JSON subtrees (parsed by the JSON.parse fast path)', t => {
	const s = '{"list":[{"a":1},{"b":2}],"pick":<link>"#/list/1"}'
	const r = parse(s)
	t.equal(r.pick, r.list[1])
	t.end()
})

tap.test('deep graph', t => {
	const n = 2000
	const people = []
	for (let i=0; i<n; i++) people.push({ name: 'p'+i })
	for (let i=0; i<n; i++) people[i].friend = people[(i*7919)%n]
	const r = parse(stringify({ people }))
	t.ok(r.people.every((p,i) => p.friend === r.people[(i*7919)%n]))
	t.end()
})

tap.test('forward path links are rejected', t => {
	t.throws(() => parse('{"a":<link>"#/b","b":{}}'), /forward path link/)
	t.end()
})

tap.test('path links are local to each document', t => {
	const p = new PathParser()
	const a = p.parse('{"x":{"v":"a"},"y":<link>"#/x"}')
	const b = p.parse('{"x":{"v":"b"},"y":<link>"#/x"}')
	t.equal(a.y, a.x)
	t.equal(b.y, b.x)
	t.equal(p.meta.unresolved.size, 0)
	t.end()
})
