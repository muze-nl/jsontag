import TSON from '../src/TSON.mjs'
import tap from 'tap'

tap.test('Create', t => {
	let d = {}
	t.equal(TSON.stringify(d), '<object>{}')
	t.end()
})

tap.test('Properties', t => {
	let d = { foo: 'Bar' }
	t.equal(TSON.stringify(d), '<object>{"foo":"Bar"}')
	t.end()
})

tap.test('Class', t => {
	let d = { name: "John"}
	TSON.setAttribute(d, 'class','Person')
	t.equal(TSON.stringify(d), '<Person>{"name":"John"}')
	t.end()
})

tap.test('Class2', t => {
	let d = {}
	TSON.setAttribute(d, 'class','Person')
	TSON.addAttribute(d, 'class','User')
	d.name = 'John'
	t.equal(TSON.stringify(d), '<object class="Person User">{"name":"John"}')
	t.end()
})

tap.test('foo', t => {
	let d = new TSON.UUID('5d98b6e3-8feb-4163-be4d-c56446371e89')
	t.end()
})