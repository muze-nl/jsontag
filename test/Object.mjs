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

tap.test('Class', t => {
	let d = new TSONObject()
	d.setAttribute('class','Person')
	d.name = 'John'
	t.equal(d.toTSON(), '<Person>{"name":"John"}')
	t.end()
})

tap.test('Class2', t => {
	let d = new TSONObject()
	d.setAttribute('class','Person')
	d.addAttribute('class','User')
	d.name = 'John'
	t.equal(d.toTSON(), '<object class="Person User">{"name":"John"}')
	t.end()
})