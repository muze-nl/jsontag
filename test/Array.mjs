import tap from 'tap'
import JSONTag from '../src/JSONTag.mjs'

tap.test('Create', t => {
	let d = []
	t.equal(JSONTag.getType(d), 'array')
	t.equal(JSONTag.stringify(d), '[]')
	t.end()
})

tap.test('Entries', t => {
	let d = []
	d.push('foo')
	d.push('bar')
	t.equal(JSONTag.stringify(d), '["foo","bar"]')
	t.end()
})

tap.test('clone', t => {
	let d = JSONTag.parse('<array class="Persons">[{"name":"John"}]')
	let c = JSONTag.clone(d)
	let jsontag = JSONTag.stringify(c)
	t.equal(jsontag, JSONTag.stringify(d))
	t.end()
})