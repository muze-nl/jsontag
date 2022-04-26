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