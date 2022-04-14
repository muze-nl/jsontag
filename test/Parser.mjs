import TSON from '../src/TSON.mjs'
import tap from 'tap'

tap.test('Parse', t => {
	let tson = `<Person>{"name":"John"}`
	let result = TSON.parse(tson)
	console.log(1)
	t.same(result, JSON.parse('{"name":"John"}'))
	console.log(2)
	t.equal(TSON.getType(result), 'object')
	console.log(3)
	t.end()
})