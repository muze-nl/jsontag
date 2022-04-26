import TSON from '../src/TSON.mjs'
import tap from 'tap'

tap.test('Stringify', t => {
	let o = {
		'name': 'John',
		'number': 3,
		'bool': true, 
		'null': null
	}
	let result = TSON.stringify(o)
	t.equal(result, '{"name":"John","number":3,"bool":true,"null":null}')
	t.end()
})

tap.test('Stringify', t => {
	let o = {
		'name': 'John'
	}
	let result = TSON.stringify(o, null, 4)
	t.equal(result, `{
    "name":"John"
}`)
	t.end()
})

