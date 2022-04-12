import TSON from '../src/TSON.mjs'
import tap from 'tap'

tap.test('Parse', t => {
	let tson = `<Person>{"name":"John"}`
	let result = TSON.parse(tson)
	t.equal(result, true)
	t.end()
})