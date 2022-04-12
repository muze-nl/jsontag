import TSONArray from '../src/lib/Array.mjs'
import tap from 'tap'

tap.test('Create', t => {
	let d = new TSONArray()
	t.equal(d.toTSON(), '<array>[]')
	t.end()
})

tap.test('Entries', t => {
	let d = new TSONArray()
	d.push('foo')
	d.push('bar')
	t.equal(d.toTSON(), '<array>["foo","bar"]')
	t.end()
})