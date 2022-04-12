import TSONObject from '../src/lib/Object.mjs'
import tap from 'tap'

tap.test('Create', t => {
	let d = new TSONObject()
	t.equal(d.toTSON(), '<object>{}')
	t.end()
})

tap.test('Properties', t => {
	let d = new TSONObject()
	d.foo = 'Bar'
	t.equal(d.toTSON(), '<object>{"foo":"Bar"}')
	t.end()
})