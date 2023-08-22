import JSONTag from '../src/JSONTag.mjs'
import tap from 'tap'

tap.test('Create', t => {
	let d = {}
	t.equal(JSONTag.stringify(d), '{}')
	t.end()
})

tap.test('Properties', t => {
	let d = { foo: 'Bar' }
	t.equal(JSONTag.stringify(d), '{"foo":"Bar"}')
	t.end()
})

tap.test('Class', t => {
	let d = { name: "John"}
	JSONTag.setAttribute(d, 'class','Person')
	t.equal(JSONTag.stringify(d), '<object class="Person">{"name":"John"}')
	t.end()
})

tap.test('Class2', t => {
	let d = {}
	JSONTag.setAttribute(d, 'class','Person')
	JSONTag.addAttribute(d, 'class','User')
	d.name = 'John'
	t.equal(JSONTag.stringify(d), '<object class="Person User">{"name":"John"}')
	t.end()
})

tap.test('clone', t => {
	let d = JSONTag.parse('<object class="Person">{"name":"John"}')
	let c = JSONTag.clone(d)
	let jsontag = JSONTag.stringify(c)
	t.equal(jsontag, JSONTag.stringify(d))
	t.end()
})
