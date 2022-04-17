import TSON from '../src/TSON.mjs'
import tap from 'tap'

tap.test('Stringify', t => {
	let o = {
		'name': 'John'
	}
	let result = TSON.stringify(o)
	t.equal(result, '{"name":"John"}')
	t.end()
})
