import tap from 'tap'
import TSON from '../src/TSON.mjs'

tap.test('Create', t => {
	let d = []
	t.equal(TSON.getType(d), 'array')
	t.equal(TSON.stringify(d), '<array>[]')
	t.end()
})

tap.test('Entries', t => {
	let d = []
	d.push('foo')
	d.push('bar')
	t.equal(TSON.stringify(d), '<array>["foo","bar"]')
	t.end()
})