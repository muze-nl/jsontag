import JSONTag from '../src/JSONTag.mjs'
import tap from 'tap'

tap.test('Stringify', t => {
	let o = {
		'name': 'John',
		'number': 3,
		'bool': true, 
		'null': null
	}
	let result = JSONTag.stringify(o)
	t.equal(result, '{"name":"John","number":3,"bool":true,"null":null}')
	t.end()
})

tap.test('Stringify', t => {
	let o = {
		'name': 'John'
	}
	let result = JSONTag.stringify(o, null, 4)
	t.equal(result, `{
    "name":"John"
}`)
	t.end()
})

tap.test('Circular', t => {
	let o = {
		foo: {
			bar: {
				name: 'Bar'
			}
		}
	}
	o.foo.bar.parent = o.foo
	let result = JSONTag.stringify(o)
	let newO = JSONTag.parse(result)
	t.same(o, newO)
	t.end()
})
